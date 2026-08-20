import { harmonicPlan, composeMelody, composeBass } from './compose.mjs';
import { leapClashes, parallelPerfects, beatClash, sixFours } from './harmony-checks.mjs';

const NOTE = { c:0, d:2, e:4, f:5, g:7, a:9, b:11 };
// grade-ish canvases: melody register (5-finger-ish) + bass register
const GRADES = {
  2: { melRange:[60,72], bassRange:[48,60], nbars:8, holds:[1,1,2] },
  3: { melRange:[59,74], bassRange:[45,62], nbars:8, holds:[1,2] },
  4: { melRange:[57,77], bassRange:[43,64], nbars:8, holds:[1,2] },
};
const forms = nbars => ([
  { nbars, cadences:[{bar:3,type:'HC'},{bar:7,type:'PAC'}] },
  { nbars, cadences:[{bar:3,type:'IAC'},{bar:7,type:'PAC'}] },
  { nbars, cadences:[{bar:3,type:'HC'},{bar:7,type:'IAC'}] },
]);

function buildEx(g, mode, i) {
  const cfg = GRADES[g];
  const barU = 4, beatLen = 1;
  const rnd = Math.random;
  const form = forms(cfg.nbars)[i % 3];
  const character = { harmonicRhythmBars: cfg.holds[i % cfg.holds.length] };
  const tonic = 60 + NOTE.c;   // C
  const plan = harmonicPlan({ grade:g, mode, barU, form, character, rnd });
  const melody = composeMelody({ plan, tonic, mode, barU, beatLen, nbars:cfg.nbars, range:cfg.melRange, rnd });
  const bass   = composeBass({ plan, tonic, mode, barU, nbars:cfg.nbars, range:cfg.bassRange, melody, rnd });
  return { rh: melody, lh: bass, time:'4/4', mode, key:'c' };
}

for (const g of [2,3,4]) {
  for (const mode of ['maj','min']) {
    const N = 300;
    let leap=0, pp=0, bc=0, sf=0, bassLeaps=[], notes=0;
    for (let i=0;i<N;i++) {
      const ex = buildEx(g, mode, i);
      if (leapClashes(ex).some(x=>/FAULT/.test(x.verdict))) leap++;
      if (parallelPerfects(ex).length) pp++;
      if (beatClash(ex).length) bc++;
      if (sixFours(ex).length) sf++;
      // bass line coherence: max leap between consecutive bass notes
      let mx=0; for (let k=1;k<ex.lh.length;k++) mx=Math.max(mx, Math.abs(ex.lh[k].m-ex.lh[k-1].m));
      bassLeaps.push(mx);
    }
    bassLeaps.sort((a,b)=>a-b);
    const pct = x => (100*x/N).toFixed(1)+'%';
    console.log(`g${g} ${mode}: leapClash ${pct(leap)}  parallelP ${pct(pp)}  beatClash ${pct(bc)}  6/4 ${pct(sf)}  | bass maxleap med=${bassLeaps[Math.floor(N/2)]} p90=${bassLeaps[Math.floor(N*0.9)]}`);
  }
}
