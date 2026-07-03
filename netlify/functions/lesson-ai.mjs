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
             //   For a MELODY, use "sequence" and add a "beats" array with one number per note = its
             //   length in beats (half note = 2, quarter = 1, eighth = 0.5), and put null in "notes"
             //   for a REST (silent for its beats). This makes the played melody match the written
             //   rhythm and rests exactly. "notes", "beats" (and optional "gains") must be equal length.
             //   Optional "bpm". USE play generously whenever the learner should HEAR something:
             //   intervals, chords, scales, "listen to the difference between...". It needs no audio file.
- keyboard:  { "type":"keyboard", "label":"C major triad", "highlight":["C4","E4","G4"], "from":"C4", "to":"C6" }
             //   An interactive piano: highlighted keys are coloured and the learner can
             //   click ANY key to hear it, plus a Play button sounds the highlighted notes.
             //   USE THIS to SHOW where notes sit, or the shape of a chord/scale on the keys.
             //   "from"/"to" are optional (a tidy range around the highlights is chosen automatically).
- notation:  { "type":"notation", "abc":"X:1\\nM:4/4\\nL:1/4\\nK:C\\nC D E F | G2 A2 | c4 |]", "caption":"..." }
             //   Printed staff notation, rendered from ABC notation. USE THIS whenever the
             //   learner must READ something on a stave: note values, rests, clefs, ledger
             //   lines, key signatures, time signatures, beaming, scales/intervals written out.
             //   ABC essentials: "M:" time signature, "L:" default note length (use 1/4),
             //   "K:" key (e.g. "K:G", "K:F", or "K:G clef=bass" for bass clef). Notes A-G;
             //   lower octave "C,", higher octave "c"; sharp "^C", flat "_B", natural "=F";
             //   length multipliers after the note ("C2" = twice L:, "C4" = four times);
             //   bar lines "|", final bar "|]". Keep snippets short (1 to 2 bars). Always
             //   include K: (it sets the clef and key). Include M: and L: only when you write
             //   real notes; for a BLANK or illustrative stave (e.g. "count the lines and
             //   spaces") omit M: and fill a bar with INVISIBLE rests "x" so the empty stave
             //   still draws, with no time signature or visible rest, e.g. "X:1\\nK:C\\nx8 |]".
             //   ACCURACY (a wrong stave draws a broken bar): in a sharp/flat key the key
             //   signature already alters the notes, so write just the letter (K:G makes every F
             //   an F#); add ^ (sharp) _ (flat) = (natural) ONLY for an accidental outside the
             //   key, and NEVER write "#" or "b" after a note. Staccato is a dot BEFORE the note
             //   (".C"), not a decoration name; dynamics are !p! !mf! !f! before the note; a tempo
             //   word is Q:"Moderato". Every bar's note lengths MUST sum to the time signature (a
             //   3/4 bar = three quarter-notes). A "play" block for the same music must match it
             //   note-for-note (including rests as null entries).
             //   This is the most important block for theory reading.
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
Write for an adult learner in a structured course. Hard rules:
- This course teaches READING and understanding music, NOT passing exams. NEVER
  mention ABRSM, exams, grades, "theory papers", "theory questions/exercises", or
  "exam questions". Frame practice as the SKILLS of reading music ("things you do
  when you read a piece"), never as exam question-types.
- Spelling/terminology: say "stave" not "staff" (plural "staves"). Spell
  "practice"/"practicing"/"practiced" with a c always, even as a verb (never
  "practise"). Note names American-primary with the British name in brackets on
  FIRST use only, then American alone: "whole note (semibreve)", "half note (minim)",
  "quarter note (crotchet)", "eighth note (quaver)", "sixteenth note (semiquaver)",
  "thirty-second note (demisemiquaver)". Use the American name in titles and headings.
- RECAP, do not RE-TEACH. If a term or idea was covered in an earlier lesson (see
  prior concepts below), remind the learner in one line and USE it. Do NOT re-define
  it from scratch. Only fully define a term the first time it is genuinely introduced
  in the course. This matters most in review lessons.
- Reuse the EXACT mnemonics/terminology already taught, never invent variants.
  Standard mnemonics: treble lines "Every Good Boy Deserves Fun" (E G B D F), treble
  spaces "FACE", bass lines "Good Boys Deserve Fun Always" (G B D F A), bass spaces
  "All Cows Eat Grass" (A C E G).
- Any "common mistakes" must be REAL errors learners make when reading (forgetting to
  apply the key signature, reading a bass-clef note as treble, miscounting an interval
  by not counting both ends, missing a dot or rest). Never invent contrived ones
  (misspelling Italian terms, "naming a key without counting the sharps").
- ACCURACY IS CHECKED. Every factual claim must be correct: note positions on the
  stave (e.g. D5 is the 4th line of the treble stave; count lines E-G-B-D-F up), interval
  counts (include BOTH end notes), key signatures, and EVERY quiz answer AND its
  explanation. A "play" or "notation" block must match what the surrounding text says.
- Short sentences. Warm, encouraging, plain English. No unexplained jargon.
- Concrete at-the-piano examples ("play C, then the next white note up...").
- NEVER use em dashes; use commas, full stops, or "and". NEVER use emojis.
- This is a draft for human review; accuracy matters more than length.
`.trim();

// The house lesson shape (ABRSM-aligned, playing-focused). Every lesson follows it:
//   objectives -> teaching content -> playing connection -> key terms -> summary -> quiz.
// The opening "objectives" and the closing "playing connection / key terms / summary"
// are produced outside the per-section calls (the outline supplies objectives; the
// "wrap" mode supplies the closers). Each section here is part of "teaching content".
const SKELETON_NOTE = `
This lesson is part of a structured course and follows a fixed shape: learning
objectives, then teaching content, then a playing connection, key terms, and a
summary, then a quiz. You are writing the TEACHING CONTENT sections only.
Teach with concrete examples: use "notation" blocks to show anything read on a
stave (note values, key signatures, clefs, intervals written out), "play" blocks
so the learner can hear it, and "keyboard" blocks to show it on the keys. Reach
for these rather than describing sound or notation in words alone.
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
      summary:     { type: "string", description: "One sentence in the SECOND PERSON ('you') on what the learner can do after this lesson, e.g. 'After this lesson, you can name any note on the treble stave'. Never write 'the learner'." },
      objectives:  { type: "array", description: "1 to 3 plain-language learning objectives, each phrased in the SECOND PERSON as something YOU can DO by the end (e.g. 'You can name any note on the treble stave'). Never write 'the learner'.", items: { type: "string" } },
      est_minutes: { type: "integer", description: "Estimated minutes to complete, computed from THIS lesson's own content (do NOT cap at 30): reading time at ~170 words/min across all text, plus audio, plus ~30 seconds per quiz question, plus time for any piano tasks. A short focused lesson may be 10 to 20; a large review with many questions and tasks can be 40 to 50." },
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
    required: ["title", "summary", "objectives", "est_minutes", "sections"]
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
      `\n\n${SKELETON_NOTE}\n\n${BLOCK_SCHEMA_DOC}\n\nWrite ONLY the blocks for one section. Start with a heading block (size 2) for the section title. Then teach it thoroughly with a few text, callout, and example blocks, plus notation / play / keyboard blocks wherever the learner should see, hear, or read the idea, and where useful a task block. Include exactly ONE inline questions block (mode "inline", 2 or 3 questions) that checks just this section. Do not write a whole-lesson quiz. Do not repeat other sections. Return ONLY by calling emit_blocks.`;
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

  if (body.mode === "wrap") {
    const arc = Array.isArray(body.outline) && body.outline.length
      ? ` The lesson covered: ${body.outline.map(s => s.heading || s).join("; ")}.`
      : "";
    const system = baseSystem(course, level, body.priorConcepts) +
      `\n\n${BLOCK_SCHEMA_DOC}\n\nReturn ONLY by calling emit_blocks with the lesson's CLOSING blocks, in this exact order:\n` +
      `1. A heading (size 2) "Playing connection", then ONE short text block on where this shows up at the keyboard or in real repertoire.\n` +
      `2. A heading (size 2) "Key terms", then ONE text block listing each new term as a markdown list, "- **term**: plain-language definition".\n` +
      `3. A heading (size 2) "Summary", then ONE text block with a short markdown bullet list recapping the must-know points.\n` +
      `Do NOT include a quiz here. Do NOT re-teach. Keep it tight.`;
    const user = `Write the closing Playing connection, Key terms and Summary for the lesson titled "${body.title || ""}".${arc}`;
    return { model: MODEL, max_tokens: 1800, stream: true, system, tools: [BLOCKS_TOOL],
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
  if (!payload) return jsonError(400, "mode must be one of: outline, section, wrap, quiz, block.");

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
