#!/usr/bin/env node
// tighten-lesson.mjs — ruthless redundancy/bloat pass. Reads a lesson's prose and,
// for each prose block, decides: keep, delete, or rewrite (tighter). Cuts every
// re-explanation of a concept a prior lesson already taught, every fact stated
// more than once, and every filler sentence. Leaves notation / play / keyboard /
// questions / task blocks untouched (structure preserved).
//
//   node scripts/tighten-lesson.mjs theory/3/4            (preview: prints the plan)
//   node scripts/tighten-lesson.mjs theory/3/4 --apply    (writes the changes)
import { readFileSync } from "node:fs";
const env = {};
for (const l of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/\r$/, "").replace(/^["']|["']$/g, ""); }
const SB = env.SUPABASE_URL, AK = env.ANTHROPIC_API_KEY;
const H = { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` };
const strip = s => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
const apply = process.argv.includes("--apply");
const arg = process.argv[2];

async function getJSON(p) { return (await fetch(`${SB}/rest/v1/${p}`, { headers: H })).json(); }
let target;
if (/^\w+\/\d+\/\d+$/.test(arg)) { const [c, l, s] = arg.split("/"); target = (await getJSON(`lessons?course=eq.${c}&level=eq.${l}&sort_order=eq.${s}&select=*`))[0]; }
else target = (await getJSON(`lessons?id=eq.${arg}&select=*`))[0];
if (!target) { console.error("not found"); process.exit(1); }
if (target.status !== "draft") { console.error("not draft"); process.exit(1); }
const B = target.blocks;
const siblings = await getJSON(`lessons?course=eq.${target.course}&select=level,sort_order,title,blocks&order=level,sort_order`);
const priors = siblings.filter(s => s.level < target.level || (s.level === target.level && s.sort_order < target.sort_order))
  .map(s => `L${s.level}#${s.sort_order} ${s.title}`).join("\n");

const PROSE = new Set(["heading", "text", "callout", "example"]);
const proseBlocks = B.map((b, i) => PROSE.has(b.type) ? { block: i, type: b.type, text: b.md ?? b.text ?? "" } : null).filter(Boolean);

const SYSTEM = `You are a ruthless editor tightening a Level 3 piano THEORY lesson for a reader who has ALREADY completed Levels 1 and 2. Your job: cut bloat so nothing is said twice and nothing already-known is re-explained. Readers drop off when a lesson repeats itself.

CUT HARD:
- Any re-explanation of a concept taught in an earlier lesson (what a key signature is / that it goes after the clef, what a flat or sharp or semitone is, what a relative minor is, what a tonic triad is, what a natural sign does, the "one-at-a-time" pattern, the order of sharps/flats). The reader knows these. Do NOT even "briefly recap" them with "as you learned…"; just USE them. Delete the recap sentence entirely.
- Any FACT stated more than once across the lesson (e.g. "E major has four sharps F#, C#, G#, D#", "its relative minor is C# minor", "they share the key signature"). Keep the single clearest statement; delete or shorten the rest. Intros, section bodies, summaries and key-terms lists routinely repeat the same facts — collapse them.
- Filler and throat-clearing ("You have come a long way", "Take a moment to…", "Notice that…", "Here is a…", "Let's…"), and over-worked step-by-step derivations where one line does the job.

KEEP:
- The genuinely NEW content of THIS lesson (the specific scales, key signatures, triads for these keys) — stated once, tightly.
- Headings (unless a whole section is deleted), and anything that sets up a notation/audio/task/quiz block that follows.

You are given only the prose blocks (notation, audio, keyboards, tasks and quizzes are not shown but still sit between them, so keep a heading/setup line if a block clearly introduces one). For EACH prose block return an action:
- "keep": leave as-is.
- "delete": remove the block entirely (redundant or re-explaining known material).
- "rewrite": replace with much tighter text (provide "text", Markdown, no em dashes, "stave" not "staff").

Return ONLY JSON: {"edits":[{"block":<int>,"action":"keep|delete|rewrite","text":"<only if rewrite>","why":"<short>"}]}. Every block index in the input MUST appear exactly once.`;

const user = `LESSON: "${target.title}" (Level ${target.level}).\nPRIOR LESSONS (already taught — do not re-explain their concepts):\n${priors}\n\nPROSE BLOCKS:\n${JSON.stringify(proseBlocks, null, 1)}`;

let r, lastErr;
for (let attempt = 1; attempt <= 6; attempt++) {
  r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "x-api-key": AK, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-opus-4-8", max_tokens: 16000, thinking: { type: "adaptive" }, system: SYSTEM, messages: [{ role: "user", content: user }] })
  });
  if (r.ok) break;
  lastErr = await r.text();
  if (r.status === 429 || r.status >= 500) { console.error(`  ${r.status} (attempt ${attempt}), backing off...`); await new Promise(z => setTimeout(z, 4000 * attempt)); continue; }
  break;
}
if (!r.ok) { console.error(r.status, lastErr); process.exit(1); }
const j = await r.json();
const txt = (j.content || []).filter(c => c.type === "text").map(c => c.text).join("\n");
const edits = JSON.parse(txt.match(/\{[\s\S]*\}/)[0]).edits;

const wc = s => strip(s).split(/\s+/).filter(Boolean).length;
let before = 0, after = 0, del = 0, rw = 0;
const byBlock = new Map(edits.map(e => [e.block, e]));
for (const pb of proseBlocks) {
  const e = byBlock.get(pb.block); before += wc(pb.text);
  if (!e || e.action === "keep") { after += wc(pb.text); continue; }
  if (e.action === "delete") { del++; console.log(`DELETE [#${pb.block} ${pb.type}] ${strip(pb.text).slice(0, 70)}  <- ${e.why || ""}`); }
  else if (e.action === "rewrite") { rw++; after += wc(e.text); console.log(`REWRITE [#${pb.block}] ${wc(pb.text)}->${wc(e.text)}w :: ${strip(e.text).slice(0, 90)}`); }
}
console.log(`\nprose words ${before} -> ${after}  (delete ${del} blocks, rewrite ${rw}); ${apply ? "APPLYING" : "preview only (add --apply)"}`);

if (apply) {
  const keep = [];
  for (let i = 0; i < B.length; i++) {
    const e = byBlock.get(i);
    if (e && e.action === "delete") continue;
    if (e && e.action === "rewrite") { const b = B[i]; const f = b.md != null ? "md" : "text"; b[f] = e.text; keep.push(b); }
    else keep.push(B[i]);
  }
  const up = await fetch(`${SB}/rest/v1/lessons?id=eq.${target.id}`, { method: "PATCH", headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ blocks: keep }) });
  console.log("applied:", up.ok, "| blocks", B.length, "->", keep.length);
}
