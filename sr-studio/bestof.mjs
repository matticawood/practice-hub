// BESTOF — generate a handful of candidates and return the ONE the audit rates highest. This is the
// single-generate selector: even while the generator keeps improving underneath, "give me one" runs a
// few, has the LLM audit judge them (grade-fit, idiomatic rhythm both hands, musical melody), and hands
// back the best. Writes it to bestof-out/ as JSON + an engraved PNG.
//
// Usage:  node bestof.mjs <grade> [pool]        e.g.  node bestof.mjs 4 5

import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { generate } from "./generator.mjs";
import { lilyWithMap } from "./engine.mjs";
import { auditPiece, auditScore } from "./audit-lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const grade = parseInt(process.argv[2] || "4", 10);
const pool = parseInt(process.argv[3] || "5", 10);

const bank = JSON.parse(fs.readFileSync(join(HERE,"bank",`grade${grade}.json`),"utf8"));
const cands = [];
for (let i=0;i<pool;i++){ let ex; try{ ex=generate(grade, grade===2?3000:12000, bank);}catch{continue;} if(ex) cands.push(ex); }
console.log(`Generated ${cands.length} candidates; auditing...`);

const scored = [];
for (const ex of cands) { const v = await auditPiece(ex, grade); const s = auditScore(v); scored.push({ ex, v, s });
  console.log(`  ${(v?.verdict||"?").padEnd(6)} score ${s.toFixed(2)}  ${ex.tempo} ${ex.key}${ex.mode} ${ex.time}  ${v?.reason?.slice(0,70)||""}`); }
scored.sort((a,b)=>b.s-a.s);
const best = scored[0];
if (!best) { console.log("nothing generated"); process.exit(1); }

const out = join(HERE,"bestof-out"); fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(join(out,`grade${grade}-best.json`), JSON.stringify(best.ex,null,2));
try { const id=`best${grade}`; const ly=join(tmpdir(),id+".ly"); fs.writeFileSync(ly, lilyWithMap({...best.ex,n:""},20).ly);
  execFileSync("lilypond",["-dcrop","--png","-dresolution=170","-o",join(out,`grade${grade}-best`),ly],{stdio:"ignore"});
} catch {}
console.log(`\nBEST (score ${best.s.toFixed(2)}, ${best.v?.verdict}): ${best.ex.tempo} ${best.ex.key}${best.ex.mode} ${best.ex.time}`);
console.log(`  ${best.v?.reason||""}`);
console.log(`saved -> bestof-out/grade${grade}-best.json (+ .cropped.png)`);
