// Correction pass for theory L3 #0. Loads l3-0.json, Americanizes note terms
// (American primary, British in brackets on FIRST use only), fixes met/meet + practise,
// fixes the 3 broken notations and the buggy play timings. Writes l3-0-fixed.json.
import { readFileSync, writeFileSync } from "node:fs";
const d = JSON.parse(readFileSync(new URL("./l3-0.json", import.meta.url), "utf8"))[0];

// ── term conversion ──────────────────────────────────────────────────────────
// British -> American base terms (longest first so "demisemiquaver" beats "semiquaver").
const MAP = [
  ["demisemiquavers", "thirty-second notes"], ["demisemiquaver", "thirty-second note"],
  ["semiquavers", "sixteenth notes"], ["semiquaver", "sixteenth note"],
  ["crotchets", "quarter notes"], ["crotchet", "quarter note"],
  ["quavers", "eighth notes"], ["quaver", "eighth note"],
  ["minims", "half notes"], ["minim", "half note"],
  ["semibreves", "whole notes"], ["semibreve", "whole note"],
];
// British word -> its singular bracket label for first-use annotation
const BRACKET = {
  "quarter note": "crotchet", "eighth note": "quaver", "half note": "minim",
  "sixteenth note": "semiquaver", "thirty-second note": "demisemiquaver", "whole note": "semibreve",
  "dotted quarter note": "dotted crotchet", "dotted half note": "dotted minim",
};
const preserveCase = (src, out) => (src[0] === src[0].toUpperCase() ? out[0].toUpperCase() + out.slice(1) : out);

function stripExistingBrackets(s) {
  // Drop existing British/American bracket pairs (incl. **bold** wrappers) — we re-add
  // brackets cleanly on first use. Keep the FIRST word (+ its bold markers), drop the paren.
  // British (American...) -> British
  s = s.replace(/\b(crotchets?|quavers?|minims?|semiquavers?|demisemiquavers?|semibreves?)(\*{0,2})\s*\((?:an?\s+)?(?:dotted\s+)?(?:quarter|eighth|half|sixteenth|thirty-second|whole)[^)]*\)/gi, "$1$2");
  // American (British...) -> American
  s = s.replace(/\b((?:dotted\s+)?(?:quarter|eighth|half|sixteenth|thirty-second|whole) notes?)(\*{0,2})\s*\((?:an?\s+)?(?:dotted\s+)?(?:crotchet|quaver|minim|semiquaver|demisemiquaver|semibreve)[^)]*\)/gi, "$1$2");
  return s;
}
// met/meet -> learn/see/use (house rule), applied to ORIGINAL text before term-swap
const METMEET = [
  ["Before we meet anything new", "Before we look at anything new"],
  ["Now meet the other main family", "Now for the other main family"],
  ["You have already met time signatures", "You have already seen time signatures"],
  ["You will meet it most often", "You will see it most often"],
  ["You have now met both types of time", "You have now seen both types of time"],
];
function toAmerican(s) {
  for (const [br, am] of MAP) {
    s = s.replace(new RegExp("\\b" + br + "\\b", "gi"), (m) => preserveCase(m, am));
  }
  return s;
}

// First-use bracket tracking is GLOBAL across the lesson, in block order.
const bracketed = new Set();
function annotateFirstUse(s) {
  // dotted forms first, then bare
  // Only bracket the base note terms on first use — not the dotted compounds (their
  // components are already bracketed, and "(dotted crotchet)" reads fine unbracketed).
  for (const term of ["quarter note", "eighth note", "half note", "sixteenth note", "thirty-second note", "whole note"]) {
    if (bracketed.has(term)) continue;
    const re = new RegExp("\\b(" + term + ")\\b(?!\\s*\\()", "i");
    if (re.test(s)) {
      s = s.replace(re, (m) => m + " (" + BRACKET[term] + ")");
      bracketed.add(term);
    }
  }
  return s;
}
function fixMisc(s) {
  for (const [a, b] of METMEET) s = s.split(a).join(b);
  s = s.replace(/\bpractise\b/g, "practice").replace(/\bPractise\b/g, "Practice")
       .replace(/\bpractising\b/g, "practicing").replace(/\bpractised\b/g, "practiced");
  return s;
}
// article agreement after conversion: "a eighth note" -> "an eighth note"
function fixArticles(s) {
  return s.replace(/\ba (eighth)\b/g, "an $1").replace(/\bA (eighth)\b/g, "An $1");
}

const TEXT_FIELDS = ["md", "text", "caption", "label", "title", "prompt"];
function processStr(s) { return annotateFirstUse(fixArticles(toAmerican(stripExistingBrackets(fixMisc(s))))); }

for (const b of d.blocks) {
  for (const f of TEXT_FIELDS) if (typeof b[f] === "string") b[f] = processStr(b[f]);
  if (b.type === "notation" && typeof b.abc === "string") {
    // ABC bar text annotations like "Beat 1" are fine; don't term-convert inside abc.
  }
  if (b.type === "questions" && Array.isArray(b.items)) {
    for (const it of b.items) {
      for (const f of ["prompt"]) if (typeof it[f] === "string") it[f] = processStr(it[f]);
      if (Array.isArray(it.options)) it.options = it.options.map(processStr);
      if (Array.isArray(it.accept)) { /* keep accept list bilingual — do not strip */ }
      if (typeof it.explain === "string") it.explain = processStr(it.explain);
    }
  }
}

// ── notation fixes ───────────────────────────────────────────────────────────
function setNotation(idx, abc, caption) { d.blocks[idx].abc = abc; if (caption != null) d.blocks[idx].caption = caption; }
// [22] one quarter note vs two eighth notes, one beat each (was a broken 4/4 with half notes)
setNotation(22, "X:1 M:1/4 L:1/8 K:C C2 | CC |]",
  "Left bar: one quarter note (one beat). Right bar: two eighth notes (the same beat split in two). Each bar lasts exactly one beat.");
// [144] crotchet+quaver per beat — make it one full 6/8 bar (two beats) instead of two 3/8-sized bars
setNotation(144, "X:1 M:6/8 L:1/8 K:C E2 F G2 A |]",
  "A quarter note plus an eighth note in each beat: E (2 eighths) + F (1 eighth) = one beat; G + A = one beat. Together they fill one 6/8 bar.");
// [182] 12/8 time-signature demo used x9 (9 eighths); a 12/8 bar needs 12
setNotation(182, "X:1 K:C clef=treble M:12/8 L:1/8 x12 |]", null);

// ── play-timing fixes (beats are in quarter-note units: 1=quarter, 0.5=eighth, 0.333=triplet, 1.5=dotted quarter) ──
// [45] "each beat divided into three equal mini-pulses" — must be 12 equal triplet-eighths, not [1,0.67,0.33]
d.blocks[45].beats = Array(12).fill(0.333);
// [47] same triple-feel melody, 12 notes, three equal parts per beat
d.blocks[47].beats = Array(12).fill(0.333);
// [51] compound (long-short) version of C E G E: each beat = crotchet+quaver (1 + 0.5) filling a dotted-quarter beat
d.blocks[51].beats = [1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5];

// ── est_minutes (content-based; will re-evaluate after condensing) ──
d.est_minutes = 30;

writeFileSync(new URL("./l3-0-fixed.json", import.meta.url), JSON.stringify(d, null, 1));
// counts of any remaining British terms in visible text (should be only inside accept[] lists)
const visible = JSON.stringify(d.blocks.map(b => { const c = { ...b }; delete c.abc; return c; }));
const brLeft = (visible.match(/\b(crotchet|quaver|minim|semiquaver|demisemiquaver)s?\b/gi) || []);
console.log("blocks:", d.blocks.length, "| est:", d.est_minutes);
console.log("British terms remaining in visible text (excl. abc):", brLeft.length);
console.log("sample remaining:", [...new Set(brLeft)].slice(0, 20).join(", "));
