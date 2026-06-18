// book-ai — Claude-backed page design for Book Studio (owner-only authoring).
//
// Takes one page's plain content and returns a designed "blocks" array in the
// Book Studio schema (heading / paragraph / concepts / example / notation /
// keyboard / spacer / divider). It also repairs obvious PDF text-extraction
// artifacts (dropped fi/fl ligatures) while keeping the author's wording.
//
// Request:  { pageText:"...", bookTitle?:"...", pageNumber?:"15" }
// Response: streamed plain text = the tool call's partial_json; the client
//           concatenates it and JSON.parses to { blocks:[...] }.
//
// Owner-gated by the caller's Supabase JWT. Needs ANTHROPIC_API_KEY secret.

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

const SCHEMA_DOC = `
You design ONE page of a beginner piano book into an ordered "blocks" array.
These are the ONLY block types. Emit the page BODY only (no running header/footer).

- heading:    { "type":"heading", "eyebrow":"Chapter 4 · Black Notes", "title":"Sharps & Flats", "rule":true }
              // The page's section title. "eyebrow" is an optional small label above it; omit if unknown.
- paragraph:  { "type":"paragraph", "text":"..." }
              // Body copy. Light markup ONLY: **bold**, \`A#\` for a note/letter name (renders emphasised),
              // [[term]] for a key term (renders gold). Use \`...\` around note letters like A, C#, Bb, "middle C".
- concepts:   { "type":"concepts", "items":[ { "glyph":"♯", "label":"A Sharp", "desc":"looks like a hashtag", "key":"1 note up" } ] }
              // 1-2 definition cards side by side. "glyph" is a big symbol (♯ ♭ or a letter). "key" is the
              // punchline shown in gold on its own line. PERFECT for "X means Y" definitions (sharp/flat, line/space, etc).
- example:    { "type":"example", "tag":"Example 1", "text":"...", "notation":{...}, "keyboard":{...}, "flip":false }
              // A worked example: short prose on the left, a stave and/or keyboard on the right.
              // "notation" and "keyboard" are each optional. "flip":true puts the visuals on the left.
- notation:   { "type":"notation", "abc":"^A", "label":"A#", "clef":"treble", "caption":"" }
              // A centred stave. "abc" is a short ABC fragment (see ABC rules). "label" prints the note name
              // under the note. "clef":"treble"|"bass". Use inside example.notation too (same fields, no caption).
- keyboard:   { "type":"keyboard", "octaves":1, "keys":[ {"name":"A","label":"A","tone":"ref"}, {"name":"A#","label":"A#","tone":"target"} ], "caption":"" }
              // A piano diagram with highlighted keys. "name" is one of C C# D D# E F F# G G# A A# B.
              // "label" is the text drawn on the key (use "#", NEVER the ♯ glyph, on keys). "tone":"ref" (light,
              // the reference note) or "target" (gold, the note being taught). 1-2 octaves. Use inside example.keyboard too.
- sequence:   { "type":"sequence", "items":["A","B","C","D","E","F","G"], "repeat":3, "sep":"·", "caption":"" }
              // A styled row of letters/words, repeated. USE THIS for the musical alphabet or any
              // letter/number sequence shown as text in the original (NOT a stave).
- spacer:     { "type":"spacer", "size":16 }
- divider:    { "type":"divider" }

For notation give "notes":[ ... ] (oct 4 = the octave starting at middle C; acc is "", "#", "b" or "n").
Each entry is a single note {"letter":"A","oct":4}, OR a chord {"ch":[{"letter":"C","oct":4},{"letter":"E","oct":4},{"letter":"G","oct":4}]}.
ANY entry may carry a "label" printed under that note, e.g. to label one specific note among several:
notes:[{"letter":"E","oct":4},{"letter":"G","oct":4},{"letter":"A","oct":4,"label":"A"}]. For anything you
cannot express that way, give a raw "abc" string instead (chords [CEG], a labelled note "_A"E). Standalone
notation blocks render full page width.

ABC rules for "abc": notes A-G; middle C is "C", the octave below is "C,", above is "c".
Sharp "^A" (= A#), flat "_B" (= Bb), natural "=F". A single note like "^A" is fine.
Keep it to one note or a tiny fragment. The renderer adds the clef and key automatically.
`.trim();

const RULES = `
HARD RULES:
- Keep the author's WORDING. Do not rewrite, summarise, or add new sentences. You are LAYING OUT existing text,
  not writing new copy. The only edits allowed are repairing obvious PDF extraction artifacts: restore dropped
  "fi"/"fl" ligatures so words read correctly (e.g. "rst"->"first", "ef cient"->"efficient", "ve"->"five",
  " ute"->"flute", " nd"->"find", "speci c"->"specific", " fth"->"fifth", " at"->"flat" where clearly the word
  "flat"), fix stray double spaces, and join words a line-break split. Never invent content.
- Turn "X means Y" / "X looks like Y" definitions into a concepts card.
- ONLY add a stave (notation) if the original page actually SHOWED notes on a stave. Do NOT invent a stave
  just because notes are mentioned in words. If the page shows a letter/number sequence as text (e.g. the
  musical alphabet "A B C D E F G" repeating), use a sequence block, NOT a stave. If the page shows a keyboard,
  use a keyboard block. If a page is purely explanatory text, it is fine to have no diagram at all.
- "the note X is here" or "this looks like this:" usually referred to a figure in the original; recreate that
  figure with the right block (notation for a stave, keyboard for keys) from the text when you are confident.
- A keyboard block MUST list at least one key in "keys". If you cannot tell which keys a figure
  highlighted, OMIT the keyboard entirely rather than emitting an empty one.
- The notation/keyboard INSIDE an "example" sit in a narrow column, so only put a SHORT figure there
  (1 to 3 notes, or a small keyboard). For anything wider, a scale, the alphabet ascending, a melody,
  a multi-note run, use a STANDALONE "notation" or "keyboard" block (full page width), not an example.
- Do NOT emit image blocks (there is no file). If a real photo is truly needed, skip it.
- NEVER use em dashes. NEVER use emojis (♯ and ♭ are musical symbols and ARE allowed as concept glyphs).
- On keyboard keys use "#" not "♯".
- This is a draft for human review; musical accuracy of diagrams will be checked by a human afterwards.
`.trim();

// Conventions that MUST be identical on every page, so the book reads as one coherent book
// rather than 49 independent guesses.
const HOUSE_STYLE = `
HOUSE STYLE (keep these IDENTICAL on every page):
- The FIRST block is always a heading. Its "title" is the page's section name (Title Case, taken from
  the content, e.g. "Treble Clef", "Bass Clef"). Its "eyebrow" is the chapter label you are given,
  used verbatim, or omitted when you are told there is none. Never invent your own eyebrow. Set "rule":true.
- Worked examples are tagged "Example 1", "Example 2", ... numbered in order WITHIN this page (restart at 1).
- Use a concepts card (not a plain paragraph) for any short "X means Y" or "X looks like Y" definition.
- Wrap note and letter names in prose in backticks: \`C\`, \`A#\`, \`middle C\`.
- The same kind of content always becomes the same kind of block, so pages stay consistent.
`.trim();

const STAFF_REF = `
READING NOTES ON A STAVE (use this to get pitches exactly right):
- Treble clef lines, bottom to top: E4 G4 B4 D5 F5. Treble spaces, bottom to top: F4 A4 C5 E5.
  Middle C (C4) sits on the first ledger line just BELOW the treble staff.
- Bass clef lines, bottom to top: G2 B2 D3 F3 A3. Bass spaces, bottom to top: A2 C3 E3 G3.
  Middle C (C4) sits on the first ledger line just ABOVE the bass staff.
- octave 4 = the octave starting at middle C. So "A in the second space" of the treble staff is A4
  (letter A, oct 4); the line above it is B4; the next space up is C5.
- CRITICAL: cross-check every note against the page's TEXT. If the text states a position
  (e.g. "A is in the second space from the bottom", "B is on the line above"), the TEXT is authoritative,
  place the notes exactly as the text says, even if the image looks ambiguous. A wrong pitch is worse
  than no stave.
`.trim();

const PAGE_TOOL = {
  name: "emit_page",
  description: "Return the designed page as an ordered blocks array.",
  input_schema: {
    type: "object",
    properties: {
      blocks: {
        type: "array",
        description: "Ordered layout blocks for this page.",
        items: { type: "object", additionalProperties: true },
      },
    },
    required: ["blocks"],
  },
};

const jsonError = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), { status, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return jsonError(405, "Use POST.");

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return jsonError(500, "ANTHROPIC_API_KEY is not set on the server.");

  // Owner-only: this endpoint spends Claude tokens.
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
  const pageText = String(body.pageText || "").slice(0, 8000);
  if (!pageText.trim()) return jsonError(400, "pageText is required.");

  // Fetch the ORIGINAL page image (private bucket) so Claude can SEE the real figures
  // (which staves/keyboards were there and exactly what notes/keys they showed).
  let imageBlock: any = null;
  const sourcePath = String(body.sourcePath || "").replace(/^\/+/, "");
  if (sourcePath) {
    try {
      const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      const imgRes = await fetch(`${SUPABASE_URL}/storage/v1/object/book-sources/${sourcePath}`, {
        headers: { Authorization: `Bearer ${svc}`, apikey: svc },
      });
      if (imgRes.ok) {
        const buf = new Uint8Array(await imgRes.arrayBuffer());
        let bin = ""; const chunk = 0x8000;
        for (let i = 0; i < buf.length; i += chunk) bin += String.fromCharCode.apply(null, buf.subarray(i, i + chunk) as any);
        imageBlock = { type: "image", source: { type: "base64", media_type: "image/jpeg", data: btoa(bin) } };
      }
    } catch { /* fall back to text-only */ }
  }

  const imageNote = imageBlock
    ? `\n\nYou are given an IMAGE of the ORIGINAL page. Read its figures directly from the image: for any stave, read the clef and the EXACT notes (which line or space, plus any sharp/flat) and reproduce them with a notation block (use the "notes" array with the right letter, octave and accidental). For any keyboard diagram, read which keys are shaded and reproduce them with a keyboard block. Only include figures the page actually shows. The extracted text below is for the wording.`
    : `\n\nNo page image is available, so infer figures from the text only, and do not invent staves that were not described.`;
  const system = `You are a book designer laying out a beginner piano book titled "${body.bookTitle || "Beginners Guide to Reading Sheet Music"}".\n\n${SCHEMA_DOC}\n\n${RULES}\n\n${HOUSE_STYLE}\n\n${STAFF_REF}\n${imageNote}\n\nReturn ONLY by calling emit_page.`;

  const eyebrow = String(body.eyebrow || "").trim();
  const eyebrowNote = eyebrow
    ? `\n\nThe heading block MUST use this exact eyebrow, verbatim: "${eyebrow}". Use the page's section title (from the content below) as the heading "title".`
    : `\n\nThis page has no chapter eyebrow: omit "eyebrow" on the heading.`;
  const userText = `Design this page (page ${body.pageNumber || "?"}).${eyebrowNote}\n\nHere is its current text content, in order:\n\n${pageText}`;
  const content = imageBlock ? [imageBlock, { type: "text", text: userText }] : userText;

  const payload = {
    model: MODEL, max_tokens: 4000, stream: true, system,
    tools: [PAGE_TOOL], tool_choice: { type: "tool", name: "emit_page" },
    messages: [{ role: "user", content }],
  };

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
