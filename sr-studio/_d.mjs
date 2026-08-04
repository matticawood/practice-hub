import { generate } from './generator.mjs';
import { validate } from './engine.mjs';
const nm=x=>{const N=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];return N[((x%12)+12)%12]+(Math.floor(x/12)-1);};
let worst=0,info=null,tries=0;
while(tries<600){ tries++; const ex=generate(4,1500,null); if(!ex) continue;
  for(const [h,hand] of [['rh',ex.rh],['lh',ex.lh]]) hand.forEach((n,i)=>{ if(n.rest)return;
    const ms=Array.isArray(n.m)?n.m:[n.m]; for(const m of ms) if(m>worst){ worst=m; info={h,i,m,time:ex.time,swap:ex.swap,bars:hand.length}; } }); }
console.log('highest note seen:', worst, nm(worst), JSON.stringify(info));
