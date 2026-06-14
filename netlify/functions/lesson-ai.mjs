/* ──────────────────────────────────────────────────────────────────────────
   lesson-ai — Claude-backed drafting for Lesson Studio (owner-only authoring).

   A whole lesson takes ~30s+ to generate, which is longer than a Netlify
   function may run (sync cap is 26s). So we do NOT generate a whole lesson in
   one request. Instead the Studio orchestrates several short calls, each well
   under the cap:

     { mode: "outline", course, level, title?, topic, priorConcepts? }
        → { title, summary, est_minutes, sections: [ { heading, focus }, ... ] }
     { mode: "section", course, level, title, section, outline?, priorConcepts? }
        → { blocks: [...] }   // the blocks for ONE section
     { mode: "quiz", course, level, title, outline? }
        → { blocks: [ <one questions block, mode "quiz"> ] }
     { mode: "block", block, instruction, course?, level? }
        → { block: {...} }    // rewrite/expand ONE block

   Output is forced through a tool call so we always get valid structured JSON
   matching the block shapes in lessons-render.js / 20260610_lessons.sql.
   The response is streamed (tool-input JSON forwarded as produced); the client
   concatenates the chunks and JSON.parses the result.

   Requires ANTHROPIC_API_KEY in the Netlify site env (deployed functions do not
   read .env.local). Owner-gated: verifies the caller's Supabase JWT.
─────────────────────────────────────────────────────────────────────────── */

// Sonnet (not Opus) for drafting: each call must finish inside Netlify's function
// wall-clock cap (~26s). Opus is too slow to first token and too slow per token to
// complete a multi-thousand-token section in that window, which is what caused the
// 504s. Sonnet is fast and plenty capable for these human-reviewed beginner drafts.
const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const SUPABASE_URL  = "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5c2tmdXRtbmNwcnF4YXpnYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjIwMTYsImV4cCI6MjA5MTMzODAxNn0.ttC3plmhbA7ls_T3w25XgYT0WBt6O3MMu0G6NrEKI9g";
const OWNER_EMAIL   = "matthew@matthewcawood.com";

const BLOCK_SCHEMA_DOC = `
A lesson's "blocks" is an ordered array. Each block is one object with a "type"
field and type-specific fields. These are the ONLY allowed block types:

- heading:   { "type":"heading", "text":"...", "size":2 }   // size 2 = section, 3 = sub-section
- text:      { "type":"text", "md":"..." }                   // body copy; light markdown:
             //   **bold**, *italic*, \`code\`, [link](https://...), and - / 1. lists (one item per line)
- callout:   { "type":"callout", "style":"key", "md":"..." } // style: key | tip | note | watch
- example:   { "type":"example", "title":"...", "md":"..." } // worked example; title optional
- task:      { "type":"task", "md":"...", "share":false }    // a practice task to do at the piano
- divider:   { "type":"divider" }
- play:      { "type":"play", "label":"A perfect fifth: C to G", "notes":["C4","G4"], "style":"chord" }
             //   Sounds the notes on a real piano in the lesson. Note names are
             //   scientific pitch: C4 = middle C, sharps "#", flats "b" (e.g. "F#4","Bb3").
             //   style "chord" = all together; "sequence" = one after another (scales, melodies, intervals heard melodically).
             //   USE THIS generously whenever the learner should HEAR something:
             //   intervals, chords, scales, "listen to the difference between...". It needs no audio file.
- keyboard:  { "type":"keyboard", "label":"C major triad", "highlight":["C4","E4","G4"], "from":"C4", "to":"C6" }
             //   An interactive piano: highlighted keys are coloured and the learner can
             //   click ANY key to hear it, plus a Play button sounds the highlighted notes.
             //   USE THIS to SHOW where notes sit, or the shape of a chord/scale on the keys.
             //   "from"/"to" are optional (a tidy range around the highlights is chosen automatically).
- questions: { "type":"questions", "mode":"inline", "title":"...", "items":[ <question>, ... ] }
             //   mode "inline" = each question checked as you go; "quiz" = scored at the end.

Each question object in "items":
- mcq:       { "kind":"mcq", "prompt":"...", "options":["A","B","C","D"], "answer":0, "explain":"why" }
             //   answer = zero-based index of the correct option.
- truefalse: { "kind":"truefalse", "prompt":"...", "answer":true, "explain":"why" }
- short:     { "kind":"short", "prompt":"...", "accept":["sol","so"], "explain":"why" }
- reflect:   { "kind":"reflect", "prompt":"..." }            // open reflection, not graded.

For sound, USE "play" and "keyboard" blocks (they need no files and are musically
exact). Do NOT emit "image" or "audio" blocks: those need an uploaded file you
cannot produce. When a real photo, recording, or video genuinely helps (e.g. a
hand-position photo), write a callout (style "note") telling the author what to add,
e.g. "note: add a photo of the hand crossing here".
`.trim();

const STYLE_RULES = `
Write for a complete beginner adult learner. Hard rules:
- Assume NO prior knowledge. The first time you use any musical term (interval,
  tonic, triad, semitone, etc.), define it in plain language.
- Short sentences. Warm, encouraging, plain English. No unexplained jargon.
- Use concrete, at-the-piano examples ("play C, then the next white note up...").
- NEVER use em dashes. Use commas, full stops, or "and".
- This is a draft for human review; accuracy matters more than length.
`.trim();

const COURSE_LABEL = { theory: "Music Theory", ear: "Ear Training", improv: "Improvisation" };

// ── Tools ──
const OUTLINE_TOOL = {
  name: "emit_outline",
  description: "Return the lesson's title, summary, and an ordered plan of sections.",
  input_schema: {
    type: "object",
    properties: {
      title:       { type: "string", description: "A clear, specific lesson title." },
      summary:     { type: "string", description: "One sentence on what the learner can do after this lesson." },
      est_minutes: { type: "integer", description: "Rough minutes to complete, 5 to 30." },
      sections: {
        type: "array",
        description: "4 to 7 sections, in teaching order, each building on the last.",
        items: {
          type: "object",
          properties: {
            heading: { type: "string", description: "Short section heading." },
            focus:   { type: "string", description: "One or two sentences on exactly what this section should teach." }
          },
          required: ["heading", "focus"]
        }
      }
    },
    required: ["title", "summary", "est_minutes", "sections"]
  }
};

const BLOCKS_TOOL = {
  name: "emit_blocks",
  description: "Return the content blocks. See the system prompt for the exact shape of each block type.",
  input_schema: {
    type: "object",
    properties: { blocks: { type: "array", items: { type: "object" } } },
    required: ["blocks"]
  }
};

const BLOCK_TOOL = {
  name: "emit_block",
  description: "Return the single rewritten content block.",
  input_schema: {
    type: "object",
    properties: { block: { type: "object" } },
    required: ["block"]
  }
};

function baseSystem(course, level, priorConcepts) {
  const c = COURSE_LABEL[course] || "Music";
  const prior = (priorConcepts || "").trim();
  return [
    `You are an expert piano teacher and curriculum writer for "The Practice Room", a piano-practice app.`,
    `Course: ${c}. Level: ${level} of 5 (1 = absolute beginner, 5 = advanced).`,
    prior
      ? `The learner has already covered these earlier lessons, so you may build on them without re-teaching from scratch: ${prior}.`
      : `Assume this may be one of the learner's first lessons in this course.`,
    "",
    STYLE_RULES
  ].join("\n");
}

function buildRequest(body) {
  const course = body.course;
  const level = body.level || 1;
  const c = COURSE_LABEL[course] || "Music";

  if (body.mode === "outline") {
    const titleHint = (body.title || "").trim();
    const system = baseSystem(course, level, body.priorConcepts) +
      `\n\nPlan a single, comprehensive but beginner-friendly lesson. Cover the topic completely and in a logical order. Return ONLY by calling emit_outline.`;
    const user = titleHint
      ? `Plan a ${c} lesson for level ${level} on: "${titleHint}".${body.topic ? " Extra guidance: " + body.topic : ""}`
      : `Plan a ${c} lesson for level ${level} on: ${body.topic || "an appropriate next topic for this level"}.`;
    return { model: MODEL, max_tokens: 2000, stream: true, system, tools: [OUTLINE_TOOL],
      tool_choice: { type: "tool", name: "emit_outline" }, messages: [{ role: "user", content: user }] };
  }

  if (body.mode === "section") {
    const sec = body.section || {};
    const arc = Array.isArray(body.outline) && body.outline.length
      ? `\n\nFor context, the full lesson is structured as these sections (do NOT cover the others, only yours): ${body.outline.map((s, i) => `${i + 1}. ${s.heading || s}`).join("; ")}.`
      : "";
    const system = baseSystem(course, level, body.priorConcepts) + arc +
      `\n\n${BLOCK_SCHEMA_DOC}\n\nWrite ONLY the blocks for one section. Start with a heading block (size 2) for the section title. Then teach it thoroughly with a few text, callout, and example blocks, and where useful a task block. Include exactly ONE inline questions block (mode "inline", 2 or 3 questions) that checks just this section. Do not write a whole-lesson quiz. Do not repeat other sections. Return ONLY by calling emit_blocks.`;
    const user = `Lesson title: "${body.title || ""}". Write the section titled "${sec.heading || ""}". What it must teach: ${sec.focus || sec.heading || ""}.`;
    return { model: MODEL, max_tokens: 3500, stream: true, system, tools: [BLOCKS_TOOL],
      tool_choice: { type: "tool", name: "emit_blocks" }, messages: [{ role: "user", content: user }] };
  }

  if (body.mode === "quiz") {
    const arc = Array.isArray(body.outline) && body.outline.length
      ? ` The lesson covered: ${body.outline.map(s => s.heading || s).join("; ")}.`
      : "";
    const system = baseSystem(course, level) +
      `\n\n${BLOCK_SCHEMA_DOC}\n\nReturn ONLY by calling emit_blocks with a SINGLE block: a "questions" block with "mode":"quiz", a short title like "Check yourself", and 5 questions that test the whole lesson. Mix mcq, truefalse and short kinds. Give every question an "explain". Keep questions answerable from the lesson.`;
    const user = `Write the end-of-lesson quiz for the lesson titled "${body.title || ""}".${arc}`;
    return { model: MODEL, max_tokens: 2500, stream: true, system, tools: [BLOCKS_TOOL],
      tool_choice: { type: "tool", name: "emit_blocks" }, messages: [{ role: "user", content: user }] };
  }

  if (body.mode === "block") {
    const system = baseSystem(course, level) +
      `\n\n${BLOCK_SCHEMA_DOC}\n\nYou will be given one block and an instruction. Return the improved block ONLY by calling emit_block. Keep the same block "type" unless the instruction clearly asks to change it.`;
    const user = [
      "Current block (JSON):", "```json", JSON.stringify(body.block ?? {}, null, 2), "```", "",
      "Instruction: " + (body.instruction || "Make this clearer and simpler for a beginner.")
    ].join("\n");
    return { model: MODEL, max_tokens: 4000, stream: true, system, tools: [BLOCK_TOOL],
      tool_choice: { type: "tool", name: "emit_block" }, messages: [{ role: "user", content: user }] };
  }

  return null;
}

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { "content-type": "application/json" }
  });
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response("", { status: 204 });
  if (req.method !== "POST") return jsonError(405, "Use POST.");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return jsonError(500, "ANTHROPIC_API_KEY is not set on the server.");

  // ── Owner-only: this endpoint spends Claude tokens, so verify the caller ──
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return jsonError(401, "Unauthorised");
  let caller;
  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON }
    });
    if (!userRes.ok) return jsonError(401, "Unauthorised");
    ({ email: caller } = await userRes.json());
  } catch { return jsonError(401, "Unauthorised"); }
  if (!caller || caller.toLowerCase() !== OWNER_EMAIL) return jsonError(403, "Forbidden");

  let body;
  try { body = await req.json(); } catch { return jsonError(400, "Invalid JSON body."); }

  const payload = buildRequest(body);
  if (!payload) return jsonError(400, "mode must be one of: outline, section, quiz, block.");

  // Return the streaming response IMMEDIATELY (200 + headers), then make the
  // slow Claude call inside the stream. This guarantees Netlify never sees the
  // function as "no response yet" and so can never return a 504 — any upstream
  // failure is reported inline as an __ERROR__ marker the client already handles.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const fail = (msg) => controller.enqueue(encoder.encode("\n__ERROR__" + msg));
      try {
        let upstream;
        try {
          upstream = await fetch(ANTHROPIC_URL, {
            method: "POST",
            headers: {
              "x-api-key": apiKey,
              "anthropic-version": ANTHROPIC_VERSION,
              "content-type": "application/json"
            },
            body: JSON.stringify(payload)
          });
        } catch (e) {
          fail("Could not reach the Claude API: " + (e?.message || e));
          return;
        }

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          fail("Claude API error (" + (upstream.status || "?") + "): " + detail.slice(0, 300));
          return;
        }

        // Stream the tool-call input JSON back to the browser as it is produced.
        const reader = upstream.body.getReader();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let sep;
          while ((sep = buf.indexOf("\n\n")) !== -1) {
            const rawEvent = buf.slice(0, sep);
            buf = buf.slice(sep + 2);
            for (const line of rawEvent.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (!data || data === "[DONE]") continue;
              let evt;
              try { evt = JSON.parse(data); } catch { continue; }
              if (evt.type === "content_block_delta" &&
                  evt.delta && evt.delta.type === "input_json_delta" &&
                  evt.delta.partial_json) {
                controller.enqueue(encoder.encode(evt.delta.partial_json));
              } else if (evt.type === "error") {
                fail(evt.error?.message || "generation error");
              }
            }
          }
        }
      } catch (e) {
        fail(e?.message || "stream error");
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
  });
}
