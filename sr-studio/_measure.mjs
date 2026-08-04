import { generate } from './generator.mjs';
export function measure(N=30){
  let heldThirds=0, heldChords=0, twoNoteTotal=0, twoNoteThird=0, lhEvents=0;
  for(let k=0;k<N;k++){ const ex=generate(4); if(!ex) continue;
    const bu=(ex.time.split('/')[0]/ex.time.split('/')[1])*4;
    ex.lh.forEach(n=>{ if(n.rest) return; lhEvents++;
      if(Array.isArray(n.m)&&n.m.length===2){ twoNoteTotal++;
        const iv=(((Math.max(...n.m)-Math.min(...n.m))%12)+12)%12;
        if(iv===3||iv===4) twoNoteThird++;
        if(n.d>=1){ heldChords++; if(iv===3||iv===4) heldThirds++; }   // "held" = >= a beat
      }
    });
  }
  return { lhEvents, twoNoteTotal, twoNoteThird, heldChords, heldThirds };
}
