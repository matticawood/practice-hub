// EVOLVE (master) — the set-and-forget self-improving cycle. Each round, for EVERY grade (2, 3, 4):
//   (1) knob-tune the shared TUNING knobs on the clean-rate,
//   (2) grow the LEFT-hand figure bank for each of the grade's metres,
//   (3) grow the RIGHT-hand rhythm cells for each character feel,
// and KEEP any change only if BOTH gates hold: the mechanical clean-rate did not fall, AND the LLM
// audit's musicality did not fall (not jerkier, not weaker). Anything else reverts. Backups + syntax
// checks guard the generator at every step. Objective = grade-appropriate (per-grade floor/ceiling),
// diverse (fresh figures both hands), and genuinely musical (the audit). Logs to evolve.log; runs alone.
//
// Usage:  node evolve.mjs [rounds]        Watch:  tail -f evolve.log

import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const GEN = join(HERE, "generator.mjs");
const TUNE = join(HERE, "best-tuning.json");
const rounds = parseInt(process.argv[2] || "2", 10);
const GRADES = [4, 3, 2];
const METRES = { 2:["4/4","3/4","2/4"], 3:["4/4","3/4","2/4","3/8"], 4:["4/4","3/4","2/4","3/8","6/8"] };
const FEELS = ["smooth","lilt","crisp"];
const KNOBS = { figCap:[2,3], sixEight:[1,2], floorMin:[3,4], figDist:[2,2.5,3,4], distinct:[5,6,7] };
const AUDIT_MARGIN = 0.04;   // audit score may dip this much (noise) but no more

const log = s => { const l=s+"\n"; process.stdout.write(l); fs.appendFileSync(join(HERE,"evolve.log"),l); };
const run = (a) => { try { return execFileSync("node", a, { cwd:HERE, encoding:"utf8", stdio:["ignore","pipe","pipe"], maxBuffer:1<<24 }); } catch(e){ return (e.stdout||"")+(e.stderr||""); } };
const syntaxOK = () => { try { execFileSync("node",["--check",GEN],{cwd:HERE,stdio:"ignore"}); return true; } catch { return false; } };
const cleanRate = g => { const m=/CLEAN[^\n]*\((\d+)%\)/.exec(run(["diagnose.mjs",String(g),"60"])); return m?+m[1]:null; };
const auditScore = g => { const m=/AUDITSCORE:\s*([\d.]+)\s+jerky:\s*(\d+)/.exec(run(["auditsample.mjs",String(g),"6"])); return m?{score:+m[1],jerky:+m[2]}:null; };
const backup = () => fs.copyFileSync(GEN, GEN+".evbak");
const revert = () => fs.copyFileSync(GEN+".evbak", GEN);

let tuning = { figCap:2, sixEight:1, floorMin:3, figDist:2.5, distinct:6 };
fs.writeFileSync(TUNE, JSON.stringify(tuning,null,2));

log(`\n=== evolve (master) start  ${new Date().toISOString().slice(0,19)}  grades ${GRADES.join(",")} ===`);
const bestClean = {}, bestAudit = {};
for (const g of GRADES) { bestClean[g]=cleanRate(g); const a=auditScore(g); bestAudit[g]=a?a.score:0; log(`grade ${g}: baseline clean ${bestClean[g]}%  audit ${bestAudit[g].toFixed(2)} (jerky ${a?a.jerky:"?"}%)`); }

// keep the current generator ONLY if both gates hold for `g`; otherwise revert. Returns true if kept.
function gate(g, tag) {
  if (!syntaxOK()) { revert(); log(`    ${tag}: parse broke — reverted`); return false; }
  const c = cleanRate(g);
  if (c == null || c < bestClean[g]) { revert(); log(`    ${tag}: clean ${c}% < ${bestClean[g]}% — reverted`); return false; }
  const a = auditScore(g);
  if (!a || a.score < bestAudit[g] - AUDIT_MARGIN) { revert(); log(`    ${tag}: audit ${a?a.score.toFixed(2):"?"} < ${bestAudit[g].toFixed(2)} — reverted`); return false; }
  bestClean[g] = c; bestAudit[g] = Math.max(bestAudit[g], a.score);
  log(`    ${tag}: KEPT  clean ${c}%  audit ${a.score.toFixed(2)} (jerky ${a.jerky}%)`);
  return true;
}

for (let round=1; round<=rounds; round++) {
  log(`\n######## round ${round} ########`);
  let improved = false;

  // (1) knob-tune (shared knobs; measured on grade 4)
  log(`-- knobs --`);
  for (const [k,vals] of Object.entries(KNOBS)) for (const v of vals) {
    if (v===tuning[k]) continue;
    const trial={...tuning,[k]:v}; fs.writeFileSync(TUNE,JSON.stringify(trial));
    const c=cleanRate(4);
    if (c!=null && c>bestClean[4]) { const a=auditScore(4); if(a && a.score>=bestAudit[4]-AUDIT_MARGIN){ tuning=trial; bestClean[4]=c; bestAudit[4]=Math.max(bestAudit[4],a.score); improved=true; log(`  knob ${k}->${v}: clean ${c}% audit ${a.score.toFixed(2)} KEPT`); continue; } }
    fs.writeFileSync(TUNE,JSON.stringify(tuning));
  }

  // (2)+(3) grow both hands, every grade
  for (const g of GRADES) {
    log(`-- grade ${g} grow --`);
    for (const metre of METRES[g]) { backup(); run(["growfig.mjs",String(g),"lh",metre,"12"]); if(gate(g,`LH ${metre}`)) improved=true; }
    for (const feel of FEELS)      { backup(); run(["growfig.mjs",String(g),"rh",feel,"10"]);  if(gate(g,`RH ${feel}`)) improved=true; }
  }

  if (!improved) { log(`\nno improvement this round — converged.`); break; }
}
try { fs.unlinkSync(GEN+".evbak"); } catch {}
log(`\n=== done. ${GRADES.map(g=>`G${g} clean ${bestClean[g]}% audit ${bestAudit[g].toFixed(2)}`).join("  |  ")}  knobs=${JSON.stringify(tuning)} ===`);
