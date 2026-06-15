// Sight Reading Studio — per-grade exercise generator.
// Strategy: chord-led composition + rejection sampling. Build a candidate within the
// grade's parameters, run engine.validate(); keep the first CLEAN one (or least-bad).
import { validate, POS } from './engine.mjs';

const rnd=a=>a[Math.floor(Math.random()*a.length)], chance=p=>Math.random()<p;
const clamp=(i,hi)=>Math.max(0,Math.min(hi,i));

// key -> {ly, mode, flat, rhTonic midi}   (RH tonic in 60..71, LH = -12)
const KEYS = {
  maj:[['c',60,false],['g',67,false],['d',62,false],['f',65,true]],
  min:[['a',69,false],['d',62,true],['e',64,false],['g',67,true]],
};
const KEYS3 = { maj:[...KEYS.maj,['a',69,false],['bf',70,true],['ef',63,true]], min:[...KEYS.min,['b',71,false]] };
const TEMPI = {
  2:['Andante','Andante cantabile','Moderato','Allegretto','Allegretto grazioso','Andantino','Moderato grazioso'],
  3:['Andante con moto','Moderato','Allegretto','Allegro moderato','Andante cantabile','Allegretto scherzando','Comodo'],
  4:['Allegro moderato','Andante sostenuto','Allegretto con moto','Moderato e cantabile','Allegro grazioso','Larghetto'],
};
// chords as box scale-step indices (0=tonic..4=fifth). bass = LH root index.
const CH = {
  maj:{ I:{t:[0,2,4],b:0}, ii:{t:[1,3],b:1}, iii:{t:[2,4],b:2}, V:{t:[4,1],b:4} },
  min:{ i:{t:[0,2,4],b:0}, iv:{t:[3,0],b:3}, v:{t:[4,1],b:4} },
};
const PROG = {
  maj:{4:[['I','V','I','I'],['I','ii','V','I'],['I','iii','V','I'],['I','V','ii','I']],
       6:[['I','V','I','ii','V','I'],['I','iii','ii','V','I','I'],['I','V','ii','V','I','I']],
       8:[['I','ii','V','V','I','ii','V','I'],['I','V','I','iii','ii','V','V','I'],['I','iii','ii','V','I','ii','V','I']]},
  min:{4:[['i','v','i','i'],['i','iv','v','i'],['i','v','iv','i']],
       6:[['i','v','i','iv','v','i'],['i','iv','i','v','i','i'],['i','v','iv','v','i','i']],
       8:[['i','iv','v','v','i','iv','v','i'],['i','v','i','iv','i','v','v','i']]},
};
// rhythm patterns per bar (quarter-beat units) keyed by bar length
const RHY = {
  4:[[2,2],[2,1,1],[1,1,2],[1,1,1,1],[1.5,0.5,2],[2,1.5,0.5],[1,1,1.5,0.5]],
  3:[[2,1],[1,2],[1,1,1],[1.5,0.5,1],[1,1.5,0.5]],
  2:[[2],[1,1],[1.5,0.5],[1,0.5,0.5]],
  1.5:[[1.5],[1,0.5],[0.5,1]],          // 3/8
};
const RHY_COMPOUND=[[1.5,1.5],[1,0.5,1.5],[1.5,1,0.5],[1,0.5,1,0.5],[1.5,0.5,0.5,0.5]]; // 6/8: dotted-crotchet beats
// melodic shapes: a target box-degree (0=tonic..4=fifth) per bar -> the melody must travel, not sit
const CONTOURS={
  4:[[1,3,4,0],[4,2,3,0],[2,4,1,0],[0,3,4,0],[3,4,2,0],[4,1,3,0]],
  6:[[1,3,4,2,4,0],[2,4,1,3,4,0],[0,2,4,3,1,0],[3,1,4,2,4,0],[4,2,0,3,1,0]],
  8:[[1,3,4,2,0,2,4,0],[0,2,4,3,1,3,4,0],[2,4,1,3,0,2,4,0],[1,4,2,3,1,4,2,0],[3,1,4,2,0,3,4,0]],
};
// slur patterns as bar-ranges — deliberately varied (incl. NONE, one long, uneven, single short)
const SLURSETS={
  4:[ [], [], [[0,3]], [[0,1],[2,3]], [[0,2]], [[1,3]], [[0,1]], [[2,3]], [[0,3]] ],
  6:[ [], [], [[0,5]], [[0,2],[3,5]], [[0,3],[4,5]], [[0,1],[2,3],[4,5]], [[0,2]], [[3,5]], [[0,3]] ],
  8:[ [], [[0,3],[4,7]], [[0,7]], [[0,1],[2,3],[4,5],[6,7]], [[0,3]], [[4,7]], [[0,3],[4,5],[6,7]], [[0,1],[2,5]] ],
};
const near=(arr,p)=>arr.reduce((a,b)=>Math.abs(b-p)<Math.abs(a-p)?b:a);

function offsets(mode){ return POS[mode]; }         // semitone offsets of the box

// ---- expression helpers ----
const noteBarsOf=(seq,barU)=>{ let t=0; return seq.map(n=>{ const b=Math.floor(t/barU+1e-9); t+=n.d; return b; }); };
function pickStaccatoBar(rh,barU,nbars){           // a mid bar where the RH moves in short notes (staccato the melody; LH follows if also short)
  const rb=noteBarsOf(rh,barU), cands=[];
  for(let b=1;b<nbars-1;b++){ const inb=rh.filter((n,i)=>rb[i]===b); if(inb.length && inb.every(n=>!n.rest&&n.d<=1)) cands.push(b); }
  return cands.length? cands[Math.floor(Math.random()*cands.length)] : -1;
}
function phraseRanges(nbars, stacBar, style){       // slur phrase bar-ranges, split around any staccato bar
  let bounds;
  if(style==='whole') bounds=[[0,nbars-1]];
  else if(style==='sub'){ bounds=[]; for(let b=0;b<nbars;b+=2) bounds.push([b,Math.min(b+1,nbars-1)]); }
  else { const h=Math.ceil(nbars/2); bounds=[[0,h-1],[h,nbars-1]]; }
  if(stacBar<0) return bounds;
  const out=[]; for(const [lo,hi] of bounds){ if(stacBar<lo||stacBar>hi){out.push([lo,hi]);continue;} if(stacBar>lo)out.push([lo,stacBar-1]); if(stacBar<hi)out.push([stacBar+1,hi]); }
  return out;
}

function buildCandidate(grade){
  const isMin=chance(0.28) && grade>=2;
  const mode=isMin?'min':'maj';
  const keyset=(grade>=3?KEYS3:KEYS)[mode];
  const [ly,rhTonic,flat]=rnd(keyset);
  const times = grade===2 ? ['4/4','3/4','2/4'] : grade===3 ? ['4/4','3/4','2/4','3/8'] : ['4/4','3/4','6/8'];
  const time=rnd(times);
  const [top,bottom]=time.split('/').map(Number); const barU=(top/bottom)*4;
  const compound=(bottom===8 && top%3===0); const beatLen=compound?1.5:1; const nbeats=Math.round(barU/beatLen);
  const nbars = grade===2 ? (time==='2/4'?6:4) : 8;
  const off=offsets(mode), span = grade===2 ? 4 : 4;     // box index range 0..span
  // ---- HARMONY as a PERIOD: half cadence (V) at the midpoint, perfect cadence (V->I) at the close ----
  const half = Math.ceil(nbars/2);
  const Tn = mode==='maj' ? {I:'I',V:'V',pre:['ii','iii']} : {I:'i',V:'v',pre:['iv']};
  const prog=[];
  for(let b=0;b<nbars;b++){
    if(b===0) prog.push(Tn.I);
    else if(b===half-1) prog.push(Tn.V);          // half cadence at the midpoint
    else if(b===nbars-1) prog.push(Tn.I);         // final tonic
    else if(b===nbars-2) prog.push(Tn.V);         // dominant before the close -> perfect cadence
    else prog.push(rnd([Tn.I, ...Tn.pre, Tn.V]));
  }

  // pick LH texture (favour broken a touch so articulated pieces are possible; longer grades lean calmer)
  const texture = rnd(grade===2?['broken','broken','rootfifth','sustained']:['rootfifth','sustained','rootfifth','broken','broken','block']);

  // ---- MELODY as a PARALLEL PERIOD: phrase A ends inconclusive (half cadence); phrase B RESTATES
  //      phrase A's opening bar, then drives stepwise to the tonic (perfect cadence). (research ww807c61l) ----
  const contour = rnd(CONTOURS[nbars]||CONTOURS[4]);
  const strong = prog.map((c,b)=> near(CH[mode][c].t, contour[b]));
  const degOf = m => off.indexOf(m-rhTonic);
  const stepTo=(from,to,ch)=>{ const dir=Math.sign(to-from)||(chance(.5)?1:-1); let idx=clamp(from+dir*(chance(.75)?1:2),span); if(chance(.35))idx=near(ch.t,idx); if(idx===from)idx=clamp(from+(Math.sign(to-from)||1),span); return idx; };
  const rh=[]; let prev=strong[0];
  const HC = rnd([1,4]);   // antecedent closes on scale-step 2 (idx1) or 5 (idx4): inconclusive
  for(let b=0;b<half;b++){                                   // phrase A (antecedent)
    const ch=CH[mode][prog[b]], pat=rnd(compound?RHY_COMPOUND:(RHY[barU]||RHY[2])), nextS=b<half-1?strong[b+1]:HC;
    pat.forEach((d,j)=>{ const idx = (b===half-1&&j===pat.length-1)?HC : (j===0?strong[b]:stepTo(prev,nextS,ch));
      rh.push({m:rhTonic+off[idx], d, bar:b}); prev=idx; });
  }
  const idea = rh.filter(n=>n.bar===0).map(n=>({m:n.m,d:n.d}));   // the "basic idea" to restate
  for(let b=half;b<nbars;b++){                               // phrase B (consequent)
    if(b===half){ idea.forEach(n=>rh.push({m:n.m,d:n.d,bar:b})); prev=degOf(idea.at(-1).m); continue; } // restate opening
    if(b===nbars-1){ rh.push({m:rhTonic+off[0], d:barU, bar:b}); prev=0; continue; }                     // final held tonic
    const ch=CH[mode][prog[b]], pat=rnd(compound?RHY_COMPOUND:(RHY[barU]||RHY[2])), nextS=b<nbars-1?strong[b+1]:0;
    pat.forEach((d,j)=>{ const idx = (j===0?strong[b]:stepTo(prev,nextS,ch)); rh.push({m:rhTonic+off[idx], d, bar:b}); prev=idx; });
  }
  // LH from texture
  const lhTonic=rhTonic-12;
  const lh=[];
  // every texture below uses ONLY beat-aligned note values (beatLen = crotchet, or dotted-crotchet in compound)
  prog.forEach((c,b)=>{
    const ch=CH[mode][c], root=ch.b, isCad = b>=nbars-1;
    const fifth = ch.t.find(x=>x!==root) ?? root;
    if(texture==='sustained' || isCad){ lh.push({m:lhTonic+off[root], d:barU}); return; }
    if(texture==='block'){ lh.push({m:[lhTonic+off[root], lhTonic+off[ch.t[1]??root]], d:barU}); return; }
    if(texture==='broken'){                       // one chord-tone per beat
      const tones=[root, ch.t[1]??root, ch.t[2]??ch.t[1]??root];
      for(let i=0;i<nbeats;i++) lh.push({m:lhTonic+off[clamp(tones[i%3],span)], d:beatLen});
      return;
    }
    // rootfifth: root on beat 1, fifth holds the rest of the bar
    lh.push({m:lhTonic+off[root], d:beatLen}, {m:lhTonic+off[fifth], d:barU-beatLen});
  });

  // ---- EXPRESSION ENGINE: character-matched, contour-aware, and varied per piece ----
  const tempo = rnd(TEMPI[grade]);
  const prof = /cantabile|sostenuto|espress/.test(tempo) ? 'legato'
             : /grazioso/.test(tempo) ? 'graceful'
             : /scherz|giocoso|comodo/.test(tempo) ? 'light'
             : rnd(['legato','graceful','light','plain','plain']);
  // dynamic level matched to character (soft for cantabile, fuller for lively)
  rh[0].dyn = rnd(prof==='legato'?['p','mp'] : prof==='light'?['mp','mf',grade>2?'f':'mf'] : ['p','mp','mf']);

  const nb = noteBarsOf(rh, barU);
  const idxInBars=(lo,hi)=>rh.map((_,i)=>i).filter(i=>nb[i]>=lo&&nb[i]<=hi);

  // hairpins follow the melodic CONTOUR: grow toward the peak bar, ease back to the cadence.
  // sometimes a terraced dynamic instead, sometimes nothing — so they vary.
  const peakBar = strong.indexOf(Math.max(...strong));
  const hairChance = prof==='legato'?0.85 : prof==='light'?0.4 : 0.6;
  if(chance(hairChance)){
    const peakNote = idxInBars(peakBar,peakBar)[0] ?? Math.floor(rh.length/2);
    if(peakBar>0 && peakNote>0) rh[0].hp='\\<';                              // crescendo into the peak
    if(peakBar>0 && peakBar<nbars-1){ rh[peakNote].hp = rh[0].hp?'\\!\\>':'\\>'; rh.at(-1).hp='\\!'; } // then diminuendo to the end
    else if(peakBar===0){ const d=idxInBars(1,nbars-1)[0]; if(d){ rh[d].hp='\\>'; rh.at(-1).hp='\\!'; } } // peak at start -> diminuendo
    else if(rh[0].hp) rh.at(-1).hp='\\!';                                    // peak at end -> just crescendo
  } else if(chance(.45)){
    const i2=idxInBars(Math.ceil(nbars/2),nbars-1)[0]; if(i2) rh[i2].dyn=rnd(rh[0].dyn==='p'?['mp','mf']:['p','mp']); // terraced
  }

  // articulation: legato pieces get phrase slurs; lighter pieces get a detached/staccato bar for contrast.
  // staccato is grade-available from the start and was under-used, so lift its frequency (research ww807c61l).
  const stacBar = (prof!=='legato' && nbars>=4 && chance(prof==='light'?0.85:0.5)) ? pickStaccatoBar(rh,barU,nbars) : -1;
  // pick a slur pattern with real variety; legato avoids "none", light favours sparse/none
  let sets = SLURSETS[nbars] || SLURSETS[4];
  let chosen;
  if(prof==='legato') chosen = rnd(sets.filter(s=>s.length>0));
  else if(prof==='light') chosen = chance(.45) ? [] : rnd(sets.filter(s=>s.length<=2));
  else chosen = rnd(sets);
  // split each slur range around any staccato bar, then apply
  for(let [lo,hi] of chosen){
    const parts=[]; if(stacBar<lo||stacBar>hi) parts.push([lo,hi]); else { if(stacBar>lo)parts.push([lo,stacBar-1]); if(stacBar<hi)parts.push([stacBar+1,hi]); }
    for(const [a,b] of parts){ const idxs=idxInBars(a,b); if(idxs.length>1){ rh[idxs[0]].slur='('; rh[idxs.at(-1)].slur=')'; } }
  }
  if(stacBar>=0){
    rh.forEach((n,i)=>{ if(nb[i]===stacBar && n.d<=1 && !n.rest) n.art='-.'; });
    const lb=noteBarsOf(lh,barU); lh.forEach((n,i)=>{ if(lb[i]===stacBar && n.d<=1 && !n.rest) n.art='-.'; });
  }
  if(prof==='light' && stacBar<0 && chance(.4)){ const dn=idxInBars(1,1)[0]; if(dn!=null && !rh[dn].art && !rh[dn].slur) rh[dn].art='->'; }

  rh.forEach(n=>delete n.bar);   // strip internal phrase marker
  const ex={ grade, key:ly, mode, flat, time, tempo, rh, lh };
  return ex;
}

export function generate(grade, tries=3000){
  let best=null, bestScore=1e9;
  for(let i=0;i<tries;i++){
    const ex=buildCandidate(grade);
    const v=validate(ex);
    const score=v.errors.length*1000+v.warnings.length;   // prefer no errors, then fewest warnings
    if(score===0) return ex;
    if(score<bestScore){ best=ex; bestScore=score; }
  }
  return best;   // best available (UI shows any remaining errors/warnings)
}
