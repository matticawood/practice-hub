// Objective-function readout for the improvement loop. Run: node measure.mjs [n]
// Generates a batch of clean grade-4 pieces and reports the critic profile + variety guard + validity.
import { critique, variety } from './critic.mjs';
import { generate } from './generator.mjs';
import { validate } from './engine.mjs';
import { leapClashes, sixFours, parallelPerfects, lhParallels, beatClash } from './harmony-checks.mjs';

const N = Number(process.argv[2] || 100);
const pieces = []; let tries = 0, valErr = 0, harmFault = 0;
while (pieces.length < N && tries < N * 12) {
  tries++;
  const ex = generate(4, 2000, null); if (!ex) continue;
  if (validate(ex).errors.length) { valErr++; continue; }
  if (leapClashes(ex).length + sixFours(ex).length + parallelPerfects(ex).length + lhParallels(ex).length + beatClash(ex).length) { harmFault++; continue; }
  pieces.push(ex);
}
const cs = pieces.map(critique);
const avg = k => (cs.reduce((s, c) => s + (typeof c[k] === 'boolean' ? (c[k] ? 1 : 0) : c[k]), 0) / cs.length);
const inBand = (v, lo, hi) => v >= lo && v <= hi;
const leaps = cs.map(c => c.leapRatio);
const leapOut = leaps.filter(v => !inBand(v, 0.25, 0.5)).length;
const v = variety(pieces);
console.log(`n=${pieces.length}  valErr=${valErr} harmFault=${harmFault} (of ${tries} tries)`);
console.log(`QUALITY  skeleton=${avg('skeleton').toFixed(2)} [want>=0.85]  motif=${(100*avg('motif')).toFixed(0)}% [want>=70]  cadence=${(100*avg('cadence')).toFixed(0)}% [want>=80]`);
console.log(`         onBeatDiss=${avg('onBeatDiss').toFixed(1)}  dissRepeat=${avg('dissRepeat').toFixed(2)} [want~0]  staticRuns=${avg('staticRuns').toFixed(2)} [want~0]  strongRests=${avg('strongRests').toFixed(1)}`);
console.log(`         leapRatio avg=${avg('leapRatio').toFixed(2)} [want 0.25-0.50], out-of-band=${(100*leapOut/cs.length).toFixed(0)}%`);
console.log(`VARIETY  metre=${v.metre.toFixed(2)} tempo=${v.tempo.toFixed(2)} openRhythm=${v.openRhythm.toFixed(2)} contour=${v.contour.toFixed(2)} bassLine=${v.bassLine.toFixed(2)}  [these must NOT fall after a fix]`);
