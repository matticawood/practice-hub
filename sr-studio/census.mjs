// Anti-narrowing guard for the improvement loop (Matthew's rule: eliminate a PROBLEM, never a POSSIBILITY).
//   node census.mjs save <file>     snapshot the generator's capability fingerprint BEFORE a fix
//   node census.mjs check <file>    after a fix, FAIL (exit 1) if any capability shrank
import { capabilityCensus } from './critic.mjs';
import { generate } from './generator.mjs';
import { validate } from './engine.mjs';
import { readFileSync, writeFileSync } from 'fs';
const [,, cmd, file] = process.argv;
const N = 800;
const pieces=[]; let tries=0;
while(pieces.length<N && tries<N*10){ tries++; const ex=generate(4,2000,null); if(ex && !validate(ex).errors.length) pieces.push(ex); }
const c = capabilityCensus(pieces);

if(cmd==='save'){ writeFileSync(file, JSON.stringify(c,null,1)); console.log(`census saved (${pieces.length} pieces):`); console.log(JSON.stringify(c)); }
else if(cmd==='check'){
  const base=JSON.parse(readFileSync(file,'utf8'));
  const shrink=[];
  // small-cardinality / presence signals: any drop is a lost device (allow tiny sampling slack on presence counts)
  // truly small-cardinality, near-deterministic vocabularies: any drop is a lost device
  const strict=['metres','keys','intervals','articulations','dynamics'];
  for(const k of strict) if(c[k] < base[k]) shrink.push(`${k}: ${base[k]} -> ${c[k]} (lost a device)`);
  const presence=['piecesWithRest','piecesWithChromatic'];
  for(const k of presence) if(c[k] < base[k]*0.75) shrink.push(`${k}: ${base[k]} -> ${c[k]} (device becoming rare)`);
  // larger counts carry sampling noise (a fresh random batch each run), so only flag a real (>10%) collapse.
  // chordSigs (~80) belongs here, not strict: a ±2 wobble between batches is noise, not a lost chord.
  const loose=['tempos','rhythmCells','lhCells','contours','progressions','chordSigs'];
  for(const k of loose) if(c[k] < base[k]*0.90) shrink.push(`${k}: ${base[k]} -> ${c[k]} (variety collapsed)`);
  // RANGES must not compress. registerLo/Hi are the MIN/MAX pitch across an 800-piece sample - extreme order
  // statistics that swing a couple of semitones between batches (they depend on the single lowest/highest piece
  // drawn, and its key/octave). A ±1 tolerance flags that noise; use ±3 so only a real range compression trips it.
  if(c.registerLo > base.registerLo+3) shrink.push(`registerLo rose ${base.registerLo}->${c.registerLo} (lost low register)`);
  if(c.registerHi < base.registerHi-3) shrink.push(`registerHi fell ${base.registerHi}->${c.registerHi} (lost high register)`);
  // leapRatioLo/Hi are the MIN/MAX leap-ratio across an 800-piece random sample - extreme ORDER STATISTICS, so they
  // swing ~0.05-0.08 between batches purely from whether the single most-stepwise / most-leaping piece was drawn.
  // A 0.06 tolerance flags that sampling noise as "narrowing" (a false positive, like chordSigs). Use 0.15 so only a
  // real compression of the melodic-leap RANGE trips it, not the jitter of the extremes.
  if(c.leapRatioLo > base.leapRatioLo+0.15) shrink.push(`leapRatioLo rose ${base.leapRatioLo}->${c.leapRatioLo} (lost stepwise melodies)`);
  if(c.leapRatioHi < base.leapRatioHi-0.15) shrink.push(`leapRatioHi fell ${base.leapRatioHi}->${c.leapRatioHi} (lost leaping melodies)`);
  if(shrink.length){ console.log('NARROWED — this fix eliminated possibilities, REJECT it:'); shrink.forEach(s=>console.log('  '+s)); process.exit(1); }
  console.log('OK — no capability lost. The fix removed a problem, not a possibility.');
}
