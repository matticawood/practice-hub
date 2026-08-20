// Verify a saved bank batch carries the fixes and is clean. Saved pieces are stripped of the generator's intent fields
// (_prog/_swap/...), so this checks only what the RAW notes support: validate(), the harmony-checks, the minor-cadence
// leading tone (read from the last two bars), and the lone-clip rhythm gesture (swap detected by register).
import fs from 'fs';
import { validate } from './engine.mjs';
import * as H from './harmony-checks.mjs';

const grade = +(process.argv[2] || 2);
const bank = JSON.parse(fs.readFileSync(new URL(`./bank/grade${grade}.json`, import.meta.url), 'utf8'));
const LET = { c:0, d:2, e:4, f:5, g:7, a:9, b:11 };
const pc = m => (((m%12)+12)%12);
const tonicPC = ex => { const l=LET[ex.key[0]]??0; const a=ex.key[1]==='f'?-1:ex.key[1]==='s'?1:0; return (((l+a)%12)+12)%12; };
const barU = ex => { const [a,b]=ex.time.split('/').map(Number); return (a/b)*4; };
const beatLen = ex => { const [t,b]=ex.time.split('/').map(Number); return (b===8&&t%3===0)?1.5:1; };
const tl = h => { let t=0,o=[]; for(const n of h){ o.push({...n,t}); t+=n.d; } return o; };
const pcsOf = n => Array.isArray(n.m)?n.m.map(pc):[pc(n.m)];
// swap by register: the melody staff is the higher one on average
const isSwap = ex => { const avg=h=>{const s=h.filter(n=>!n.rest);return s.length?s.reduce((a,n)=>a+(Array.isArray(n.m)?Math.max(...n.m):n.m),0)/s.length:0;}; return avg(ex.rh) < avg(ex.lh); };

let fails=[];
bank.forEach((ex,idx)=>{
  const issues=[];
  const v=validate(ex); if(v.errors&&v.errors.length) issues.push('validate:'+v.errors.slice(0,2).join('|'));
  for(const k of Object.keys(H)){ if(typeof H[k]!=='function'||k==='validate') continue;
    try{ const r=H[k](ex); const bad=Array.isArray(r)?r.filter(x=>!x.verdict||/FAULT/.test(x.verdict)):[]; if(bad.length) issues.push(k+':'+bad.length); }catch{} }
  // minor cadence leading tone: last two bars should sound the leading tone (raised ^7 = tonic+11)
  if(ex.mode==='min'){ const t=tonicPC(ex), lead=(t+11)%12, bU=barU(ex);
    const nb=Math.round((tl(ex.rh).at(-1).t+tl(ex.rh).at(-1).d)/bU);
    let hasLT=false; for(const arr of [ex.rh,ex.lh]) for(const n of tl(arr)){ if(n.rest)continue; if(Math.floor(n.t/bU+1e-9)>=nb-2 && pcsOf(n).includes(lead)) hasLT=true; }
    if(!hasLT) issues.push('minor-cadence-no-leading-tone');
  }
  // lone clip: a melody note chopped by an intra-beat rest over a sounding accompaniment, appearing exactly once
  { const swap=isSwap(ex); const mel=tl(swap?ex.lh:ex.rh), acc=tl(swap?ex.rh:ex.lh), bl=beatLen(ex);
    const accSounds=(a,b2)=>acc.some(n=>!n.rest&&n.t<b2-1e-9&&n.t+n.d>a+1e-9);
    const byBeat={}; for(const n of mel){ const bi=Math.floor(n.t/bl+1e-9); (byBeat[bi]??=[]).push(n); }
    let clips=0; for(const a of Object.values(byBeat)) for(let i=0;i+1<a.length;i++){ if(!a[i].rest&&a[i+1].rest&&accSounds(a[i+1].t,a[i+1].t+a[i+1].d)){clips++;break;} }
    if(clips===1) issues.push('lone-clip');
  }
  if(issues.length){ fails.push({idx:idx+1, key:ex.key+ex.mode, time:ex.time, tempo:ex.tempo, issues}); }
});

console.log(`grade ${grade}: ${bank.length} pieces | ${bank.length-fails.length} clean | ${fails.length} with issues`);
fails.forEach(f=>console.log(`  #${f.idx} ${f.key} ${f.time} "${f.tempo}": ${f.issues.join(', ')}`));
// summary of the book
const keys={}, metres={}, modes={}; bank.forEach(p=>{ keys[p.key+p.mode]=(keys[p.key+p.mode]||0)+1; metres[p.time]=(metres[p.time]||0)+1; modes[p.mode]=(modes[p.mode]||0)+1; });
console.log('keys:', JSON.stringify(keys)); console.log('metres:', JSON.stringify(metres), '| modes:', JSON.stringify(modes));
