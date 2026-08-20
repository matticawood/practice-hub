// AGENT AUDIT — the LLM judgment layer on top of the mechanical checks.
//
// Pipeline: generate fresh candidates -> MECHANICAL pre-filter (preflight / critique /
// theoryErrors / grade legality; free, deterministic) -> for each survivor, render to an
// engraved PNG and ask Claude to judge the three things code cannot: grade-fit, freshness
// vs the existing bank (over-used patterns), and musicality/character. Structured verdict
// per candidate -> a ranked shortlist + an audit report for a human (me, then Matthew) to
// check. Works for grades 2/3/4 (grade is arg 1; the spec is grade-gated).
//
// Usage:  node audit-agent.mjs <grade> [count]      e.g.  node audit-agent.mjs 4 8
//
// It NEVER writes to the bank and treats reviewed:true pieces as read-only. Output lands in
// audit-out/grade<g>/ : one PNG + one report.json + a human-readable report.md.

import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { generate } from "./generator.mjs";
import { critique } from "./critic.mjs";
import { lilyWithMap } from "./engine.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// Optional imports — guard so a missing/renamed export never sinks the run.
let novelty = null;
try { ({ novelty } = await import("./variety.mjs")); } catch {}
let theoryErrors = null;
try { ({ theoryErrors } = await import("./theory-errors.mjs")); } catch {}
let preflight = null;
try { ({ preflight } = await import("./preflight.mjs")); } catch {}

// ── grade spec (machine-readable dial + a short prose gloss per grade) ───────────────────
const DIAL = {
  2: { times: ["4/4","3/4","2/4"], majKeys:["c","g","d","f"], minKeys:["a","d","e","g"], maxAcc:2, maxNotes:1, semiq:false, ferm:false, tenuto:false, anacrusis:false, chromatic:false },
  3: { times: ["4/4","3/4","2/4","3/8"], majKeys:["c","g","d","f","a","bf","ef"], minKeys:["a","d","e","g","b"], maxAcc:3, maxNotes:2, semiq:true, ferm:false, tenuto:false, anacrusis:false, chromatic:false },
  4: { times: ["4/4","3/4","2/4","3/8","6/8"], majKeys:["c","g","d","f","a","bf","ef"], minKeys:["a","d","e","g","b"], maxAcc:3, maxNotes:2, semiq:true, ferm:true, tenuto:true, anacrusis:true, chromatic:true },
};
const GRADE_PROSE = {
  2: "Grade 2: hands together in a fixed 5-finger position, single note per hand, simple time, up to 2 sharps/flats, NO semiquavers, NO chords, NO chromatics. Harmony is implied by two simple lines. Non-chord tones: passing and neighbour tones only. Cadences: perfect and imperfect (plagal ok).",
  3: "Grade 3: hands move out of position, 2-note chords and semiquavers allowed, adds 3/8, up to 3 accidentals, diatonic only. First-inversion chords for a moving bass; simple broken-chord or oom-pah accompaniment; wider palette (ii6, vi, iii). Suspensions/appoggiaturas sparingly at most.",
  4: "Grade 4: adds 6/8 compound, anacrusis, ONE chromatic passing note or secondary dominant per piece, fermata, tenuto, ties. Suspensions and appoggiaturas unlocked. Richer inversions, two-part textures, compound-time idioms. Still up to 3 accidentals.",
};
const PHILOSOPHY =
  "House rules for these exercises: character is chosen FIRST and sets metre, tempo, texture and articulation. " +
  "Melody and rhythm follow repetition WITH variation (a motif recurs and changes at the phrase end) — never all-identical bars, never all-different, and never the lazy 'two identical halves' or a mechanical I-IV-V tiling. " +
  "The left hand is a voice with its own shape, not one figure tiled across every bar. It must be playable and idiomatic for the grade, and above all it must read as a real, characterful little piece a student at this exact grade could sight-read, not a correct-but-dry exercise.";

// ── readable rendering of an exercise (so the model has the data beside the image) ───────
const SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const FLAT  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const noteName = (m, flat) => (flat ? FLAT : SHARP)[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
const DUR = { 0.25:"ss", 0.5:"q", 0.75:"q.", 1:"c", 1.5:"c.", 2:"m", 3:"m.", 4:"sb" }; // semiquaver..semibreve
const durLbl = d => DUR[d] || `${d}qb`;
const barUnits = ex => { const [n, d] = ex.time.split("/").map(Number); return n * (4 / d); };

function handText(ex, hand) {
  const bu = barUnits(ex), bars = {}; let t = 0;
  for (const n of ex[hand]) {
    const bi = Math.floor(t / bu + 1e-9); (bars[bi] ??= []);
    let tok;
    if (n.rest) tok = `rest/${durLbl(n.d)}`;
    else { const ms = Array.isArray(n.m) ? n.m : [n.m]; tok = ms.map(m => noteName(m, ex.flat)).join("+") + `/${durLbl(n.d)}`; }
    const tags = [n.fing != null ? `f${Array.isArray(n.fing) ? n.fing.join("") : n.fing}` : "", n.dyn || "", n.art || "", n.slur || "", n.ti ? "tie" : "", n.ferm ? "fermata" : ""].filter(Boolean);
    if (tags.length) tok += `(${tags.join(",")})`;
    bars[bi].push(tok); t += n.d;
  }
  return Object.keys(bars).map(Number).sort((a, b) => a - b).map(bi => `  bar ${bi + 1}: ${bars[bi].join(" ")}`).join("\n");
}
function readable(ex) {
  return `Key: ${ex.key.toUpperCase()} ${ex.mode}   Time: ${ex.time}   Character/tempo mark: "${ex.tempo}"   Start fingers: RH ${ex.rhFinger ?? "?"}, LH ${ex.lhFinger ?? "?"}${ex.partial ? `   Anacrusis: ${ex.partial} beat(s)` : ""}
RIGHT HAND:
${handText(ex, "rh")}
LEFT HAND:
${handText(ex, "lh")}
(durations: ss=semiquaver q=quaver c=crotchet m=minim, "."=dotted; f#=finger; +=chord)`;
}

// ── engrave one exercise to a PNG, return base64 ─────────────────────────────────────────
function renderPng(ex, tag) {
  const id = `audit_${tag}_${process.pid}`;
  const lyPath = join(tmpdir(), `${id}.ly`);
  const { ly } = lilyWithMap({ ...ex, n: ex.n || "" }, 20);
  fs.writeFileSync(lyPath, ly);
  execFileSync("lilypond", ["-dcrop", "--png", "-dresolution=170", "-o", join(tmpdir(), id), lyPath], { stdio: "ignore" });
  const png = join(tmpdir(), `${id}.cropped.png`);
  const b64 = fs.readFileSync(png).toString("base64");
  try { fs.unlinkSync(lyPath); } catch {}
  return b64;
}

// ── the audit schema the model must fill (reasons first, verdict last) ───────────────────
const SCHEMA = {
  type: "object",
  properties: {
    grade_fit: { type: "string", enum: ["too_easy", "right", "too_hard"], description: "Is the difficulty right for a student sight-reading at this exact grade?" },
    grade_fit_reason: { type: "string", description: "One or two sentences, cite the specific bars or features." },
    freshness: { type: "string", enum: ["fresh", "somewhat_derivative", "over_used"], description: "Does it lean on patterns already over-used across the bank (see the over-use data), or feel fresh?" },
    freshness_reason: { type: "string" },
    musicality: { type: "string", enum: ["strong", "acceptable", "weak"], description: "Does it read as a real, characterful piece with genuine repetition-with-variation, not a dry or two-halves exercise?" },
    musicality_reason: { type: "string" },
    fingering_ok: { type: "boolean", description: "Are the marked start fingers and any implied hand shape sensible and conventional for the grade?" },
    fingering_note: { type: "string" },
    distinctiveness: { type: "integer", minimum: 0, maximum: 10, description: "0 = a tired cliché already in the bank; 10 = a fresh, memorable piece." },
    verdict: { type: "string", enum: ["keep", "revise", "bin"] },
    one_line: { type: "string", description: "A single sentence a human reviewer can scan." },
  },
  required: ["grade_fit","grade_fit_reason","freshness","freshness_reason","musicality","musicality_reason","fingering_ok","distinctiveness","verdict","one_line"],
};

const KEY = (() => {
  try { return (fs.readFileSync(join(HERE, "..", ".env.local"), "utf8").match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1]?.trim(); } catch { return null; }
})();

async function auditOne(ex, pngB64, grade, mech) {
  const prompt = `You are a strict ABRSM piano examiner and composer judging a single Grade ${grade} SIGHT-READING exercise a student must read at first sight. Judge it hard; most candidates should not be "keep".

GRADE SPEC (do not exceed): ${GRADE_PROSE[grade]}
Dial: ${JSON.stringify(DIAL[grade])}

${PHILOSOPHY}

THE EXERCISE (engraved image attached; data below):
${readable(ex)}

OBJECTIVE MEASUREMENTS already computed by code (trust these numbers, judge what they mean):
${JSON.stringify(mech.critique)}
${mech.novelty ? `OVER-USE vs the existing bank (higher = more derivative): ${JSON.stringify(mech.novelty)}` : "(no over-use data available)"}
${mech.theory && mech.theory.length ? `Flagged theory issues: ${JSON.stringify(mech.theory)}` : "No hard theory errors flagged."}

Judge grade-fit, freshness (use the over-use data), musicality/character and fingering, then give a verdict. Look at the IMAGE to judge how it actually reads on the page. Call the report_audit tool with your judgement.`;

  const body = {
    model: "claude-opus-4-8",
    max_tokens: 1500,
    tools: [{ name: "report_audit", description: "Report the structured audit of one sight-reading exercise.", input_schema: SCHEMA }],
    tool_choice: { type: "tool", name: "report_audit" },
    messages: [{ role: "user", content: [
      { type: "text", text: prompt },
      { type: "image", source: { type: "base64", media_type: "image/png", data: pngB64 } },
    ] }],
  };
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  const tu = (j.content || []).find(c => c.type === "tool_use");
  if (!tu) throw new Error("no tool_use: " + JSON.stringify(j).slice(0, 300));
  return tu.input;
}

// ── main ─────────────────────────────────────────────────────────────────────────────────
const grade = parseInt(process.argv[2] || "4", 10);
const count = parseInt(process.argv[3] || "8", 10);
if (!KEY) { console.error("No ANTHROPIC_API_KEY found in ../.env.local"); process.exit(1); }
if (!DIAL[grade]) { console.error("grade must be 2, 3 or 4"); process.exit(1); }

const bankPath = join(HERE, "bank", `grade${grade}.json`);
const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
console.log(`Grade ${grade}: bank has ${bank.length} pieces. Generating ${count} fresh candidates and auditing...\n`);

const outDir = join(HERE, "audit-out", `grade${grade}`);
fs.mkdirSync(outDir, { recursive: true });

const results = [];
for (let i = 0; i < count; i++) {
  let ex;
  try { ex = generate(grade, grade === 2 ? 3000 : 12000, bank); } catch (e) { console.log(`#${i + 1} generate failed: ${e.message}`); continue; }
  if (!ex) { console.log(`#${i + 1} generate returned nothing`); continue; }

  // Mechanical pre-filter — cheap, deterministic. A hard failure is auto-binned (no LLM spend).
  const mech = { critique: null, novelty: null, theory: null, preflight: null };
  try { mech.critique = critique(ex); } catch {}
  try { if (novelty) mech.novelty = novelty(bank, ex); } catch {}
  try { if (theoryErrors) mech.theory = theoryErrors(ex); } catch {}
  try { if (preflight) mech.preflight = preflight(ex, grade); } catch {}
  const hardFail = (mech.theory && mech.theory.length) || (mech.preflight && mech.preflight.fail);
  if (hardFail) { console.log(`#${i + 1} auto-binned by mechanical checks (${JSON.stringify(mech.theory || mech.preflight).slice(0, 80)})`); continue; }

  let png;
  try { png = renderPng(ex, i + 1); } catch (e) { console.log(`#${i + 1} render failed: ${e.message}`); continue; }

  let audit;
  try { audit = await auditOne(ex, png, grade, mech); }
  catch (e) { console.log(`#${i + 1} audit failed: ${e.message}`); continue; }

  const pngFile = join(outDir, `cand${i + 1}.png`);
  fs.writeFileSync(pngFile, Buffer.from(png, "base64"));
  results.push({ i: i + 1, ex, mech, audit, png: `cand${i + 1}.png` });
  console.log(`#${i + 1}  ${audit.verdict.toUpperCase().padEnd(6)} d${audit.distinctiveness}  ${ex.tempo} ${ex.key}${ex.mode} ${ex.time}  — ${audit.one_line}`);
}

// Rank: keep > revise > bin, then by distinctiveness.
const ORD = { keep: 0, revise: 1, bin: 2 };
results.sort((a, b) => (ORD[a.audit.verdict] - ORD[b.audit.verdict]) || (b.audit.distinctiveness - a.audit.distinctiveness));

fs.writeFileSync(join(outDir, "report.json"), JSON.stringify(results, null, 2));
const md = [`# Grade ${grade} audit — ${results.length} audited\n`,
  `keep: ${results.filter(r => r.audit.verdict === "keep").length}  revise: ${results.filter(r => r.audit.verdict === "revise").length}  bin: ${results.filter(r => r.audit.verdict === "bin").length}\n`,
  ...results.map(r => `## #${r.i} — ${r.audit.verdict.toUpperCase()} (distinctiveness ${r.audit.distinctiveness})
${r.ex.tempo}, ${r.ex.key.toUpperCase()} ${r.ex.mode}, ${r.ex.time}  ·  ![](cand${r.i}.png)
- **grade-fit:** ${r.audit.grade_fit} — ${r.audit.grade_fit_reason}
- **freshness:** ${r.audit.freshness} — ${r.audit.freshness_reason}
- **musicality:** ${r.audit.musicality} — ${r.audit.musicality_reason}
- **fingering:** ${r.audit.fingering_ok ? "ok" : "issue"} — ${r.audit.fingering_note || ""}
- ${r.audit.one_line}
`)].join("\n");
fs.writeFileSync(join(outDir, "report.md"), md);
console.log(`\nWrote ${results.length} audits to ${outDir}/  (report.md, report.json, PNGs)`);
