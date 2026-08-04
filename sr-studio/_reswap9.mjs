import { generate } from './generator.mjs';
import { validate } from './engine.mjs';
import { leapClashes, sixFours, parallelPerfects, lhParallels, beatDissonance, beatClash } from './harmony-checks.mjs';
import fs from 'fs';
const bank = JSON.parse(fs.readFileSync('./bank/grade4.json','utf8'));
const usedKeys = bank.filter((e,i)=>i!==8).map(e=>e.key+e.mode).concat(['cmaj']);
const avoid = bank.filter((e,i)=>i!==8);
const lo=n=>Array.isArray(n.m)?Math.min(...n.m):n.m, hi=n=>Array.isArray(n.m)?Math.max(...n.m):n.m;
const rng=ex=>{const ps=ex.rh.flatMap(n=>n.rest?[]:(Array.isArray(n.m)?n.m:[n.m]));return Math.max(...ps)-Math.min(...ps);};
const eighths=ex=>[...ex.rh,...ex.lh].filter(n=>!n.rest&&n.d<=0.5).length;
const rhNotes=ex=>ex.rh.filter(n=>!n.rest).length;
const durVar=ex=>new Set(ex.rh.filter(n=>!n.rest).map(n=>n.d)).size;
const dotted=ex=>[...ex.rh,...ex.lh].filter(n=>!n.rest&&(n.d===1.5||n.d===0.75||n.d===2.5)).length;
const staticFrac=ex=>{const[t,b]=ex.time.split('/').map(Number);const bu=(t/b)*4;const B={};let x=0;for(const n of ex.rh){const k=Math.floor(x/bu+1e-9);(B[k]??=new Set());if(!n.rest)B[k].add((Array.isArray(n.m)?n.m:[n.m]).join(','));x+=n.d;}const K=Object.keys(B);return K.filter(k=>B[k].size<=1).length/K.length;};
const clean=ex=>{ const v=validate(ex); if(v.errors.length) return false;
  const f=leapClashes(ex).length+sixFours(ex).length+parallelPerfects(ex).length+lhParallels(ex).length+beatDissonance(ex).length+beatClash(ex).length;
  return f===0 && !usedKeys.includes(ex.key+ex.mode)
    && rng(ex)>=11 && rhNotes(ex)>=22 && eighths(ex)>=12 && durVar(ex)>=3 && staticFrac(ex)<=0.30; }; // GRADE-4 SUBSTANCE gate
const survivors=[];
let tries=0;
for(tries=0; tries<400 && survivors.length<10; tries++){ const ex=generate(4,undefined,avoid); if(ex && clean(ex)) survivors.push(ex); }
console.log('attempts:', tries);
// richness score: reward movement + rhythmic variety, mild reward for a fresh metre vs the bank
const bankMetres=avoid.map(e=>e.time);
const score=ex=>eighths(ex)*1.0 + durVar(ex)*3 + dotted(ex)*0.5 + rhNotes(ex)*0.5 + (bankMetres.includes(ex.time)?0:6);
survivors.sort((a,b)=>score(b)-score(a));
const nm=m=>['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'][((m%12)+12)%12]+(Math.floor(m/12)-1);
console.log('fresh survivors (grade-4 gate):', survivors.length);
survivors.slice(0,8).forEach((ex,i)=>console.log(`  #${i} ${ex.time} ${ex.key}${ex.mode} "${ex.tempo}" | rhN=${rhNotes(ex)} 8ths=${eighths(ex)} durVar=${durVar(ex)} dotted=${dotted(ex)} static=${staticFrac(ex).toFixed(2)} score=${score(ex).toFixed(0)}`));
fs.writeFileSync('./_reswap9_pool.json', JSON.stringify(survivors,null,1));
