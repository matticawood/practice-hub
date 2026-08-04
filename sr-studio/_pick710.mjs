import { generate } from './generator.mjs';
import { validate } from './engine.mjs';
import { leapClashes, sixFours, parallelPerfects, lhParallels, beatDissonance, beatClash } from './harmony-checks.mjs';
import fs from 'fs';
const bank = JSON.parse(fs.readFileSync('./bank/grade4.json','utf8'));
const usedKeys = bank.map(e=>e.key+e.mode).concat(['cmaj']);        // avoid all in-use keys + plain C major
const avoid = bank.slice();
const lo=n=>Array.isArray(n.m)?Math.min(...n.m):n.m, hi=n=>Array.isArray(n.m)?Math.max(...n.m):n.m;
const bassRun=ex=>{let r=1,mx=1,p=null;for(const n of ex.lh){if(n.rest){p=null;r=1;continue;}const l=lo(n);if(l===p){r++;if(r>mx)mx=r;}else r=1;p=l;}return mx;};
const lhFloor=ex=>Math.min(...ex.lh.filter(n=>!n.rest).map(lo));
const rng=ex=>{const ps=ex.rh.flatMap(n=>n.rest?[]:(Array.isArray(n.m)?n.m:[n.m]));return Math.max(...ps)-Math.min(...ps);};
const semis=ex=>ex.rh.filter(n=>!n.rest&&n.d<=0.5).length;
const maxDownLeap=ex=>{const m=ex.rh.filter(n=>!n.rest).map(hi);let mx=0;for(let i=1;i<m.length;i++){const d=m[i-1]-m[i];if(d>mx)mx=d;}return mx;};
const maxAltRun=ex=>{const m=ex.rh.filter(n=>!n.rest).map(hi);let mx=1,r=1;for(let i=2;i<m.length;i++){if(m[i]===m[i-2]&&m[i]!==m[i-1]){r++;if(r+1>mx)mx=r+1;}else r=1;}return mx;};
const maxRepeat=ex=>{const m=ex.rh.filter(n=>!n.rest).map(hi);let mx=1,r=1;for(let i=1;i<m.length;i++){if(m[i]===m[i-1]){r++;if(r>mx)mx=r;}else r=1;}return mx;};
const staticFrac=ex=>{const[t,b]=ex.time.split('/').map(Number);const bu=(t/b)*4;const B={};let x=0;for(const n of ex.lh){const k=Math.floor(x/bu+1e-9);(B[k]??=new Set());if(!n.rest)B[k].add((Array.isArray(n.m)?n.m:[n.m]).join(','));x+=n.d;}const K=Object.keys(B);return K.filter(k=>B[k].size<=1).length/K.length;};
const chordFrac=ex=>{const t=ex.rh.filter(n=>!n.rest);return t.filter(n=>Array.isArray(n.m)).length/Math.max(1,t.length);};
const nm=m=>['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'][((m%12)+12)%12]+(Math.floor(m/12)-1);
const clean=ex=>{ const v=validate(ex); if(v.errors.length) return false;
  const f=leapClashes(ex).length+sixFours(ex).length+parallelPerfects(ex).length+lhParallels(ex).length+beatDissonance(ex).length+beatClash(ex).length;
  return f===0 && !usedKeys.includes(ex.key+ex.mode)                                   // any metre allowed - let slow/lyrical characters in
    && rng(ex)>=10 && semis(ex)>=2 && bassRun(ex)<=2 && lhFloor(ex)>=45 && maxDownLeap(ex)<=9
    && maxAltRun(ex)<=3 && maxRepeat(ex)<=2 && staticFrac(ex)<=0.5 && chordFrac(ex)<=0.5; };  // looser: don't exclude lyrical/bold textures

const survivors=[];
for(let t=0;t<800 && survivors.length<70;t++){ const ex=generate(4,12000,avoid); if(ex && clean(ex)) survivors.push(ex); }
console.log('survivors:',survivors.length,'| distinct tempos:',[...new Set(survivors.map(e=>e.tempo))].length);
fs.writeFileSync('./_pool710.json', JSON.stringify(survivors,null,1));   // full pool saved so re-selection is instant

// character family from the tempo mark
const prof=t=>{t=(t||'').toLowerCase();return /cantabile|sostenuto|espress|dolce|tranquillo|semplice|adagio|larghetto|lento|mesto|lament|andante/.test(t)?'lyrical':/graz|minuet|gavotte|waltz|siciliano|barcarol/.test(t)?'graceful':/scherz|giocoso|leggiero|vivace|comodo|risoluto|brio|allegro|presto|con moto/.test(t)?'light':/march|maest|grand|marcia|pomp/.test(t)?'bold':'plain';};
// pick 4 to FILL GAPS across bank+picks: favour under-represented character/metre/mode; never a duplicate key.
console.log('  pool:'); survivors.forEach((ex,i)=>console.log(`   [${i}] ${ex.time} ${ex.key}${ex.mode} "${ex.tempo}" [${prof(ex.tempo)}] static=${staticFrac(ex).toFixed(2)} semis=${semis(ex)}`));
const count=(arr,f)=>{const c={};arr.forEach(e=>c[f(e)]=(c[f(e)]||0)+1);return c;};
const picked=[];
// Force FOUR DISTINCT metres and distinct tempo marks; balance major/minor. Fall back only if the pool can't.
while(picked.length<4 && survivors.length){
  const pmetres=new Set(picked.map(p=>p.time)), ptempos=new Set(picked.map(p=>p.tempo)), oc=count(bank.concat(picked),e=>e.mode);
  let best=-1e9, bi=-1;
  survivors.forEach((ex,i)=>{
    if(picked.some(p=>p.key+p.mode===ex.key+ex.mode)) return;                          // never a duplicate key
    let s=Math.random()*0.2;
    if(!pmetres.has(ex.time)) s+=5; else s-=5;                                          // strongly want a NEW metre each pick
    if(!ptempos.has(ex.tempo)) s+=3; else s-=8;                                         // and a distinct tempo mark
    s -= 1.2*(oc[ex.mode]||0);                                                          // balance major/minor
    if(s>best){best=s;bi=i;} });
  if(bi<0) break;
  picked.push(survivors.splice(bi,1)[0]);
}
picked.forEach((ex,i)=>{
  console.log(`\nSLOT ${bank.length+1+i}: ${ex.time} ${ex.key}${ex.mode} "${ex.tempo}" [${prof(ex.tempo)}] range=${rng(ex)} semis=${semis(ex)} static=${staticFrac(ex).toFixed(2)}`);
  console.log('   RH:', ex.rh.map(n=>n.rest?'r':(Array.isArray(n.m)?n.m.map(nm).join('+'):nm(n.m))).join(' '));
});
fs.writeFileSync('./_cand710.json', JSON.stringify(picked,null,1));
