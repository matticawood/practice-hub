import { generateCompose } from './compose-adapter.mjs';
import { validate } from './engine.mjs';
for (const g of [3, 4]) {
  let n = 0, pairs = 0, samePair = 0, stepPair = 0, leapPair = 0;
  for (let i = 0; i < 12000 && n < 400; i++) {
    const ex = generateCompose(g);
    if (!validate(ex).ok) continue;
    if (ex._texture !== 'bassline') continue;
    n++;
    const lh = (ex._swap ? ex.rh : ex.lh).filter(x => !x.rest).map(x => x.m);
    for (let k = 1; k < lh.length; k++) {
      const d = Math.abs(lh[k] - lh[k - 1]); pairs++;
      if (d === 0) samePair++; else if (d <= 2) stepPair++; else leapPair++;
    }
  }
  console.log('grade', g, '| pieces', n, '| SAME(stalled)', (100 * samePair / pairs).toFixed(0) + '%',
    '| step(<=2)', (100 * stepPair / pairs).toFixed(0) + '%', '| leap(>2)', (100 * leapPair / pairs).toFixed(0) + '%');
}
