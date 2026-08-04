// Batch generator for the grade banks. Appends pieces up to a target count, with three neighbour-variety screens
// (all reject-and-reroll only — none removes anything from the generator's vocabulary, so nothing narrows):
//   1. KEY spread    — no back-to-back same key+mode; nudge off any key already at 4+ in the bank.
//   2. FIGURE spread — no adjacent same metre+accompaniment-figure (ex._figSig).
//   3. RHYTHM spread — no adjacent same metre+dominant melodic bar-rhythm (Matthew: same rhythm across exercises).
// Usage:  node gen-batch.mjs [grade] [targetCount]
import { generate } from './generator.mjs';
import fs from 'fs';
const grade = +(process.argv[2] || 4);
const bankPath = new URL(`./bank/grade${grade}.json`, import.meta.url);
const snapDir  = new URL('./bank/.snapshots/', import.meta.url);
const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
const target = +(process.argv[3] || bank.length + 5);

const km = p => p.key + ' ' + p.mode;
const clean = e => { const o={grade:e.grade,key:e.key,mode:e.mode,flat:e.flat,time:e.time,tempo:e.tempo,rhFinger:e.rhFinger,lhFinger:e.lhFinger,rh:e.rh,lh:e.lh}; if(e.partial)o.partial=e.partial; return o; };
const figSig = e => `${e.time}|${e._figSig}`;
function domRhythm(e){                                   // metre + most-common melody bar-rhythm
  const mel = e._mel==='lh' ? e.lh : e.rh;
  const [t,b]=e.time.split('/').map(Number); const barU=(t/b)*4;
  const bars=[]; let pos=e.partial?(barU-e.partial):0, cur=[];
  for(const n of mel){ if((pos%barU)<1e-6 && cur.length){ bars.push(cur.join(',')); cur=[]; } cur.push(+n.d.toFixed(3)); pos+=n.d; }
  if(cur.length) bars.push(cur.join(','));
  const c={}; bars.forEach(s=>c[s]=(c[s]||0)+1);
  let best='',bc=0; for(const [s,n] of Object.entries(c)) if(n>bc){bc=n;best=s;}
  return `${e.time}|${best}`;
}

let prevFig=null, prevRhy=null;
while (bank.length < target) {
  const slot = bank.length + 1;
  const cnt={}; bank.forEach(p=>cnt[km(p)]=(cnt[km(p)]||0)+1);
  const heavy=new Set(Object.entries(cnt).filter(([,c])=>c>=4).map(([k])=>k));
  const avoid=new Set([km(bank[bank.length-1]), ...heavy]);
  let ex=null;
  for (let t=0;t<600;t++){ const c=generate(grade,2500,bank);
    if(!c || avoid.has(km(c))) continue;
    if(prevFig && figSig(c)===prevFig) continue;
    if(prevRhy && domRhythm(c)===prevRhy) continue;
    ex=c; break; }
  if(!ex) for(let t=0;t<400;t++){ const c=generate(grade,2500,bank); if(c && !avoid.has(km(c))){ ex=c; break; } }  // fallback: key-spread only
  if(!ex){ console.error('could not generate slot', slot); break; }
  const c=clean(ex); bank.push(c);
  fs.writeFileSync(new URL(`slot${slot}.gen.json`, snapDir), JSON.stringify(c,null,1));
  prevFig=figSig(ex); prevRhy=domRhythm(ex);
  console.log(`slot ${slot}: ${c.key} ${c.mode}  ${c.time} "${c.tempo}"  swap=${ex._mel==='lh'}  fig=${ex._tex}  RH${c.rh.length}/LH${c.lh.length}`);
}
fs.writeFileSync(bankPath, JSON.stringify(bank,null,1));
console.log('bank now', bank.length, 'pieces. saved. (run: node enforce-locks.mjs '+grade+')');
