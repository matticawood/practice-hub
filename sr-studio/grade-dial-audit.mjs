import { generate } from '/Users/matthewcawood/The Practice Room Database/sr-studio/generator.mjs';
const LET={c:0,d:2,e:4,f:5,g:7,a:9,b:11};
const tonicPC=k=>((LET[k[0]]+(k[1]==='f'?-1:k[1]==='s'?1:0))%12+12)%12;
const MAJ=[0,2,4,5,7,9,11], MINnat=[0,2,3,5,7,8,10];
const DIAL={
  2:{times:['4/4','3/4','2/4'], majKeys:['c','g','d','f'], minKeys:['a','d','e','g'], maxAcc:2, maxNotes:1, semiq:false, ferm:false, tenuto:false, anacrusis:false, chromatic:false},
  3:{times:['4/4','3/4','2/4','3/8'], majKeys:['c','g','d','f','a','bf','ef'], minKeys:['a','d','e','g','b'], maxAcc:3, maxNotes:2, semiq:true, ferm:false, tenuto:false, anacrusis:false, chromatic:false},
  4:{times:['4/4','3/4','2/4','3/8','6/8'], majKeys:['c','g','d','f','a','bf','ef'], minKeys:['a','d','e','g','b'], maxAcc:3, maxNotes:2, semiq:true, ferm:true, tenuto:true, anacrusis:true, chromatic:true},
};
for(const g of [2,3,4]){
  const d=DIAL[g]; const V={}; const bump=(k)=>{V[k]=(V[k]||0)+1;};
  let N=0; const keys={},times={};
  for(let i=0;i<120;i++){ const ex=generate(g, g===2?3000:6000); if(!ex)continue; N++;
    keys[ex.key]=(keys[ex.key]||0)+1; times[ex.time]=(times[ex.time]||0)+1;
    // time
    if(!d.times.includes(ex.time)) bump('BAD time '+ex.time);
    // key
    const allowed=(ex.mode==='maj'?d.majKeys:d.minKeys);
    if(!allowed.includes(ex.key)) bump('BAD key '+ex.key+ex.mode);
    // diatonic PC set (+harmonic-minor LT for minor)
    const t=tonicPC(ex.key);
    const scale=(ex.mode==='maj'?MAJ:MINnat).map(x=>(t+x)%12);
    const allowedPC=new Set(scale); if(ex.mode==='min'){ allowedPC.add((t+11)%12); allowedPC.add((t+9)%12); } // LT + melodic 6
    for(const hand of ['rh','lh']) for(const n of ex[hand]){ if(n.rest)continue;
      const ms=Array.isArray(n.m)?n.m:[n.m];
      if(ms.length>d.maxNotes) bump('chord>'+d.maxNotes+' notes');
      for(const m of ms){ const pc=((m%12)+12)%12; if(!allowedPC.has(pc)){ if(!d.chromatic) bump('chromatic note (key '+ex.key+ex.mode+')'); } }
      if(n.d<0.5-1e-9 && !d.semiq) bump('semiquaver at G'+g);
      if(n.ferm && !d.ferm) bump('fermata at G'+g);
      if(n.art==='--' && !d.tenuto) bump('tenuto at G'+g);
      if(n.dyn && /^f{2,}|^sf/.test(n.dyn)) bump('dynamic '+n.dyn+' (>f)');
    }
    if(ex.partial && !d.anacrusis) bump('anacrusis at G'+g);
    // accidental count of key sig
  }
  console.log('=== GRADE '+g+' ('+N+' pieces) ===');
  console.log('  keys:', JSON.stringify(keys));
  console.log('  times:', JSON.stringify(times));
  const viols=Object.keys(V);
  console.log('  VIOLATIONS:', viols.length?JSON.stringify(V):'NONE');
}
