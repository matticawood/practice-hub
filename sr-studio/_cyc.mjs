import { generateCompose } from './compose-adapter.mjs';
import { validate, lilyWithMap, lilyDoc, toLily, resolveFingering } from './engine.mjs';
import { writeFileSync } from 'fs';
const NM=['C','C#','D','Eb','E','F','F#','G','G#','A','Bb','B'];
const nm=m=>NM[((m%12)+12)%12]+(Math.floor(m/12)-1);
const LET={c:0,d:2,e:4,f:5,g:7,a:9,b:11};
const g=Number(process.argv[2]), seed=Number(process.argv[3]||0), out=process.argv[4];
let c=0,ex=null; for(let i=0;i<900;i++){ const e=generateCompose(g,{}); if(!validate(e).ok)continue; if(c++===seed){ex=e;break;} }
let ly; try{ ly=lilyWithMap({...ex,n:ex.n||''},20).ly; }catch(e){ ly=lilyDoc(toLily({...ex,n:ex.n||''}),20); }
writeFileSync(out,ly);
const sc=(ex.mode==='min'?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11]).map(x=>(((LET[ex.key[0]]+(ex.key[1]==='f'?-1:ex.key[1]==='s'?1:0))%12)+x)%12);
const pr=resolveFingering(ex);
const [nu,de]=(ex.time||'4/4').split('/').map(Number); const barU=nu*4/de;
console.log('G'+g,'|',ex.key,ex.mode,'|',ex.time,'|',JSON.stringify(ex.tempo),'| char',ex._char,'| tex',ex._texture);
for(const h of ['rh','lh']){ let t=0,bar=-1,line=''; console.log(' '+h);
  ex[h].forEach((n,i)=>{ const b=Math.floor((t+1e-9)/barU); if(b!==bar){if(line)console.log('  b'+(bar+1)+':'+line);line='';bar=b;}
    const f=pr[h][i]; const fs=Array.isArray(f)?('<'+f.join('.')+'>'):(f!=null?f:'.');
    const p=n.rest?'R':(Array.isArray(n.m)?n.m.map(nm).join('+'):nm(n.m));
    const a=n.art?('!'+n.art):''; const d=n.dyn?('{'+n.dyn+'}'):''; const hp=n.hp?('['+(n.hp==='\\<'?'<':n.hp==='\\>'?'>':'!')+']'):''; const sl=n.slur?('/'+n.slur):'';
    line+=` ${p}[${fs}]${a}${d}${hp}${sl}(${n.d})`; t+=n.d; }); console.log('  b'+(bar+1)+':'+line); }
