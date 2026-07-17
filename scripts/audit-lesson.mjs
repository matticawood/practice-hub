#!/usr/bin/env node
// audit-lesson.mjs — one-shot deterministic audit for a theory/ear/improv lesson.
// Runs the mechanical half of the 11-pass review so the human/AI only fixes what
// it flags, instead of hunting. Reusable across all courses.
//
//   node scripts/audit-lesson.mjs <lessonId>
//   node scripts/audit-lesson.mjs theory/2/5            (course/level/sort_order)
//   node scripts/audit-lesson.mjs "New Major Keys"      (title substring)
//
// Reads SUPABASE_URL + SUPABASE_SERVICE_KEY from .env.local. Pulls abcjs 6.4.4
// (cached in /tmp) to RENDER notation, not just parse it.
import { readFileSync, existsSync, writeFileSync } from "node:fs";

// ── env ──────────────────────────────────────────────────────────────────────
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/\r$/, "").replace(/^["']|["']$/g, "");
}
const URL_ = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_KEY;
if (!URL_ || !KEY) { console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_KEY in .env.local"); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

// ── flag collector ───────────────────────────────────────────────────────────
const flags = [];
const flag = (cat, msg) => flags.push({ cat, msg });
const strip = (s) => String(s == null ? "" : s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const blockText = (b) => [b.md, b.text, b.caption, b.label, b.title].filter(Boolean).join(" ");

// ── abcjs (cached) ───────────────────────────────────────────────────────────
async function loadAbcjs() {
  const cache = "/tmp/abcjs-basic-6.4.4.js";
  let src;
  if (existsSync(cache)) src = readFileSync(cache, "utf8");
  else { src = await (await fetch("https://cdn.jsdelivr.net/npm/abcjs@6.4.4/dist/abcjs-basic-min.js")).text(); writeFileSync(cache, src); }
  globalThis.window = {}; const mod = { exports: {} };
  new Function("module", "exports", "window", "self", src)(mod, mod.exports, globalThis.window, globalThis);
  return globalThis.window.ABCJS || mod.exports;
}

// ── fetch target + siblings ──────────────────────────────────────────────────
async function getJSON(path) { const r = await fetch(`${URL_}/rest/v1/${path}`, { headers: H }); return r.json(); }
const arg = process.argv[2];
if (!arg) { console.error("usage: node scripts/audit-lesson.mjs <id | course/level/order | title>"); process.exit(1); }
let target;
if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(arg)) target = (await getJSON(`lessons?id=eq.${arg}&select=*`))[0];
else if (/^\w+\/\d+\/\d+$/.test(arg)) { const [c, l, s] = arg.split("/"); target = (await getJSON(`lessons?course=eq.${c}&level=eq.${l}&sort_order=eq.${s}&select=*`))[0]; }
else target = (await getJSON(`lessons?title=ilike.*${encodeURIComponent(arg)}*&select=*`))[0];
if (!target) { console.error("Lesson not found for:", arg); process.exit(1); }
const siblings = await getJSON(`lessons?course=eq.${target.course}&select=level,sort_order,title,est_minutes,blocks&order=level,sort_order`);

const ABCJS = await loadAbcjs();
const B = target.blocks || [];

console.log(`\n=== AUDIT: ${target.title}  (${target.course} L${target.level} #${target.sort_order}) ===`);
console.log(`blocks: ${B.length} | est_minutes: ${target.est_minutes} | status: ${target.status}\n`);

// ── 1. STRUCTURAL ────────────────────────────────────────────────────────────
// Keep in step with the renderer's block types (lessons-render.js) and
// lesson-studio's BLOCK_TYPES, or valid blocks get flagged as unknown.
const KNOWN = new Set(["heading","text","callout","example","task","divider","notation","play","keyboard","questions",
                       "image","audio","video","download","hand","prestaff"]);
const noteRe = /^([A-G][#b]?\d|r)$/;
B.forEach((b, i) => {
  if (!b.type || !KNOWN.has(b.type)) flag("STRUCT", `[${i}] unknown/missing type: ${b.type}`);
  if (b.type === "notation") { if (!b.abc) flag("STRUCT", `[${i}] notation has no abc`); else if (!/K:/.test(b.abc)) flag("STRUCT", `[${i}] notation missing K:`); }
  if (b.type === "play") {
    (b.notes || []).forEach(n => { if (n != null && !noteRe.test(n)) flag("STRUCT", `[${i}] bad play note: "${n}"`); }); // null = rest, allowed
    if (Array.isArray(b.beats) && b.beats.length !== (b.notes || []).length) flag("STRUCT", `[${i}] play beats(${b.beats.length}) != notes(${(b.notes||[]).length})`);
    if (Array.isArray(b.gains) && b.gains.length !== (b.notes || []).length) flag("STRUCT", `[${i}] play gains(${b.gains.length}) != notes(${(b.notes||[]).length})`);
  }
  if (b.type === "keyboard" && (!b.from || !b.to)) flag("STRUCT", `[${i}] keyboard missing from/to`);
  if (b.type === "questions") (b.items || []).forEach((it, j) => {
    if (it.kind === "mcq") {
      if (!Array.isArray(it.options) || it.options.length < 2) flag("QUIZ", `[${i}.${j}] mcq <2 options`);
      else if (!Number.isInteger(it.answer) || it.answer < 0 || it.answer >= it.options.length) flag("QUIZ", `[${i}.${j}] mcq answer index out of range (${it.answer})`);
    } else if (it.kind === "truefalse") { if (typeof it.answer !== "boolean") flag("QUIZ", `[${i}.${j}] truefalse answer not boolean`); }
    else if (it.kind === "short") { if (!Array.isArray(it.accept) || !it.accept.length) flag("QUIZ", `[${i}.${j}] short missing accept[]`); }
    else if (it.kind !== "reflect") flag("QUIZ", `[${i}.${j}] unknown question kind: ${it.kind}`);
  });
});

// ── 2. NOTATION RENDER + BAR MATHS ───────────────────────────────────────────
B.forEach((b, i) => {
  if (b.type !== "notation" || !b.abc) return;
  let tunes; try { tunes = ABCJS.parseOnly(b.abc); } catch (e) { flag("NOTATION", `[${i}] parse threw: ${e.message}`); return; }
  const w = (tunes[0] && tunes[0].warnings) || [];
  if (w.length) flag("NOTATION", `[${i}] abcjs warnings: ${JSON.stringify(w)}`);
  if (tunes.length > 1) flag("NOTATION", `[${i}] ${tunes.length} tunes in one block (multiple X:? grand staff should be ONE tune with V:1/V:2)`);
  const mm = b.abc.match(/M:\s*(\d+)\/(\d+)/);
  if (mm && !/M:\s*none/.test(b.abc)) {
    const expected = (+mm[1]) / (+mm[2]); // bar length in whole-note units
    for (const tn of tunes) for (const li of (tn.lines || [])) {
      if (!li.staff) continue;
      for (let si = 0; si < li.staff.length; si++) for (let vi = 0; vi < li.staff[si].voices.length; vi++) {
        let bar = 0;
        for (const e of li.staff[si].voices[vi]) {
          if (e.el_type === "note") bar += e.duration;
          if (e.el_type === "bar") { if (bar > 1e-6 && Math.abs(bar - expected) > 1e-3) flag("BARS", `[${i}] bar sums ${bar} (want ${expected}) :: ${b.abc.replace(/\n/g, " ")}`); bar = 0; }
        }
        if (bar > 1e-6 && Math.abs(bar - expected) > 1e-3) flag("BARS", `[${i}] final bar sums ${bar} (want ${expected}) :: ${b.abc.replace(/\n/g, " ")}`);
      }
    }
  }
});

// ── 2b. BEAM GROUPING vs BEAT ────────────────────────────────────────────────
// ABC sets beaming with spaces: a run of notes with no space between them is one
// beam group. A beamed group of 2+ notes must not cross a beat boundary — that is
// the rule this course teaches (beam so each beat is a clear unit). The bar-maths
// check above only verifies a bar ADDS UP, never how it is grouped, so wrong
// beaming (e.g. a group that straddles a bar/beat line) passes it silently. This
// catches it from the source text. A SINGLE long note may span beats; only groups
// of 2+ notes are flagged. Bars with tuplets / grace notes / broken rhythm are
// skipped (their durations can't be parsed reliably here) to avoid false alarms.
function beatUnitQ(num, den) {           // beat length in quarter-note units
  if (den === 4) return 1;               // x/4  -> quarter-note beat
  if (den === 2) return 2;               // x/2  -> half-note beat
  if (den === 8) return (num % 3 === 0 && num > 3) ? 1.5 : 0.5; // 6/8,9/8,12/8 compound (dotted quarter); 3/8 -> eighth beats
  return 4 / den;
}
function tokQ(lenStr, Lq) {               // one token's length in quarter-note units
  let m = 1, d = 1;
  const mm = lenStr.match(/^(\d+)/); if (mm) m = +mm[1];
  const dm = lenStr.match(/\/(\d*)/); if (dm) d = dm[1] ? +dm[1] : 2; else if (/\/$/.test(lenStr)) d = 2;
  let base = Lq * m / d, add = base, tot = base;
  for (let k = (lenStr.match(/\./g) || []).length; k > 0; k--) { add /= 2; tot += add; }
  return tot;
}
B.forEach((b, i) => {
  if (b.type !== "notation" || !b.abc) return;
  const lines = b.abc.split("\n");
  let Lden = 8, num = null, den = null;
  for (const ln of lines) {
    const lm = ln.match(/^L:\s*1\/(\d+)/); if (lm) Lden = +lm[1];
    const mm2 = ln.match(/^M:\s*(\d+)\/(\d+)/); if (mm2) { num = +mm2[1]; den = +mm2[2]; }
  }
  if (num == null || den == null) return;              // M:none / C / absent → no beat grid to check
  const Lq = 4 / Lden, beat = beatUnitQ(num, den);
  let music = lines.filter(l => !/^[A-Za-z]:/.test(l)).join(" ")
    .replace(/\[[A-Za-z]:[^\]]*\]/g, " ")              // inline fields [Q:...] [K:...]
    .replace(/\{[^}]*\}/g, " ")                        // grace notes
    .replace(/"[^"]*"/g, " ").replace(/![^!]*!/g, " ");// chord symbols / decorations
  const bars = music.split(/\|/).map(s => s.trim()).filter(s => /[A-Ga-g]/.test(s));
  bars.forEach((bar, bi) => {
    if (/[(<>]/.test(bar)) return;                     // tuplets / broken rhythm → skip (can't size reliably)
    let pos = 0;
    for (const g of bar.split(/\s+/).filter(Boolean)) {
      const toks = g.match(/(\[[^\]]*\]|[\^_=]*[A-Ga-gxzZ][,']*)(\d*\/?\d*\.*)/g) || [];
      const start = pos; let notes = 0;
      for (const t of toks) {
        const tm = t.match(/(\[[^\]]*\]|[\^_=]*[A-Ga-gxzZ][,']*)(\d*\/?\d*\.*)/);
        pos += tokQ(tm[2] || "", Lq);
        if (!/^[\^_=]*[xzZ]/.test(tm[1]) || tm[1].startsWith("[")) notes++;
      }
      const eps = 1e-6;
      const onBeat = x => Math.abs(x / beat - Math.round(x / beat)) < 1e-6;
      const crosses = Math.floor(start / beat + eps) !== Math.floor(pos / beat - eps);
      // Flag ONLY when the group straddles a beat AND is off the beat grid (starts or
      // ends mid-beat). A group that starts and ends on beat boundaries is legitimate
      // wider beaming (e.g. 4 eighths across beats 1-2 in 4/4) or an intentional
      // "wrong way" teaching example that's still grid-aligned — neither is flagged.
      // The genuine error (misplaced spaces pushing a group off the grid, as in the
      // tie-across-barline bug) starts mid-beat and is caught here.
      if (notes >= 2 && crosses && !(onBeat(start) && onBeat(pos)))
        flag("GROUPING", `[${i}] bar ${bi + 1}: beamed group "${g}" is off the beat grid (spans ${start}-${pos} quarter-beats, beat=${beat}) — a beamed group should start and end on beats :: ${b.abc.replace(/\n/g, " ")}`);
    }
  });
});

// ── 3. PLAY vs NEAREST NOTATION (soft) ───────────────────────────────────────
const PCS = ["C","C#/Db","D","D#/Eb","E","F","F#/Gb","G","G#/Ab","A","A#/Bb","B"];
function playLetters(notes){ return new Set((notes||[]).filter(n=>n!=null&&n!=="r").map(n=>n.replace(/\d+$/,"").toUpperCase())); }
B.forEach((b, i) => {
  if (b.type !== "play") return;
  let ni = i - 1; while (ni >= 0 && B[ni].type !== "notation") ni--;
  if (ni < 0) return;
  // letters present in the abc (rough: capture pitch letters)
  const abcLetters = new Set((B[ni].abc.match(/[A-Ga-g]/g) || []).map(c => c.toUpperCase()));
  const playNotes = (Array.isArray(b.voices) && b.voices.length) ? b.voices.flatMap(v => v.notes || []) : b.notes;
  const pl = playLetters(playNotes);
  const extra = [...pl].filter(x => !abcLetters.has(x.replace(/[#b]/,"")[0]));
  if (extra.length) flag("PLAY?", `[${i}] play has letters not in nearest notation [${ni}]: ${extra.join(",")} (review)`);
});

// ── 4. HOUSE STYLE ───────────────────────────────────────────────────────────
const fullText = B.map(blockText).join("\n");
const quizText = B.flatMap(b => (b.items||[]).flatMap(it => [it.prompt, it.explain, ...(it.options||[])].filter(Boolean))).join("\n");
const allText = fullText + "\n" + quizText;
if (/—/.test(allText)) flag("STYLE", `em dash (—) present (count ${(allText.match(/—/g)||[]).length})`);
const emoji = allText.match(/[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}]/gu);
if (emoji) flag("STYLE", `emoji present: ${[...new Set(emoji)].join(" ")}`);
const mm2 = allText.match(/\b(met|meet)\b/gi); if (mm2) flag("STYLE", `"met/meet" present (${mm2.length}) — reword to learn/see/use/find`);
const abrsm = allText.match(/\b(ABRSM|exam|grade)\b/gi); if (abrsm) flag("STYLE", `ABRSM/exam/grade reference present (${abrsm.length}) — this is NOT an exam/grades course`);
const practise = allText.match(/\bpractis(e|ed|es|ing)\b/gi); if (practise) flag("STYLE", `"practise" (British "s") present (${practise.length}) — always spell "practice/practicing/practiced" with a C`);
const staff = allText.match(/\bstaffs?\b/gi); if (staff) flag("STYLE", `"staff" present (${staff.length}) — use "stave" (plural "staves"), not "staff"`);
if (/theory (paper|question|exercise|test)/i.test(allText)) flag("STYLE", `exam-paper framing ("theory paper/question/exercise") — this course is about reading music, not sitting a paper`);
if (/curved bracket/i.test(allText)) flag("STYLE", `"curved bracket" — a bracket is square; say "bracket" or "slur/curved line"`);
// British-primary terms NOT in brackets after an American term
for (const m of allText.matchAll(/\b(crotchet|minim|quaver|semibreve|breve)s?\b/gi)) {
  const pre = allText.slice(Math.max(0, m.index - 2), m.index);
  if (!pre.includes("(")) flag("STYLE", `British-primary "${m[0]}" not in brackets (use American-primary, British in brackets on first use)`);
}

// ── 5. DURATION ──────────────────────────────────────────────────────────────
function readWords(blocks){ let w=0; blocks.forEach(b=>{ ["md","text","caption","title","label"].forEach(f=>{ if(b[f]) w+=strip(b[f]).split(/\s+/).filter(Boolean).length; });
  (b.items||[]).forEach(it=>{ [it.prompt,it.explain].forEach(t=>{ if(t) w+=strip(t).split(/\s+/).length; }); (it.options||[]).forEach(o=>w+=strip(o).split(/\s+/).length); }); }); return w; }
const words = readWords(B);
const ratios = siblings.filter(s=>s.est_minutes && s.blocks).map(s=>({est:s.est_minutes, w:readWords(s.blocks), wpm:readWords(s.blocks)/s.est_minutes}));
const medWpm = ratios.map(r=>r.wpm).sort((a,b)=>a-b)[Math.floor(ratios.length/2)] || 200;
const suggested = Math.round(words / medWpm / 5) * 5;
console.log(`-- duration: ${words} reading words, est ${target.est_minutes} min. Course median ~${Math.round(medWpm)} words/min -> suggests ~${suggested} min.`);
if (Math.abs(suggested - target.est_minutes) >= 10) flag("DURATION", `est_minutes ${target.est_minutes} vs ~${suggested} implied by word count (siblings ~${Math.round(medWpm)} wpm)`);
if (target.est_minutes < words / 200) flag("DURATION", `est_minutes ${target.est_minutes} below even a pure-read floor (${Math.round(words/200)} min) for ${words} words`);

// ── 6. RE-TEACH SIGNALS ──────────────────────────────────────────────────────
// Keyword heuristic — surfaces candidates; the real reteach test is reading the
// content against the PRIOR LESSONS list printed below. Two nets:
//
// (a) OWNED-CONCEPT RULES. Each concept below is first TAUGHT in an earlier lesson
//     ("owner"). If this lesson SPELLS OUT the rule (not just names the concept) in
//     2+ separate blocks, it is almost certainly re-teaching it per example (e.g.
//     re-explaining "harmonic minor raises the 7th" afresh for every new key)
//     instead of recapping once and applying. This is the pattern the old check
//     missed. Owner is matched from the sibling lesson titles.
const priorLessons = siblings
  .filter(s => s.level < target.level || (s.level === target.level && s.sort_order < target.sort_order))
  .map(s => ({ lower: (s.title || "").toLowerCase(), id: `L${s.level}#${s.sort_order}`, title: s.title }));
const ruleTriggers = [
  { name: "harmonic-minor rule (raise the 7th)", re: /raises? the seventh|raise the seventh|seventh[^.]{0,25}\braised\b/i, owner: /harmonic minor/ },
  { name: "melodic-minor rule (raise 6 & 7 up, restore down)", re: /(raises?|raising) both the sixth and (the )?seventh|raise the sixth and (the )?seventh/i, owner: /melodic minor/ },
  { name: "relative-minor rule (minor 3rd down / shares key sig)", re: /relative minor[^.]{0,70}(minor third|three semitones|sixth degree|same key signature)|(minor third|three semitones)[^.]{0,40}(below|down)[^.]{0,25}tonic/i, owner: /relative (major|minor)/ },
  { name: "tonic-triad rule (notes 1, 3, 5)", re: /notes? 1,? ?3,? ?and ?5\b|first,? third,? and fifth (note|degree)/i, owner: /tonic triad|triad/ },
  { name: "key-signature definition", re: /(a )?key signature is (a|the)|a group of (sharp|flat)/i, owner: /key signature/ },
  { name: "major-scale step pattern", re: /tone,? tone,? semitone,? tone,? tone,? tone,? semitone/i, owner: /major scale/ },
];
// A statement prefaced with recap framing is a RECAP by definition, not re-teaching.
const RECAP = /\b(as you (already )?learned|as you (already )?know|you already know|you have (already )?learned|as before|recall that)\b/i;
for (const rt of ruleTriggers) {
  const hits = [];
  B.forEach((b, i) => { const t = strip(b.md || b.text || b.caption || b.title || ""); if (rt.re.test(t) && !RECAP.test(t)) hits.push(i); });
  const owner = priorLessons.find(p => rt.owner.test(p.lower));
  if (owner && hits.length >= 2)
    flag("RE-TEACH", `${rt.name}: taught already in ${owner.id} "${owner.title}", but its rule is spelled out in ${hits.length} blocks here [${hits.join(", ")}] — recap once, then apply to each key; do not re-explain per example`);
}
// (b) Bare definitions of anything (owned or not) appearing 3+ times.
const defTriggers = {
  "tone/semitone definition": /a (tone|semitone) is\b/gi,
  "triad = three-note chord": /three-note chord/gi,
  "clef definition (treble/bass)": /treble clef is|bass clef is|the (treble|bass) clef \(the/gi,
  "interval definition": /an interval is (the|a)/gi,
};
for (const [name, re] of Object.entries(defTriggers)) {
  const n = (fullText.match(re) || []).length;
  if (n > 2) flag("RE-TEACH", `"${name}" appears ${n}x — define ONCE then recap (check it isn't re-taught)`);
}
// repeated headings
const heads = B.filter(b=>b.type==="heading").map(b=>strip(b.text||b.title).toLowerCase());
const dupHeads = heads.filter((h,i)=>h && heads.indexOf(h)!==i);
if (dupHeads.length) flag("RE-TEACH", `duplicate headings: ${[...new Set(dupHeads)].join(" | ")}`);

// ── REPORT ───────────────────────────────────────────────────────────────────
const byCat = {};
for (const f of flags) (byCat[f.cat] ||= []).push(f.msg);
const order = ["STRUCT","NOTATION","BARS","GROUPING","QUIZ","STYLE","DURATION","RE-TEACH","PLAY?"];
console.log("\n================= FLAGS =================");
if (!flags.length) console.log("  none — mechanical checks all pass.");
for (const cat of order) if (byCat[cat]) { console.log(`\n[${cat}] (${byCat[cat].length})`); byCat[cat].forEach(m => console.log("  - " + m)); }

// ── human/AI judgment context (not auto-decidable) ───────────────────────────
console.log("\n============ NEEDS HUMAN/AI EYES ============");
console.log("\n# QUIZ ANSWERS (verify each against music theory):");
B.forEach((b,i)=>{ if(b.type!=="questions")return; (b.items||[]).forEach((it,j)=>{
  if(it.kind==="mcq") console.log(`  [${i}.${j}] ${strip(it.options[it.answer])}  <= ${strip(it.prompt).slice(0,80)}`);
  else if(it.kind==="truefalse") console.log(`  [${i}.${j}] ${it.answer}  <= ${strip(it.prompt).slice(0,80)}`);
  else if(it.kind==="short") console.log(`  [${i}.${j}] accept=${JSON.stringify(it.accept)}  <= ${strip(it.prompt).slice(0,60)}`);
}); });
console.log("\n# PRIOR LESSONS (cross-lesson recap-not-reteach scan):");
siblings.filter(s => s.level < target.level || (s.level === target.level && s.sort_order < target.sort_order)).forEach(s => {
  const hs = (s.blocks||[]).filter(b=>b.type==="heading").map(b=>strip(b.text||b.title)).filter(Boolean);
  console.log(`  L${s.level}#${s.sort_order} ${s.title}: ${hs.join(" / ")}`);
});
console.log(`\n================= SUMMARY: ${flags.length} mechanical flag(s) =================`);
process.exit(flags.length ? 1 : 0);
