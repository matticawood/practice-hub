#!/usr/bin/env node
// deep-audit.mjs — the SEMANTIC half of the lesson pass. Where audit-lesson.mjs
// does mechanical checks (bar maths, beam grouping, keyword reteach, house-style
// greps), this one reads EVERY block with a music-theory expert's eye — the same
// scrutiny a human gives when they point at one block and say "this is wrong" —
// and applies it to the whole lesson.
//
// For each chunk of blocks it asks Claude (Opus 4.8, adaptive thinking) to verify:
//   - every theory claim is true (scales, key sigs, intervals, semitone counts,
//     enharmonics, triads, staff positions for the clef)
//   - each notation block's ABC actually spells what its caption / body says
//     (decode the key signature + accidentals + octaves; check pitches + positions)
//   - each play block's notes match the nearby notation and its description
//   - each quiz answer is correct AND unambiguous (no second correct option)
//   - nothing is re-taught that a prior lesson already owns (recap, don't re-explain)
//   - caption vs notation vs audio vs body text all agree
//   - house style (stave not staff, no em dashes, American note names, no exam
//     framing, numeric meter counting, mnemonics consistent with Level 1)
//
//   node scripts/deep-audit.mjs theory/3/4
//   node scripts/deep-audit.mjs <lessonId>
//   node scripts/deep-audit.mjs "New Keys"
//
// Reads SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY from .env.local.
import { readFileSync, writeFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/\r$/, "").replace(/^["']|["']$/g, "");
}
const SB = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_KEY, AK = env.ANTHROPIC_API_KEY;
if (!SB || !KEY) { console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_KEY"); process.exit(1); }
if (!AK) { console.error("Missing ANTHROPIC_API_KEY in .env.local"); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const strip = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();

async function getJSON(path) { const r = await fetch(`${SB}/rest/v1/${path}`, { headers: H }); return r.json(); }

// ── resolve target ───────────────────────────────────────────────────────────
const arg = process.argv[2];
if (!arg) { console.error("Usage: node scripts/deep-audit.mjs <course/level/sort | id | title>"); process.exit(1); }
let target;
if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(arg)) target = (await getJSON(`lessons?id=eq.${arg}&select=*`))[0];
else if (/^\w+\/\d+\/\d+$/.test(arg)) { const [c, l, s] = arg.split("/"); target = (await getJSON(`lessons?course=eq.${c}&level=eq.${l}&sort_order=eq.${s}&select=*`))[0]; }
else target = (await getJSON(`lessons?title=ilike.*${encodeURIComponent(arg)}*&select=*`))[0];
if (!target) { console.error("Lesson not found:", arg); process.exit(1); }

const siblings = await getJSON(`lessons?course=eq.${target.course}&select=level,sort_order,title,blocks&order=level,sort_order`);
const B = target.blocks || [];

// ── shared context: this lesson's outline + PRIOR lessons' outlines ──────────
const outline = B.map((b, i) => b.type === "heading" ? `  #${i} ${strip(b.md || b.text || b.title)}` : null).filter(Boolean).join("\n");
const priorLessons = siblings
  .filter(s => s.level < target.level || (s.level === target.level && s.sort_order < target.sort_order))
  .map(s => {
    const hs = (s.blocks || []).filter(b => b.type === "heading").map(b => strip(b.md || b.text || b.title)).filter(Boolean);
    return `L${s.level}#${s.sort_order} "${s.title}": ${hs.join(" / ")}`;
  }).join("\n");

const HOUSE_RULES = `
HOUSE STYLE for this course (flag violations):
- "stave" (plural "staves"), never "staff".
- No em dashes anywhere; no emojis. (En dash only for numeric ranges.)
- Note names: American primary ("quarter note"); British term in parentheses only for a key-terms glossary ("crotchet").
- Teach READING music, not passing exams: no "exam", "paper", "grade", "question paper" framing.
- Mnemonics must match Level 1 (treble lines EGBDF / spaces FACE; bass lines GBDFA / spaces ACEG).
- Count meters numerically (6/8 = "1 2 3 4 5 6", not "1-and-a").
- In play blocks, null = a rest.
- RECAP prior concepts briefly ("as you learned earlier ..."); NEVER re-explain a concept a prior lesson already taught. Re-stating a rule for each new key/example is re-teaching.`;

const SYSTEM = `You are a meticulous music-theory editor doing the final correctness pass on a piano THEORY lesson before it is published to paying students. Treat every block with the scrutiny of an expert who has been asked "is this exactly right?".

The lesson is stored as an array of blocks. Types:
- heading / text / callout: prose (Markdown in "md" or "text").
- notation: an ABC-notation staff in "abc" (with a "caption"). Decode it properly: apply the K: key signature, any ^ _ = accidentals (which last to the bar line), and the , ' octave marks. Work out the SOUNDING pitches and their staff positions for the given clef, then check the caption and any surrounding text describe them correctly.
- play: an audible demo. "notes" are explicit pitches (e.g. "C4","D#5"); null = a rest. "beats" are durations. Check these match the nearby notation and the label.
- keyboard: an interactive keyboard diagram (from/to range, highlighted keys).
- questions: a quiz. Each item has a prompt, options, an "answer" (index for mcq, boolean for truefalse, "accept" list for short) and an "explain". Verify the keyed answer is correct AND that no other option is also correct (ambiguous), and that the explanation is right.

WHAT TO CHECK, per block and across blocks:
1. FACTUAL: every theory statement is true — scale spellings, key-signature contents and the ORDER of sharps/flats, semitone/tone placement, interval sizes, enharmonics, relative major/minor, tonic-triad notes, and the exact line/space a sharp or flat sits on for the stated clef.
2. NOTATION vs its own caption/text: the ABC actually spells the scale/chord/rhythm the words claim; bar-by-bar it adds up; staff-position descriptions are correct.
3. AUDIO vs notation: play "notes" match the notation and the description (pitch and rhythm), rests included.
4. QUIZ: keyed answer correct, unambiguous, explanation correct.
5. RE-TEACH: using the PRIOR LESSONS list, flag any concept that an earlier lesson already owns being re-explained here rather than briefly recapped. Re-stating the same rule for each new key is re-teaching.
6. CONSISTENCY: caption, notation, audio and body text for the same idea must agree.
7. PIANO TECHNIQUE / FINGERING: if a block gives any hand-position, finger-number or thumb instruction, verify it against real piano technique. In particular, in a major/minor scale the THUMB (finger 1) falls on WHITE keys, never on a black tonic — e.g. A flat major's thumb goes on C and F, and you do NOT start the scale on the thumb. Check any stated scale fingering matches the standard fingering for that key, and that claims like "the thumb sits on the black keys" are true (they usually are not).
8. INVENTED / FILLER (category "filler"): flag any claim stated as fact that is unsubstantiated pseudo-teaching a knowledgeable teacher would never write — invented biomechanics or "feel" descriptions ("the black keys give the fingers something to rest against", "the finger drops from a higher surface"), vague motivational padding ("many find it comfortable", "you'll soon notice", "with practice this becomes second nature"), circular or content-free sentences, and filler tasks that add nothing new. Flag these to CUT even if not strictly false. Also flag dubious counting dressed up as fact (e.g. calling A flat major "five of eight notes black" when it is four black and three white). Be willing to recommend deleting whole padded passages.
9. HOUSE STYLE (below).
${HOUSE_RULES}

Be precise and only report REAL problems (something a knowledgeable teacher would correct). Do not invent issues, and do not flag correct content. For notation, show the decoded pitches in your reasoning so your verdict is grounded.

Return ONLY a JSON object, no prose around it:
{"findings":[{"block":<int index>,"category":"factual|notation|caption-mismatch|audio-mismatch|quiz|reteach|consistency|technique|filler|house-style","severity":"high|medium|low","issue":"<what is wrong, specific>","evidence":"<the exact text / pitches that prove it>","fix":"<the concrete correction>"}]}
If a chunk has no problems, return {"findings":[]}.`;

// ── chunk the blocks (break at headings, ~14 blocks/chunk) ───────────────────
const chunks = [];
let cur = [];
for (let i = 0; i < B.length; i++) {
  if (B[i].type === "heading" && cur.length >= 14) { chunks.push(cur); cur = []; }
  cur.push(i);
}
if (cur.length) chunks.push(cur);

function blockForModel(i) {
  const b = B[i]; const o = { block: i, type: b.type };
  for (const f of ["md", "text", "title", "label", "caption", "abc", "from", "to"]) if (b[f] != null) o[f] = b[f];
  if (b.type === "play") {
    o.notes = b.notes; o.beats = b.beats; if (b.bpm) o.bpm = b.bpm;
    o.style = b.style || "chord";   // "chord" = all notes sound together; "sequence" = one after another
    if (o.style !== "sequence") o.playsHow = "All notes in 'notes' sound SIMULTANEOUSLY (a chord/together), not one after another.";
    if (Array.isArray(b.voices) && b.voices.length) {
      o.voices = b.voices;
      o.audioNote = "This block has VOICES: it plays these layered lines simultaneously (e.g. a melody voice over chord voices). The flat 'notes' array is an unused fallback; judge what is actually heard from 'voices', not 'notes'.";
    }
  }
  if (b.type === "keyboard") o.highlight = b.highlight || b.keys || b.notes;
  if (b.type === "questions") o.items = b.items;
  return o;
}

async function auditChunk(idxs, n) {
  const userText =
    `LESSON: "${target.title}" (course ${target.course}, level ${target.level}).\n\n` +
    `FULL OUTLINE of this lesson (headings):\n${outline}\n\n` +
    `PRIOR LESSONS already taught (recap these, do not re-teach):\n${priorLessons || "(none)"}\n\n` +
    `Review THESE blocks (indices ${idxs[0]}–${idxs[idxs.length - 1]}). A couple of neighbouring blocks are included for context; only report findings on blocks in this list:\n` +
    JSON.stringify(idxs.map(blockForModel), null, 1);

  const body = {
    model: "claude-opus-4-8",
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    messages: [{ role: "user", content: userText }],
  };
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": AK, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) { const t = await r.text(); if (r.status === 429 || r.status >= 500) { await new Promise(z => setTimeout(z, 1500 * attempt)); continue; } throw new Error(`${r.status} ${t.slice(0, 200)}`); }
      const j = await r.json();
      const txt = (j.content || []).filter(c => c.type === "text").map(c => c.text).join("\n");
      const m = txt.match(/\{[\s\S]*\}/);
      if (!m) return [];
      const parsed = JSON.parse(m[0]);
      return (parsed.findings || []).filter(f => idxs.includes(f.block));
    } catch (e) {
      if (attempt === 3) { console.error(`  chunk ${n} failed: ${e.message}`); return []; }
      await new Promise(z => setTimeout(z, 1500 * attempt));
    }
  }
  return [];
}

// ── run chunks with a small concurrency pool ─────────────────────────────────
console.error(`Deep-auditing "${target.title}" — ${B.length} blocks in ${chunks.length} chunks (Opus 4.8)...`);
const results = new Array(chunks.length);
let next = 0, done = 0;
const CONC = 4;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (next < chunks.length) {
    const k = next++;
    results[k] = await auditChunk(chunks[k], k + 1);
    done++; process.stderr.write(`\r  chunks done: ${done}/${chunks.length}   `);
  }
}));
process.stderr.write("\n");

const findings = results.flat().sort((a, b) => {
  const sev = { high: 0, medium: 1, low: 2 };
  return (sev[a.severity] - sev[b.severity]) || (a.block - b.block);
});

// ── report ───────────────────────────────────────────────────────────────────
console.log(`\n=== DEEP AUDIT: ${target.title} (theory L${target.level} #${target.sort_order}) ===`);
console.log(`${B.length} blocks reviewed · status ${target.status} · ${findings.length} finding(s)\n`);
if (!findings.length) console.log("No semantic issues found.");
for (const sev of ["high", "medium", "low"]) {
  const g = findings.filter(f => f.severity === sev);
  if (!g.length) continue;
  console.log(`----- ${sev.toUpperCase()} (${g.length}) -----`);
  for (const f of g) {
    console.log(`[#${f.block} ${f.category}] ${f.issue}`);
    if (f.evidence) console.log(`   evidence: ${strip(f.evidence).slice(0, 220)}`);
    console.log(`   fix: ${strip(f.fix).slice(0, 260)}\n`);
  }
}
const outFile = new URL(`../scripts/.deep-audit-L${target.level}-${target.sort_order}.json`, import.meta.url);
writeFileSync(outFile, JSON.stringify({ lesson: target.title, id: target.id, findings }, null, 2));
console.error(`(findings written to ${outFile.pathname})`);
