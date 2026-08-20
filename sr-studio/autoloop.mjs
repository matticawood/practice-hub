// AUTOLOOP — the unattended self-improving loop. Coordinate-ascent over the generator's TUNING knobs:
// turn a knob, measure the clean-rate on a fresh batch, keep the change only if the clean-rate rises
// AND metre/figure variety doesn't collapse (the no-narrowing guard), else revert. Logs every step and
// persists the best config to best-tuning.json. Runs on its own until it converges.
//
// Usage:  node autoloop.mjs [grade] [batch]        e.g.  node autoloop.mjs 4 50
// Watch:  tail -f autoloop.log

import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generate, TUNING } from "./generator.mjs";
import { critique } from "./critic.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const grade = parseInt(process.argv[2] || "4", 10);
const N = parseInt(process.argv[3] || "50", 10);
const MARGIN = 0.03;   // require a clear improvement, not noise

const logPath = join(HERE, "autoloop.log");
const log = s => { const line = s + "\n"; process.stdout.write(line); fs.appendFileSync(logPath, line); };

// ── compact measurement (mirrors diagnose.mjs) ──────────────────────────────────────────
const PCS = m => ((m % 12) + 12) % 12, LET = { c:0,d:2,e:4,f:5,g:7,a:9,b:11 };
const barU = ex => { const [n,d] = ex.time.split("/").map(Number); return n*(4/d); };
const tonicPc = ex => PCS(LET[ex.key[0]] + (ex.key[1]==="f"?-1:ex.key[1]==="s"?1:0));
function lhFigure(ex) { const bu=barU(ex), bars={}; let t=0;
  for (const n of ex.lh) { const bi=Math.floor(t/bu+1e-9); (bars[bi]??=[]).push(n.rest?"r"+n.d:(Array.isArray(n.m)?"c":"b")+n.d); t+=n.d; }
  const cells=Object.values(bars).map(a=>a.join(",")); const f={}; for(const c of cells)f[c]=(f[c]||0)+1;
  return Object.entries(f).sort((a,b)=>b[1]-a[1])[0]?.[0]||""; }
function devices(ex) { const t=tonicPc(ex);
  const scale=new Set((ex.mode==="min"?[0,2,3,5,7,8,10,11]:[0,2,4,5,7,9,11]).map(x=>PCS(t+x)));
  if(ex.mode==="min"){ scale.add(PCS(t+11)); scale.add(PCS(t+9)); }
  let semiq=false,dot=false,tie=false,chord=false,chrom=false; const rng={rh:[999,0],lh:[999,0]};
  for(const h of["rh","lh"])for(const n of ex[h]){ if(n.rest)continue;
    if(n.d<0.5-1e-9)semiq=true; if([0.75,1.5,3].includes(n.d))dot=true; if(n.ti)tie=true;
    const ms=Array.isArray(n.m)?n.m:[n.m]; if(ms.length>1)chord=true;
    for(const m of ms){ if(!scale.has(PCS(m)))chrom=true; if(m<rng[h][0])rng[h][0]=m; if(m>rng[h][1])rng[h][1]=m; } }
  return [semiq,dot,tie,chord,chrom,(rng.rh[1]-rng.rh[0]>7)||(rng.lh[1]-rng.lh[0]>7),ex.time==="6/8",!!ex.partial].filter(Boolean).length; }

const bank = JSON.parse(fs.readFileSync(join(HERE,"bank",`grade${grade}.json`),"utf8"));
const bankLH = new Set(bank.map(lhFigure));

function measure() {
  let clean=0; const metres=new Set(), cleanFigs=new Set();
  for (let i=0;i<N;i++) {
    let ex; try { ex = generate(grade, grade===2?3000:12000, bank); } catch { continue; }
    if (!ex) continue;
    metres.add(ex.time);
    const lh=lhFigure(ex), cq=critique(ex);
    const ok = !bankLH.has(lh) && cq.skeleton>=0.6 && cq.cadence && devices(ex)>=3;
    if (ok) { clean++; cleanFigs.add(lh); }
  }
  return { clean: clean/N, metres: metres.size, figs: cleanFigs.size };
}
const pctS = m => `clean=${Math.round(m.clean*100)}% metres=${m.metres} figs=${m.figs}`;
const persist = () => fs.writeFileSync(join(HERE,"best-tuning.json"), JSON.stringify(TUNING,null,2));

// ── search ───────────────────────────────────────────────────────────────────────────────
const KNOBS = { figCap:[2,3], sixEight:[1,2], floorMin:[3,4], figDist:[2,2.5,3,4], distinct:[5,6,7] };

log(`\n=== autoloop start  grade ${grade}, batch ${N}  ${new Date().toISOString().slice(0,19)} ===`);
let best = measure();
log(`baseline  ${pctS(best)}  TUNING=${JSON.stringify(TUNING)}`);
persist();

const MAX_PASSES = 6;
for (let pass=1; pass<=MAX_PASSES; pass++) {
  log(`\n-- pass ${pass} --`);
  let improved=false;
  for (const [knob, vals] of Object.entries(KNOBS)) {
    const cur = TUNING[knob];
    for (const v of vals) {
      if (v===cur) continue;
      TUNING[knob]=v;
      const m = measure();
      // no-narrowing guard: keep at least 4 metres and don't collapse the clean figure variety
      const guard = m.metres>=4 && m.figs >= Math.max(6, best.figs-2);
      if (m.clean > best.clean + MARGIN && guard) {
        log(`  ACCEPT ${knob} ${cur} -> ${v}   ${pctS(m)}`);
        best=m; improved=true; persist();
      } else {
        TUNING[knob]=cur;
        log(`  reject ${knob}=${v}   ${pctS(m)}${guard?"":"  (narrowed)"}`);
      }
    }
  }
  if (!improved) { log(`\nconverged at pass ${pass}.`); break; }
}
log(`\n=== done. best ${pctS(best)}  TUNING=${JSON.stringify(TUNING)} (saved to best-tuning.json) ===`);
