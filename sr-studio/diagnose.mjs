// DIAGNOSE — vet a batch of freshly-generated pieces against the two things that decide a
// slot: DIVERSITY (is its LH/RH figure already used across the bank, or duplicated within the
// batch) and GRADE-4 CLOSENESS (does it stay inside the dial). Reuses the existing critique()
// for cheap coherence signals. Output: a ranked failure-mode histogram + the most over-used
// figures, so we know exactly what to change in the generator. Mechanical + free (no LLM).
//
// Usage:  node diagnose.mjs <grade> <count>     e.g.  node diagnose.mjs 4 60

import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generate, _gradeMisfit } from "./generator.mjs";
import { critique } from "./critic.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const grade = parseInt(process.argv[2] || "4", 10);
const count = parseInt(process.argv[3] || "60", 10);

const DIAL = {
  2: { times:["4/4","3/4","2/4"], majKeys:["c","g","d","f"], minKeys:["a","d","e","g"], maxAcc:2, maxNotes:1, semiq:false, ferm:false, tenuto:false, anacrusis:false, chromatic:false },
  3: { times:["4/4","3/4","2/4","3/8"], majKeys:["c","g","d","f","a","bf","ef"], minKeys:["a","d","e","g","b"], maxAcc:3, maxNotes:2, semiq:true, ferm:false, tenuto:false, anacrusis:false, chromatic:false },
  4: { times:["4/4","3/4","2/4","3/8","6/8"], majKeys:["c","g","d","f","a","bf","ef"], minKeys:["a","d","e","g","b"], maxAcc:3, maxNotes:2, semiq:true, ferm:true, tenuto:true, anacrusis:true, chromatic:true },
}[grade];

const PCS = m => ((m % 12) + 12) % 12;
const LET = { c:0, d:2, e:4, f:5, g:7, a:9, b:11 };
const barUnits = ex => { const [n,d] = ex.time.split("/").map(Number); return n * (4/d); };
const tonicPc = ex => PCS(LET[ex.key[0]] + (ex.key[1]==="f"?-1:ex.key[1]==="s"?1:0));

// per-bar cell strings for a hand: token = rest 'r' / chord 'c' / single 'b' + duration.
function barCells(ex, hand, roleFmt) {
  const bu = barUnits(ex), bars = {}; let t = 0;
  for (const n of ex[hand]) {
    const bi = Math.floor(t / bu + 1e-9); (bars[bi] ??= []);
    bars[bi].push(n.rest ? "r"+n.d : roleFmt(n)); t += n.d;
  }
  return Object.keys(bars).map(Number).sort((a,b)=>a-b).map(bi => bars[bi].join(","));
}
// the piece's LH FIGURE = its modal (most-common) LH bar cell — captures "oom-pah-pah" etc.
function modal(cells) {
  const f = {}; for (const c of cells) f[c] = (f[c]||0)+1;
  return Object.entries(f).sort((a,b)=>b[1]-a[1])[0]?.[0] || "";
}
const lhFigure = ex => modal(barCells(ex, "lh", n => (Array.isArray(n.m)?"c":"b")+n.d));
const rhFigure = ex => modal(barCells(ex, "rh", n => "n"+n.d));

// ── GRADE check against the dial ────────────────────────────────────────────────────────
function gradeFaults(ex) {
  const f = [];
  if (!DIAL.times.includes(ex.time)) f.push("time "+ex.time);
  const allowed = ex.mode==="maj" ? DIAL.majKeys : DIAL.minKeys;
  if (!allowed.includes(ex.key)) f.push("key "+ex.key+ex.mode);
  const t = tonicPc(ex);
  const scale = new Set((ex.mode==="min"?[0,2,3,5,7,8,10,11]:[0,2,4,5,7,9,11]).map(x=>PCS(t+x)));
  if (ex.mode==="min") { scale.add(PCS(t+11)); scale.add(PCS(t+9)); }
  for (const hand of ["rh","lh"]) for (const n of ex[hand]) {
    if (n.rest) continue;
    const ms = Array.isArray(n.m) ? n.m : [n.m];
    if (ms.length > DIAL.maxNotes) f.push("chord>"+DIAL.maxNotes);
    if (n.d < 0.5-1e-9 && !DIAL.semiq) f.push("semiquaver");
    if (n.ferm && !DIAL.ferm) f.push("fermata");
    if (n.art==="--" && !DIAL.tenuto) f.push("tenuto");
    for (const m of ms) if (!scale.has(PCS(m)) && !DIAL.chromatic) f.push("chromatic");
  }
  if (ex.partial && !DIAL.anacrusis) f.push("anacrusis");
  return [...new Set(f)];
}
// GRADE-4 FLOOR: difficulty-feature count. Below 3 = too easy (not clearly harder than Grade 3).
function devices(ex) {
  const t = tonicPc(ex);
  const scale = new Set((ex.mode==="min"?[0,2,3,5,7,8,10,11]:[0,2,4,5,7,9,11]).map(x=>PCS(t+x)));
  if (ex.mode==="min") { scale.add(PCS(t+11)); scale.add(PCS(t+9)); }
  let semiq=false,dot=false,tie=false,chord=false,chrom=false; const rng={rh:[999,0],lh:[999,0]};
  for (const h of["rh","lh"]) for (const n of ex[h]) { if (n.rest) continue;
    if (n.d<0.5-1e-9)semiq=true; if ([0.75,1.5,3].includes(n.d))dot=true; if (n.ti)tie=true;
    const ms=Array.isArray(n.m)?n.m:[n.m]; if (ms.length>1)chord=true;
    for (const m of ms){ if(!scale.has(PCS(m)))chrom=true; if(m<rng[h][0])rng[h][0]=m; if(m>rng[h][1])rng[h][1]=m; } }
  const outPos=(rng.rh[1]-rng.rh[0]>7)||(rng.lh[1]-rng.lh[0]>7);
  return [semiq,dot,tie,chord,chrom,outPos,ex.time==="6/8",!!ex.partial].filter(Boolean).length;
}

// ── load bank, fingerprint its figures ──────────────────────────────────────────────────
const bank = JSON.parse(fs.readFileSync(join(HERE,"bank",`grade${grade}.json`),"utf8"));
const bankLH = {}, bankRH = {};
for (const ex of bank) { const l=lhFigure(ex), r=rhFigure(ex); bankLH[l]=(bankLH[l]||0)+1; bankRH[r]=(bankRH[r]||0)+1; }
console.log(`Grade ${grade}: bank has ${bank.length} pieces. Generating ${count} candidates (the generator's own selected output) and diagnosing...\n`);

// ── generate + classify each candidate ──────────────────────────────────────────────────
const batchLH = {}, batchRH = {};
const tally = { gradeFail:0, tooEasy:0, lhInBank:0, lhDupBatch:0, rhInBank:0, lowSkeleton:0, noCadence:0, clean:0 };
const reasons = {};   // failure-mode -> count (primary reason per candidate)
const lhUse = {};     // figure -> count across the batch (for the over-use report)
const cand = [];
for (let i=0;i<count;i++){
  let ex; try { ex = generate(grade, grade===2?3000:12000, bank); } catch { continue; }
  if (!ex) continue;
  const gf = gradeFaults(ex);
  const lh = lhFigure(ex), rh = rhFigure(ex);
  const cq = critique(ex);
  lhUse[lh] = (lhUse[lh]||0)+1;
  // OVER-USED, not merely present: a figure that appears at/above the generator's cap in the bank is
  // the diversity problem. "present at all" is meaningless once a bank is large (Grade 2's 107 pieces).
  const CAP = 2;
  const c = { gradeFail: gf.length>0, tooEasy: _gradeMisfit(ex, grade), lhInBank: (bankLH[lh]||0) >= CAP, lhDupBatch: false, rhInBank: (bankRH[rh]||0) >= CAP,
    lowSkeleton: cq.skeleton < 0.6, noCadence: !cq.cadence, gf, lh, rh, cq };
  batchLH[lh]=(batchLH[lh]||0)+1; batchRH[rh]=(batchRH[rh]||0)+1;
  cand.push(c);
}
// second pass: a figure used 3+ times in the batch is a within-batch duplicate
for (const c of cand) c.lhDupBatch = batchLH[c.lh] >= 3;

for (const c of cand) {
  if (c.gradeFail) tally.gradeFail++;
  if (c.tooEasy) tally.tooEasy++;
  if (c.lhInBank) tally.lhInBank++;
  if (c.lhDupBatch) tally.lhDupBatch++;
  if (c.rhInBank) tally.rhInBank++;
  if (c.lowSkeleton) tally.lowSkeleton++;
  if (c.noCadence) tally.noCadence++;
  // PRIMARY reason (the one that would keep it out of a slot), most-serious first
  const primary = c.gradeFail ? "grade: "+c.gf.join("/")
    : c.tooEasy ? "too easy (below grade 4 floor)"
    : c.lhInBank ? "LH figure over-used in the bank"
    : c.lhDupBatch ? "LH figure duplicated across the batch"
    : c.lowSkeleton ? "wandering harmony (low skeleton)"
    : c.noCadence ? "weak/absent cadence"
    : c.rhInBank ? "RH rhythm over-used in the bank"
    : "clean";
  reasons[primary] = (reasons[primary]||0)+1;
  if (primary==="clean") tally.clean++;
}

const pct = n => `${n} (${Math.round(n/cand.length*100)}%)`;
console.log(`=== ${cand.length} candidates diagnosed ===\n`);
console.log("PRIMARY reason a candidate wouldn't make a slot (most-serious first):");
for (const [r,n] of Object.entries(reasons).sort((a,b)=>b[1]-a[1])) console.log(`  ${pct(n).padStart(9)}  ${r}`);
console.log(`\nCLEAN (grade-legal, fresh figure, coherent): ${pct(tally.clean)}\n`);
console.log("Individual signal rates (a candidate can trip several):");
for (const k of ["gradeFail","tooEasy","lhInBank","lhDupBatch","rhInBank","lowSkeleton","noCadence"]) console.log(`  ${pct(tally[k]).padStart(9)}  ${k}`);

console.log("\nMost OVER-USED left-hand figures this batch (figure : count) — the ones to spread/grow:");
for (const [fig,n] of Object.entries(lhUse).sort((a,b)=>b[1]-a[1]).slice(0,8)) if (n>1) console.log(`  ${String(n).padStart(3)}x  [${fig}]${bankLH[fig]?"  (also in bank)":""}`);
