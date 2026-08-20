// AUDITSAMPLE — generate a small sample and report the aggregate LLM musicality score, so the master
// loop can gate a change on "did it stay musical / not get jerkier", not just the mechanical clean-rate.
// Prints one parseable line:  AUDITSCORE: <0..1>  jerky: <pct>  weak: <pct>  n: <count>
// Usage:  node auditsample.mjs <grade> <n>

import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generate } from "./generator.mjs";
import { auditPiece, auditScore } from "./audit-lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const grade = parseInt(process.argv[2] || "4", 10);
const n = parseInt(process.argv[3] || "6", 10);
const bank = JSON.parse(fs.readFileSync(join(HERE,"bank",`grade${grade}.json`),"utf8"));

let sum=0, cnt=0, jerky=0, weak=0;
for (let i=0;i<n;i++){
  let ex; try{ ex=generate(grade, grade===2?3000:12000, bank);}catch{continue;} if(!ex) continue;
  const v = await auditPiece(ex, grade); if(!v) continue;
  sum += auditScore(v); cnt++; if(v.jerky_rhythm) jerky++; if(v.musicality==="weak") weak++;
}
const avg = cnt ? sum/cnt : 0;
console.log(`AUDITSCORE: ${avg.toFixed(3)}  jerky: ${cnt?Math.round(jerky/cnt*100):0}  weak: ${cnt?Math.round(weak/cnt*100):0}  n: ${cnt}`);
