// lesson-ai — Claude-backed drafting for Lesson Studio (owner-only authoring).
//
// Ported from the Netlify function to a Supabase edge function: Netlify's standard
// functions buffer the response and cap wall-clock time (~10-26s), so longer
// generations returned a 504. Supabase edge functions stream and allow a far
// longer wall-clock budget, which is what whole-lesson drafting needs.
//
// The Studio orchestrates several short calls, each returning a streamed tool-call
// JSON the client concatenates and JSON.parses:
//   { mode:"outline",  course, level, title?, topic, priorConcepts? }
//   { mode:"section",  course, level, title, section, outline?, priorConcepts? }
//   { mode:"wrap",     course, level, title, outline? }
//   { mode:"quiz",     course, level, title, outline? }
//   { mode:"block",    block, instruction, course?, level? }
//
// Owner-gated: verifies the caller's Supabase JWT is the owner. Needs the
// ANTHROPIC_API_KEY secret (supabase secrets set ANTHROPIC_API_KEY=...).

const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const OWNER_EMAIL = "matthew@matthewcawood.com";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
- play:      { "type":"play", "label":"Four half notes, counting 1-2 each", "notes":["C4","C4","C4","C4"], "style":"sequence", "beats":[2,2,2,2], "bpm":60, "click":true }
             //   Sounds the notes on a real piano in the lesson. Note names are
             //   scientific pitch: C4 = middle C, sharps "#", flats "b" (e.g. "F#4","Bb3").
             //   style "chord" = all together; "sequence" = one after another (scales, melodies, intervals heard melodically).
             //   FOR RHYTHM, use style "sequence" with "beats": a per-note array of how many beats each note lasts,
             //   matched 1:1 to the notes (2 = half note, 1 = quarter, 4 = whole, 1.5 = dotted quarter, 0.5 = eighth).
             //   Also set "bpm" (tempo) and "click":true to sound a metronome ticking each beat. This is how you make
             //   a clip play TRUE note lengths (e.g. half notes vs quarter notes). Omit beats/bpm for plain even playback.
             //   USE THIS generously whenever the learner should HEAR something:
             //   intervals, chords, scales, rhythms, "listen to the difference between...". It needs no audio file.
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
Write for an adult beginner learner. Hard rules:

VOICE & STYLE
- Short sentences. Warm, encouraging, plain English. No unexplained jargon.
- Use concrete at-the-piano examples ("play C, then the next white key up").
- NEVER use em dashes (use commas, full stops, or "and"). NEVER use emojis.
- NEVER mention "the exam", ABRSM, or any exam. This is not exam preparation.
- Do not write "met"/"meet" (e.g. "you will meet X"); use learn/see/use/find/hear.

BUILD ON PRIOR LESSONS, DO NOT RE-TEACH (the most important rule)
- This lesson sits in a sequence. Anything covered in an earlier lesson (see the
  prior-lessons note above) is ALREADY KNOWN. Recap it in ONE short line
  ("In a previous lesson you learned X"), never re-define or re-teach it.
- Refer to earlier material generically ("in a previous lesson", "in Level 1"),
  NEVER by lesson title (learners do not remember titles).
- Teach only the genuinely NEW part. Define each new term ONCE, then reuse it.
  Do not repeat the same point across sections. One example + one short check per
  idea. A small topic should read short, do not pad it.

NOTE & REST NAMES (American-primary, British in brackets on FIRST use only)
- "quarter note (crotchet)", "half note (minim)", "eighth note (quaver)",
  "whole note (semibreve)", "sixteenth note (semiquaver)"; rests "quarter rest",
  "whole rest". After first use, bare American. NEVER put the British word first
  ("crotchet (quarter note)" is WRONG; "quarter note (crotchet)" is right).

NOTATION (abc) MUST BE METRICALLY CORRECT
- Every bar fills its time signature exactly (notes + rests sum to the bar); never
  over- or under-fill. For a plain note display with no rhythm (a scale, or notes
  to name), use M:none so there is no bar-fill expectation.
- A whole-bar rest is ONE rest that exactly fills the bar (z4 in 4/4 at L:1/4, z6
  in 6/8). NEVER use Z (that renders as a multi-measure rest).
- Match the L: unit to the durations written (with L:1/4, "C" is a quarter note).
- Beams exist ONLY on eighth notes and shorter; never beam quarter or half notes.
- A grand staff is ONE tune with two voices (V:1 clef=treble / V:2 clef=bass),
  NEVER two separate X: tunes.
- ABC octave: C = middle C (C4), C, = C3, C,, = C2, c = C5, c' = C6.

AUDIO (play blocks)
- play.notes are absolute pitches ("C4", "F#3"); a rest is "r".
- For real rhythm use beats[] (quarter=1, eighth=0.5, half=2, triplet-eighth=1/3);
  beats[].length must equal notes[].length and sum to the bar. Include rests as "r".

This is a draft for human review; accuracy matters more than length.
`.trim();

const SKELETON_NOTE = `
This lesson is part of a structured course and follows a fixed shape: learning
objectives, then teaching content, then a playing connection, key terms, and a
summary, then a quiz. You are writing the TEACHING CONTENT sections only.
Teach with concrete examples: use "notation" blocks to show anything read on a
stave (note values, key signatures, clefs, intervals written out), "play" blocks
so the learner can hear it, and "keyboard" blocks to show it on the keys. Reach
for these rather than describing sound or notation in words alone.
`.trim();

const COURSE_LABEL: Record<string, string> = { theory: "Music Theory", ear: "Ear Training", improv: "Improvisation" };

const OUTLINE_TOOL = {
  name: "emit_outline",
  description: "Return the lesson's title, summary, and an ordered plan of sections.",
  input_schema: {
    type: "object",
    properties: {
      title:       { type: "string", description: "A clear, specific lesson title." },
      summary:     { type: "string", description: "One sentence on what the learner can do after this lesson." },
      objectives:  { type: "array", description: "1 to 3 plain-language learning objectives, each phrased as something the learner can DO by the end (e.g. 'Name any note on the treble stave').", items: { type: "string" } },
      est_minutes: { type: "integer", description: "Rough minutes to complete (reading + audio/notation/quizzes), 15 to 40. A focused single-concept lesson is ~20; a lesson with several scales/keys/examples is ~35." },
      sections: {
        type: "array",
        description: "4 to 7 sections, in teaching order, each building on the last.",
        items: {
          type: "object",
          properties: {
            heading: { type: "string", description: "Short section heading." },
            focus:   { type: "string", description: "One or two sentences on exactly what this section should teach." },
          },
          required: ["heading", "focus"],
        },
      },
    },
    required: ["title", "summary", "objectives", "est_minutes", "sections"],
  },
};

const BLOCKS_TOOL = {
  name: "emit_blocks",
  description: "Return the content blocks. See the system prompt for the exact shape of each block type.",
  input_schema: { type: "object", properties: { blocks: { type: "array", items: { type: "object" } } }, required: ["blocks"] },
};

const BLOCK_TOOL = {
  name: "emit_block",
  description: "Return the single rewritten content block.",
  input_schema: { type: "object", properties: { block: { type: "object" } }, required: ["block"] },
};

function baseSystem(course: string, level: number, priorConcepts?: string) {
  const c = COURSE_LABEL[course] || "Music";
  const prior = (priorConcepts || "").trim();
  return [
    `You are an expert piano teacher and curriculum writer for "The Practice Room", a piano-practice app.`,
    `Course: ${c}. Level: ${level} of 5 (1 = absolute beginner, 5 = advanced).`,
    prior
      ? `The learner has already covered these earlier lessons, so you may build on them without re-teaching from scratch: ${prior}.`
      : `Assume this may be one of the learner's first lessons in this course.`,
    "",
    STYLE_RULES,
  ].join("\n");
}

function buildRequest(body: any) {
  const course = body.course;
  const level = body.level || 1;
  const c = COURSE_LABEL[course] || "Music";

  if (body.mode === "outline") {
    const titleHint = (body.title || "").trim();
    const system = baseSystem(course, level, body.priorConcepts) +
      `\n\nPlan a single, focused, bite-sized lesson that teaches only the genuinely NEW material for this step, in a logical order. Recap (do not re-teach) anything from prior lessons. If the topic is large (e.g. several keys or intervals), prefer splitting it rather than one bloated lesson. Return ONLY by calling emit_outline.`;
    const user = titleHint
      ? `Plan a ${c} lesson for level ${level} on: "${titleHint}".${body.topic ? " Extra guidance: " + body.topic : ""}`
      : `Plan a ${c} lesson for level ${level} on: ${body.topic || "an appropriate next topic for this level"}.`;
    return { model: MODEL, max_tokens: 4000, stream: true, system, tools: [OUTLINE_TOOL],
      tool_choice: { type: "tool", name: "emit_outline" }, messages: [{ role: "user", content: user }] };
  }

  if (body.mode === "section") {
    const sec = body.section || {};
    const arc = Array.isArray(body.outline) && body.outline.length
      ? `\n\nFor context, the full lesson is structured as these sections (do NOT cover the others, only yours): ${body.outline.map((s: any, i: number) => `${i + 1}. ${s.heading || s}`).join("; ")}.`
      : "";
    const system = baseSystem(course, level, body.priorConcepts) + arc +
      `\n\n${SKELETON_NOTE}\n\n${BLOCK_SCHEMA_DOC}\n\nWrite ONLY the blocks for one section. Start with a heading block (size 2) for the section title. Then teach it thoroughly with a few text, callout, and example blocks, plus notation / play / keyboard blocks wherever the learner should see, hear, or read the idea, and where useful a task block. Include exactly ONE inline questions block (mode "inline", 2 or 3 questions) that checks just this section. Do not write a whole-lesson quiz. Do not repeat other sections. Return ONLY by calling emit_blocks.`;
    const user = `Lesson title: "${body.title || ""}". Write the section titled "${sec.heading || ""}". What it must teach: ${sec.focus || sec.heading || ""}.`;
    return { model: MODEL, max_tokens: 6000, stream: true, system, tools: [BLOCKS_TOOL],
      tool_choice: { type: "tool", name: "emit_blocks" }, messages: [{ role: "user", content: user }] };
  }

  if (body.mode === "quiz") {
    const arc = Array.isArray(body.outline) && body.outline.length
      ? ` The lesson covered: ${body.outline.map((s: any) => s.heading || s).join("; ")}.`
      : "";
    const system = baseSystem(course, level) +
      `\n\n${BLOCK_SCHEMA_DOC}\n\nReturn ONLY by calling emit_blocks with a SINGLE block: a "questions" block with "mode":"quiz", a short title like "Check yourself", and 5 questions that test the whole lesson. Mix mcq, truefalse and short kinds. Give every question an "explain". Keep questions answerable from the lesson.`;
    const user = `Write the end-of-lesson quiz for the lesson titled "${body.title || ""}".${arc}`;
    return { model: MODEL, max_tokens: 3500, stream: true, system, tools: [BLOCKS_TOOL],
      tool_choice: { type: "tool", name: "emit_blocks" }, messages: [{ role: "user", content: user }] };
  }

  if (body.mode === "wrap") {
    const arc = Array.isArray(body.outline) && body.outline.length
      ? ` The lesson covered: ${body.outline.map((s: any) => s.heading || s).join("; ")}.`
      : "";
    const system = baseSystem(course, level, body.priorConcepts) +
      `\n\n${BLOCK_SCHEMA_DOC}\n\nReturn ONLY by calling emit_blocks with the lesson's CLOSING blocks, in this exact order:\n` +
      `1. A heading (size 2) "Playing connection", then ONE short text block on where this shows up at the keyboard or in real repertoire.\n` +
      `2. A heading (size 2) "Key terms", then ONE text block listing each new term as a markdown list, "- **term**: plain-language definition".\n` +
      `3. A heading (size 2) "Summary", then ONE text block with a short markdown bullet list recapping the must-know points.\n` +
      `Do NOT include a quiz here. Do NOT re-teach. Keep it tight.`;
    const user = `Write the closing Playing connection, Key terms and Summary for the lesson titled "${body.title || ""}".${arc}`;
    return { model: MODEL, max_tokens: 3000, stream: true, system, tools: [BLOCKS_TOOL],
      tool_choice: { type: "tool", name: "emit_blocks" }, messages: [{ role: "user", content: user }] };
  }

  if (body.mode === "block") {
    const system = baseSystem(course, level) +
      `\n\n${BLOCK_SCHEMA_DOC}\n\nYou will be given one block and an instruction. Return the improved block ONLY by calling emit_block. Keep the same block "type" unless the instruction clearly asks to change it.`;
    const user = [
      "Current block (JSON):", "```json", JSON.stringify(body.block ?? {}, null, 2), "```", "",
      "Instruction: " + (body.instruction || "Make this clearer and simpler for a beginner."),
    ].join("\n");
    return { model: MODEL, max_tokens: 4000, stream: true, system, tools: [BLOCK_TOOL],
      tool_choice: { type: "tool", name: "emit_block" }, messages: [{ role: "user", content: user }] };
  }

  return null;
}

const jsonError = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), { status, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return jsonError(405, "Use POST.");

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return jsonError(500, "ANTHROPIC_API_KEY is not set on the server.");

  // ── Owner-only: this endpoint spends Claude tokens, so verify the caller ──
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return jsonError(401, "Unauthorised");
  let caller: string | undefined;
  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
    });
    if (!userRes.ok) return jsonError(401, "Unauthorised");
    caller = (await userRes.json())?.email;
  } catch { return jsonError(401, "Unauthorised"); }
  if (!caller || caller.toLowerCase() !== OWNER_EMAIL) return jsonError(403, "Forbidden");

  let body: any;
  try { body = await req.json(); } catch { return jsonError(400, "Invalid JSON body."); }

  const payload = buildRequest(body);
  if (!payload) return jsonError(400, "mode must be one of: outline, section, wrap, quiz, block.");

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const fail = (msg: string) => controller.enqueue(encoder.encode("\n__ERROR__" + msg));
      try {
        let upstream: Response;
        try {
          upstream = await fetch(ANTHROPIC_URL, {
            method: "POST",
            headers: { "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION, "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (e: any) { fail("Could not reach the Claude API: " + (e?.message || e)); return; }

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          fail("Claude API error (" + (upstream.status || "?") + "): " + detail.slice(0, 300));
          return;
        }

        const reader = upstream.body.getReader();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let sep: number;
          while ((sep = buf.indexOf("\n\n")) !== -1) {
            const rawEvent = buf.slice(0, sep);
            buf = buf.slice(sep + 2);
            for (const line of rawEvent.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (!data || data === "[DONE]") continue;
              let evt: any;
              try { evt = JSON.parse(data); } catch { continue; }
              if (evt.type === "content_block_delta" && evt.delta?.type === "input_json_delta" && evt.delta.partial_json) {
                controller.enqueue(encoder.encode(evt.delta.partial_json));
              } else if (evt.type === "error") {
                fail(evt.error?.message || "generation error");
              }
            }
          }
        }
      } catch (e: any) {
        fail(e?.message || "stream error");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { ...cors, "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
});
