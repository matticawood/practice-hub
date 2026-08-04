// Corpus-level variety. The harmony checks stop an exercise sounding WRONG; these
// stop the collection sounding SAME. Rules alone converge on one shape, so this
// reports what the bank is already saturated with, to steer each revision away.
const barU = t => { const [a,b]=t.split('/').map(Number); return (a/b)*4; };
const barsOf = (seq,u) => { let t=0; const o=[]; seq.forEach(n=>{ const i=Math.floor(t/u+1e-9); (o[i]=o[i]||[]).push(n); t+=n.d; }); return o; };
const pitches = a => a.filter(n=>!n.rest).map(n=>Array.isArray(n.m)?n.m[0]:n.m);
const rhy = a => a.map(n=>(n.rest?'r':'')+n.d).join(',');

export const skeleton = ex => barsOf(ex.rh, barU(ex.time)).map(rhy).join(' | ');

export function structure(ex){
  const bars = barsOf(ex.rh, barU(ex.time));
  if(bars.length < 3) return 'short';
  const p1 = pitches(bars[0]), p3 = pitches(bars[2]);
  if(p1.length===p3.length && p1.length && p1.every((v,i)=>v===p3[i])) return 'restate';
  if(p1.length===p3.length && p1.length>1){ const d=p3[0]-p1[0];
    if(p1.every((v,i)=>p3[i]-v===d)) return 'sequence'; }
  if(rhy(bars[0])===rhy(bars[2])) return 'same-rhythm';
  return 'contrasting';
}
// Broad melodic shape, so we can avoid three arches in a row.
export function contour(ex){
  const p = pitches(ex.rh); if(p.length<3) return 'flat';
  const mid = p[Math.floor(p.length/2)], a=p[0], z=p[p.length-1], hi=Math.max(...p), lo=Math.min(...p);
  if(mid>=hi-1 && a<hi && z<hi) return 'arch';
  if(mid<=lo+1 && a>lo && z>lo) return 'valley';
  return z>a ? 'rising' : z<a ? 'falling' : 'level';
}
export const openInterval = ex => { const p=pitches(ex.rh); return p.length>1 ? p[1]-p[0] : 0; };

export function report(bank){
  const count = (fn) => { const m={}; bank.forEach(e=>{ const k=String(fn(e)); m[k]=(m[k]||0)+1; }); return m; };
  return { skeleton: count(skeleton), structure: count(structure), contour: count(contour),
           combo: count(e=>`${e.key} ${e.mode} ${e.time} ${e.tempo}`), open: count(openInterval) };
}
// How much a candidate duplicates what is already there.
export function novelty(bank, ex){
  const r = report(bank), n=[];
  const s=skeleton(ex), st=structure(ex), c=contour(ex), cb=`${ex.key} ${ex.mode} ${ex.time} ${ex.tempo}`;
  if((r.skeleton[s]||0) > 0) n.push(`rhythm skeleton already used ${r.skeleton[s]} time(s): ${s}`);
  if((r.combo[cb]||0) > 0) n.push(`key/metre/tempo already used ${r.combo[cb]} time(s)`);
  const stPct = Math.round(((r.structure[st]||0)/bank.length)*100);
  if(stPct >= 40) n.push(`structure "${st}" is ${stPct}% of the bank`);
  const cPct = Math.round(((r.contour[c]||0)/bank.length)*100);
  if(cPct >= 40) n.push(`contour "${c}" is ${cPct}% of the bank`);
  return n;
}
