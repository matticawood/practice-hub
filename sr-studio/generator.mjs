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
  2:['Andante','Andantino','Adagio','Moderato','Allegretto','Allegro','Andante cantabile','Andante espressivo','Andante tranquillo','Moderato grazioso','Moderato semplice','Allegretto grazioso','Allegretto giocoso','Andante dolce','Allegro moderato'],
  3:['Andante','Andantino','Adagio','Larghetto','Moderato','Allegretto','Allegro','Vivace','Andante con moto','Andante sostenuto','Andante espressivo','Moderato cantabile','Allegretto scherzando','Allegretto leggiero','Allegro grazioso','Comodo'],
  4:['Adagio','Larghetto','Lento','Andante','Andante sostenuto','Andante con espressione','Moderato','Moderato e cantabile','Allegretto','Allegretto con moto','Allegro','Allegro moderato','Allegro grazioso','Allegro giocoso','Allegro risoluto','Vivace','Con moto'],
};
// chords as scale-step indices (0=tonic..). bass = LH root index. CH = five-finger-safe (Grade 2).
const CH = {
  maj:{ I:{t:[0,2,4],b:0}, ii:{t:[1,3],b:1}, iii:{t:[2,4],b:2}, V:{t:[4,1],b:4} },
  min:{ i:{t:[0,2,4],b:0}, iv:{t:[3,0],b:3}, v:{t:[4,1],b:4} },
};
// extra chords for Grade 3+ (out of the five-finger box) — richer harmony, root kept lowest
const CH_EXTRA = {
  maj:{ IV:{t:[3,5,7],b:3}, vi:{t:[5,7],b:5} },
  min:{ iv:{t:[3,5,7],b:3}, III:{t:[2,4,6],b:2}, VI:{t:[5,7],b:5} },
};
// the key's full scale (degree -> semitone) and each chord's members BY SCALE DEGREE (0=tonic).
// used so the melody's five-finger position can sit on any degree of the key, not just the tonic.
const KEYSCALE = { maj:[0,2,4,5,7,9,11,12,14,16], min:[0,2,3,5,7,8,10,12,14,16] };
const CHORD_DEG = {
  maj:{ I:[0,2,4], ii:[1,3,5], iii:[2,4,6], IV:[3,5,0], V:[4,6,1], vi:[5,0,2] },
  min:{ i:[0,2,4], iv:[3,5,0], v:[4,6,1], III:[2,4,6], VI:[5,0,2] },
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
// Grade 3+ leaves the five-finger position: a full scale (octave+) the melody can range over
const SCALE={maj:[0,2,4,5,7,9,11,12,14], min:[0,2,3,5,7,8,10,12,14]};
function genContour(nbars,span){                 // varied wide-range contours reaching up to `span`
  const shape=rnd(['arch','arch','wave','rise','fall']); const out=[];
  for(let b=0;b<nbars;b++){ const t=nbars>1?b/(nbars-1):0; let v;
    if(shape==='arch') v=span*(1-Math.abs(2*t-1));
    else if(shape==='wave') v=span*(0.5-0.5*Math.cos(t*2*Math.PI));
    else if(shape==='rise') v=span*t; else v=span*(1-t);
    out.push(Math.max(0,Math.min(span,Math.round(v)))); }
  return out;
}
// per-beat rhythm cells incl. semiquavers (Grade 3+); each cell fills exactly one beat (beat-aligned)
const BEATCELLS=[[1],[1],[1],[0.5,0.5],[0.5,0.5],[0.5,0.25,0.25],[0.25,0.25,0.5],[0.25,0.25,0.25,0.25],[1.5,0.5]];
function barRhythm(barU,wide,compound){
  if(compound) return rnd(RHY_COMPOUND);
  if(!wide) return rnd(RHY[barU]||RHY[2]);
  const beats=Math.round(barU); const out=[]; let b=0;
  while(b<beats){ const cell=rnd(BEATCELLS); if(cell[0]===1.5){ if(b<=beats-2){ out.push(1.5,0.5); b+=2; continue; } else { out.push(1); b++; continue; } } out.push(...cell); b++; }
  return out;
}

function offsets(mode){ return POS[mode]; }         // semitone offsets of the box

// ---- expression helpers ----
const noteBarsOf=(seq,barU)=>{ let t=0; return seq.map(n=>{ const b=Math.floor(t/barU+1e-9); t+=n.d; return b; }); };
function pickStaccatoBar(rh,barU,nbars){           // a mid bar where the RH moves in short notes (staccato the melody; LH follows if also short)
  const rb=noteBarsOf(rh,barU), cands=[];
  for(let b=1;b<nbars-1;b++){ const inb=rh.filter((n,i)=>rb[i]===b); if(inb.length && inb.every(n=>!n.rest&&n.d<=1)) cands.push(b); }
  return cands.length? cands[Math.floor(Math.random()*cands.length)] : -1;
}
// a POOL of cadential figures (melody close + LH) so endings vary instead of one fixed formula
function cadenceFigure(barU, beatLen, compound){
  const lhPool=[ [[4,beatLen],[0,barU-beatLen]] ];                 // V -> I, varied rhythm
  if(barU%2===0 && !compound) lhPool.push([[4,barU/2],[0,barU/2]]);
  const melPool=[ [[0,barU]],                                       // held tonic (suspension over the V)
                  [[1,beatLen],[0,barU-beatLen]],                   // 2 -> 1
                  [[4,beatLen],[0,barU-beatLen]] ];                 // 5 -> 1 (falling)
  if(!compound && barU>=3){ melPool.push([[2,1],[1,1],[0,barU-2]],  // 3 -> 2 -> 1 descent
                                         [[2,beatLen],[0,barU-beatLen]]); } // 3 -> 1
  if(!compound) melPool.push([[1,0.5],[0,barU-0.5]]);               // quaver appoggiatura -> 1
  return { lh: rnd(lhPool), mel: rnd(melPool) };
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

function buildCandidate(grade, opts={}){
  const isMin=chance(0.28) && grade>=2;
  const mode=isMin?'min':'maj';
  const keyset=(grade>=3?KEYS3:KEYS)[mode];
  const [ly,rhTonic,flat]=rnd(keyset);
  const times = grade===2 ? ['4/4','3/4','2/4'] : grade===3 ? ['4/4','3/4','2/4','3/8'] : ['4/4','3/4','6/8'];
  const time=rnd(times);
  const [top,bottom]=time.split('/').map(Number); const barU=(top/bottom)*4;
  const compound=(bottom===8 && top%3===0); const beatLen=compound?1.5:1; const nbeats=Math.round(barU/beatLen);
  const nbars = grade===2 ? (time==='2/4'?6:4) : 8;
  const wide = grade>=3;                                  // Grade 3+ leaves the five-finger position
  const off = wide ? SCALE[mode] : POS[mode];
  const span = wide ? 7 : 4;                              // melody index range 0..span (octave for G3+)
  const lhTonic=rhTonic-12;
  const swap = opts.swap ?? chance(0.2);                  // ~1 in 5 pieces: the LEFT hand carries the melody
  const melReg = swap ? lhTonic : rhTonic;               // register the melody is written in
  const accReg = swap ? rhTonic : lhTonic;               // register the accompaniment is written in
  // ---- HARMONY as a PERIOD: half cadence (V) at the midpoint, perfect cadence (V->I) at the close ----
  const half = Math.ceil(nbars/2);
  const restate = nbars>=6 && chance(0.55);   // sometimes a PARALLEL period (restate), sometimes a CONTRASTING one
  const cad = cadenceFigure(barU, beatLen, compound);   // this piece's cadence, drawn from the pool
  // the MIDPOINT is pooled, not fixed: half cadence (V) / imperfect cadence (I) / continuous (no midpoint stop)
  const midType = rnd(['HC','HC','HC','IAC','continuous','continuous']);
  const CHm = wide ? {...CH[mode], ...CH_EXTRA[mode]} : CH[mode];   // richer chord set for Grade 3+
  const Tn = mode==='maj' ? {I:'I',V:'V'} : {I:'i',V:'v'};
  // inner bars MOVE through non-tonic harmony (no clumps of I) — the tonic frames the piece, it doesn't fill it
  const moves = mode==='maj' ? (wide?['ii','iii','IV','V','vi']:['ii','iii','V']) : (wide?['iv','v','III','VI']:['iv','v']);
  const moveChord = prev => { let p,t=0; do{ p=rnd(moves); t++; }while(p===prev && t<8); return p; };
  const prog=[];
  for(let b=0;b<nbars;b++){
    if(b===0) prog.push(Tn.I);
    else if(restate && b===half) prog.push(Tn.I);                    // consequent restates over the tonic
    else if(b===half-1) prog.push(midType==='HC'?Tn.V : midType==='IAC'?Tn.I : moveChord(prog[b-1]));
    else if(b===nbars-1) prog.push(Tn.I);                            // final bar = the cadence figure
    else prog.push(moveChord(prog[b-1]));                            // genuinely moving inner harmony
  }

  // accompaniment texture. when the melody is in the LH, the other hand plays chords above it.
  // ALL of these stay possible at Grade 3 (held/sustained notes included) — we don't rule any out.
  // The fix is elsewhere: voice real triads so chords like V can't collapse to a doubled root,
  // and ADD richer figures (Alberti, fuller chords) so the range of accompaniments is wider.
  const texture = swap ? rnd(['block','sustained','rootfifth','broken','block','rootfifth','alberti'])
    : rnd(grade===2?['broken','bassline','rootfifth','broken','sustained']
                   :['rootfifth','bassline','bassline','sustained','broken','broken','block','alberti']);
  // broken-chord figures, incl. Alberti (root-top-middle-top) and its inversion, for real movement
  const brokenShape = rnd([[0,1,2],[0,2,1],[0,2,1,2],[0,1,2,1],[2,1,0,1]]);

  // ---- MELODY: a PARALLEL PERIOD in a five-finger position that may sit on ANY degree of the key ----
  const KS = KEYSCALE[mode];
  const winLo = wide ? 0 : rnd([0,0,0,3,4]);         // Grade 2 hand position: tonic / sub-dominant / dominant
  const W = wide ? span : 4;                         // top window index
  const mnote = i => melReg + (wide ? off[clamp(i,span)] : KS[winLo+clamp(i,4)]);   // window index -> pitch
  const wIdx = dg => { dg=((dg%7)+7)%7; for(let i=0;i<=4;i++) if((winLo+i)%7===dg) return i; return 0; }; // tonic-relative degree -> window index
  const cadW = i => wide ? i : wIdx(i);              // map a cadence figure's degree into this window
  const ctones = c => { if(wide) return [...CHm[c].t, ...CHm[c].t.map(x=>x+7).filter(x=>x<=span)];
    const degs=CHORD_DEG[mode][c]||CHm[c].t; const out=[]; for(let i=0;i<=4;i++) if(degs.includes((winLo+i)%7)) out.push(i); return out.length?out:[0]; };
  const contour = wide ? genContour(nbars,span) : rnd(CONTOURS[nbars]||CONTOURS[4]);
  const strong = prog.map((c,b)=> near(ctones(c), contour[b]));
  const degOf = m => wide ? off.indexOf(m-melReg) : (KS.indexOf(m-melReg)-winLo);
  const stepTo=(from,to,ct)=>{ const dir=Math.sign(to-from)||(chance(.5)?1:-1); let idx=clamp(from+dir*(chance(.75)?1:2),W); if(chance(.35))idx=near(ct,idx); if(idx===from)idx=clamp(from+(Math.sign(to-from)||1),W); return idx; };
  const rh=[]; let prev=strong[0], prevLeap=0, suspend=null;
  // pick the next melody note:
  //  - beat 1 = the harmonic anchor (a chord tone), UNLESS we hold the previous note as a
  //    SUSPENSION: it's a step above a chord tone of the new harmony, so it's a prepared dissonance
  //    that then resolves DOWN by step (what gives a melody expressive tension against the LH).
  //  - after a LEAP, resolve by a step the opposite way (so the line sounds intentional).
  //  - otherwise step toward the target.
  const nextMel = (j, b, nextS, ct, forceEnd, patLen) => {
    let idx;
    if(forceEnd!=null) idx=forceEnd;
    else if(suspend!=null){ idx=suspend; suspend=null; }                         // resolve the suspension down
    else if(j===0){
      // SUSPENSION, but only the kind that stays CONSONANT against the bass: a 4-3 or 6-5 (the held
      // note is a 4th or 6th over the chord root, resolving down to the 3rd or 5th). A 7-6 or 9-8
      // grinds a 7th/2nd straight against a bare bass note, which sounds wrong in this thin texture.
      const rootDeg = (CHORD_DEG[mode][prog[b]]||[0])[0];
      const bassPC = (((melReg+off[clamp(rootDeg,span)])%12)+12)%12;
      const suspIv = ((((mnote(prev)%12)-bassPC)%12)+12)%12;                     // held note above the bass, mod octave
      if(b>0 && patLen>1 && ct.includes(prev-1) && !ct.includes(prev)
         && (suspIv===5||suspIv===8||suspIv===9) && chance(.30)){
        idx=prev; suspend=prev-1;                                                // prepared 4-3 / 6-5 suspension
      } else idx=strong[b];
    }
    else if(prevLeap) idx=clamp(prev + Math.sign(prevLeap), W);
    else idx=stepTo(prev,nextS,ct);
    prevLeap = (forceEnd==null && suspend==null) && Math.abs(idx-prev)>=2 ? -(idx-prev) : 0;
    return idx;
  };
  // antecedent close: inconclusive (a non-tonic chord tone), the tonic (IAC), or flow on (continuous)
  const endDeg = midType==='HC' ? rnd(ctones(Tn.V).filter(i=>((winLo+i)%7)!==0).concat([wIdx(1)])) : midType==='IAC' ? wIdx(0) : null;
  for(let b=0;b<half;b++){                                   // phrase A (antecedent)
    const pat=barRhythm(barU,wide,compound), ct=ctones(prog[b]), nextS = b<half-1?strong[b+1] : (endDeg??strong[half]??0);
    pat.forEach((d,j)=>{ const forceEnd = (b===half-1&&j===pat.length-1&&endDeg!=null)?endDeg:null;
      const idx = nextMel(j,b,nextS,ct,forceEnd,pat.length);
      rh.push({m:mnote(idx), d, bar:b}); prev=idx; });
  }
  const idea = rh.filter(n=>n.bar===0).map(n=>({m:n.m,d:n.d}));   // the "basic idea" to restate
  for(let b=half;b<nbars;b++){                               // phrase B (consequent)
    if(restate && b===half){ idea.forEach(n=>rh.push({m:n.m,d:n.d,bar:b})); prev=degOf(idea.at(-1).m); prevLeap=0; continue; } // restate opening
    if(b===nbars-1){ cad.mel.forEach(([idx,d])=>rh.push({m:mnote(cadW(idx)), d, bar:b})); prev=wIdx(0); prevLeap=0; continue; } // cadence figure (mapped into the position)
    const ct=ctones(prog[b]), pat=barRhythm(barU,wide,compound), nextS=b<nbars-1?strong[b+1]:wIdx(0);
    pat.forEach((d,j)=>{ const idx = nextMel(j,b,nextS,ct,null,pat.length); rh.push({m:mnote(idx), d, bar:b}); prev=idx; });
  }
  // MINOR -> HARMONIC MINOR at the dominant/cadence: raise the natural 7th to the leading tone (resolves up to i)
  if(mode==='min'){
    const sc = wide?off:KS;
    for(let i=0;i<rh.length;i++){ const n=rh[i]; if(n.rest||Array.isArray(n.m))continue;
      const deg=sc.indexOf(n.m-melReg); if(deg<0 || deg%7!==6) continue;   // only the natural 7th (subtonic)
      const cdeg = CHORD_DEG[mode][prog[n.bar]] || [];
      const isDom = cdeg[0]===4;                                       // dominant: the leading tone belongs here
      const nat7Chord = !isDom && cdeg.some(dg=>(((dg%7)+7)%7)===6);   // III (relative major) keeps the NATURAL 7th
      const nxt = rh[i+1]; const up = nxt && !nxt.rest && !Array.isArray(nxt.m) && (sc.indexOf(nxt.m-melReg)%7===0);
      if((isDom || up) && !nat7Chord){ n.m += 1; n.alt='#'; }         // raise to the leading tone, spell sharp
    }
  }
  // Grade 3+: occasional 2-note chords (a diatonic 3rd under a strong melody note)
  if(wide && chance(.5)){
    const cand=rh.map((n,i)=>i).filter(i=>!Array.isArray(rh[i].m)&&!rh[i].rest&&rh[i].d>=1 && i>0 && i<rh.length-1 && degOf(rh[i].m)>=2);
    for(let t=0,k=cand.length>4?2:1; t<k && cand.length; t++){ const i=rnd(cand); const idx=degOf(rh[i].m); rh[i].m=[mnote(idx-2), rh[i].m]; cand.splice(cand.indexOf(i),1); }
  }
  // ---- ACCOMPANIMENT (written in accReg; beat-aligned values only) ----
  const lh=[];
  // VOICE-LEADING for struck triads (block / sustained chord): never stamp the same root-position
  // triad bar after bar — that parallel-blocks look is the machine-made giveaway. Voice each chord as
  // the close-position inversion whose three voices move LEAST from the previous chord, anchored to a
  // register band so it neither drifts nor sits in root position every time.
  const VLANCHOR = accReg + 7;
  let prevVoice = null;
  const voiceLead = rootPosTones => {
    const t = rootPosTones.slice().sort((a,b)=>a-b).slice(0,3);
    if(t.length<3) return rootPosTones;                                  // dyads etc: leave as-is
    const invs = [[t[0],t[1],t[2]], [t[1],t[2],t[0]+12], [t[2],t[0]+12,t[1]+12]]; // root / 1st / 2nd inv, all ascending
    const invPenalty = [0, 0.6, 8];                                     // 2nd inversion (5th in bass) is weak -> keep it occasional
    let best=null, bestScore=1e9;
    for(let ii=0; ii<invs.length; ii++) for(const oct of [-12,0,12]){
      const v=invs[ii].map(p=>p+oct); const avg=(v[0]+v[1]+v[2])/3;
      let score=Math.abs(avg-VLANCHOR) + invPenalty[ii];                // keep the band stable, prefer root/1st
      if(prevVoice) score += 0.7*(Math.abs(v[0]-prevVoice[0])+Math.abs(v[1]-prevVoice[1])+Math.abs(v[2]-prevVoice[2]));
      if(score<bestScore){ bestScore=score; best=v; }
    }
    prevVoice=best; return best;
  };
  // Grade 3+: let the accompaniment figure VARY across the piece — coherent phrases with the odd
  // natural change (a bar that walks stepwise, a held bar, an arpeggiated bar, a repeated note) —
  // rather than stamping one texture on every bar. That uniformity is what reads as machine-made.
  // No figure is forced; the piece's primary texture just leads, and inner bars sometimes deviate.
  const TPAL = ['rootfifth','bassline','bassline','bassline','sustained','broken','alberti','block'];
  let curTex = texture;
  prog.forEach((c,b)=>{
    const ch=CHm[c], root=ch.b;
    if(b===nbars-1){ cad.lh.forEach(([idx,d])=>lh.push({m:accReg+off[idx], d})); return; } // cadence figure from the pool
    if(wide){
      if(b===0 || b===half) curTex = texture;        // phrase openings keep the primary feel
      else if(chance(0.32)) curTex = rnd(TPAL);       // occasional change for natural variety
    }
    const tex = wide ? curTex : texture;

    if(!wide){
      // ----- Grade 2: original five-finger-box accompaniment (unchanged) -----
      if(texture==='sustained'){ lh.push({m:accReg+off[root], d:barU}); return; }
      if(texture==='block'){ const up=ch.t[1]; const dyad=(up!=null&&up>root)?[accReg+off[root],accReg+off[up]]:accReg+off[root]; lh.push({m:dyad, d:barU}); return; }
      if(texture==='bassline'){               // a MOVING stepwise bass (root, then step toward the next chord's root)
        const nextR = b<nbars-1 ? CHm[prog[b+1]].b : 0; let cur=root;
        for(let i=0;i<nbeats;i++){ lh.push({m:accReg+off[clamp(cur,span)], d:beatLen});
          if(i<nbeats-1) cur = clamp(cur + (Math.sign(nextR-cur)|| (chance(.5)?1:-1)), span); }
        return;
      }
      if(texture==='broken'){
        const tones=[root, ch.t[1]??root, ch.t[2]??ch.t[1]??root].map(x=>x<root?root:x);
        const seq=[]; for(let i=0;i<nbeats;i++){ let t=clamp(tones[brokenShape[i%brokenShape.length]],span);
          if(i>0 && t===seq[i-1]){ const alt=tones.map(x=>clamp(x,span)).find(x=>x!==t); if(alt!=null) t=alt; } seq.push(t); }
        seq.forEach(t=>lh.push({m:accReg+off[t], d:beatLen}));
        return;
      }
      const upper=ch.t.filter(x=>x>root).slice(0,2);
      const above = upper.length? (upper.length>1?[accReg+off[upper[0]],accReg+off[upper[1]]]:accReg+off[upper[0]]) : accReg+off[root];
      lh.push({m:accReg+off[root], d:beatLen}, {m:above, d:barU-beatLen});
      return;
    }

    // ----- Grade 3+: voice the REAL triad (root-3rd-5th), upper tones lifted ABOVE the bass so the
    // dominant never collapses to a doubled root. In MINOR, the dominant takes the harmonic-minor
    // LEADING TONE (its 7th raised a semitone) so it agrees with the melody's raised 7th instead of
    // clashing a natural 7th against it. -----
    const degs = CHORD_DEG[mode][c] || [root];
    const isDomMin = mode==='min' && degs[0]===4;          // minor dominant -> use the leading tone
    const degPitch = dg => { let p=accReg+off[clamp(dg,span)]; if(isDomMin && (((dg%7)+7)%7)===6) p+=1; return p; };
    const bassP = degPitch(degs[0]);
    let upperPs = degs.slice(1).map(dg=>{ let p=degPitch(dg); while(p<=bassP) p+=12; return p; }).sort((a,b)=>a-b);
    if(!upperPs.length) upperPs=[bassP+12];
    const pool=[bassP, ...upperPs];
    const ltPC = isDomMin ? (((accReg+off[clamp(6,span)]+1)%12)+12)%12 : -1;   // leading-tone pitch class
    const addN = (m,d) => { const arr=Array.isArray(m)?m:[m];                  // spell ONLY the leading tone sharp
      lh.push(arr.some(p=>(((p%12)+12)%12)===ltPC) ? {m,d,alt:'#'} : {m,d}); };

    if(tex==='sustained'){ addN(chance(.5)?bassP:voiceLead([bassP, ...upperPs]), barU); return; } // held bass OR held chord
    if(tex==='alberti'){                      // Alberti bass: low, top, middle, top — classic moving harmony
      const lo=pool[0], hi=pool[pool.length-1], mid=pool[1]??hi, pat=[lo,hi,mid,hi];
      const seq=[]; for(let i=0;i<nbeats;i++){ let p=pat[i%pat.length];
        if(i>0 && p===seq[i-1]){ const a=pool.find(x=>x!==p); if(a!=null) p=a; } seq.push(p); }
      seq.forEach(p=>addN(p, beatLen));
      return;
    }
    if(tex==='block'){ addN(voiceLead([bassP, ...upperPs]), barU); return; }             // struck full triad, voice-led
    if(tex==='bassline'){                      // moving stepwise bass toward the next chord's root
      const nextR = b<nbars-1 ? CHm[prog[b+1]].b : 0; let cur=degs[0];
      for(let i=0;i<nbeats;i++){ addN(degPitch(cur), beatLen);
        if(i<nbeats-1) cur = clamp(cur + (Math.sign(nextR-cur)|| (chance(.5)?1:-1)), span); }
      return;
    }
    if(tex==='broken'){                        // half arpeggio (leaps), half a STEPWISE scale fragment (passing tones)
      const root0 = ((degs[0]%7)+7)%7;
      if(chance(.5)){                          // stepwise: a small scale run anchored on the root, bouncing within a 5th
        let cur=clamp(root0,span), dir=chance(.5)?1:-1; const seq=[];
        for(let i=0;i<nbeats;i++){ seq.push(cur);
          let nxt=cur+dir; if(nxt<0 || nxt>span || Math.abs(nxt-root0)>4){ dir=-dir; nxt=cur+dir; } cur=clamp(nxt,span); }
        seq.forEach(dg=>addN(degPitch(dg), beatLen));
      } else {                                 // arpeggio over the chord tones (leaps), no immediate repeats
        const seq=[]; for(let i=0;i<nbeats;i++){ let p=pool[brokenShape[i%brokenShape.length] % pool.length] ?? bassP;
          if(i>0 && p===seq[i-1]){ const a=pool.find(x=>x!==p); if(a!=null) p=a; } seq.push(p); }
        seq.forEach(p=>addN(p, beatLen));
      }
      return;
    }
    // oom-pah (rootfifth / default): bass on the beat, the full chord above for the rest of the bar
    addN(bassP, beatLen); addN(upperPs.length>1?upperPs:upperPs[0], barU-beatLen);
  });

  // Grade 3 LH keeps its natural VARIED range; we only CAP THE TOP so it never climbs above the
  // grade. Cap PER BAR as a unit (not per note) so the whole figure shifts together and the bass
  // stays the lowest note — capping notes independently can drop the chord below its own root,
  // which inverts the voicing and throws the metric weight onto the wrong beat.
  if(wide && !swap){
    const hiOf = n => Array.isArray(n.m) ? Math.max(...n.m) : n.m;
    let cur=[], t=0;
    const capBar = bar => { const sounded = bar.filter(n=>!n.rest); if(!sounded.length) return;
      let sh=0; while(Math.max(...sounded.map(hiOf)) - sh*12 > 64) sh++;   // ~E4 ceiling for the bar's top
      if(sh) for(const n of bar){ if(!n.rest) n.m = Array.isArray(n.m) ? n.m.map(x=>x-12*sh) : n.m-12*sh; }
    };
    for(const n of lh){ cur.push(n); t+=n.d; if(Math.abs(t % barU) < 1e-6){ capBar(cur); cur=[]; } }
    if(cur.length) capBar(cur);
  }

  // ---- EXPRESSION ENGINE: character-matched, contour-aware, and varied per piece ----
  const tempo = rnd(TEMPI[grade]);
  const tl = tempo.toLowerCase();
  const prof = /cantabile|sostenuto|espress|dolce|tranquillo|semplice|adagio|larghetto|lento/.test(tl) ? 'legato'
             : /grazioso/.test(tl) ? 'graceful'
             : /scherz|giocoso|leggiero|vivace|comodo|risoluto|brio/.test(tl) ? 'light'
             : rnd(['legato','graceful','light','plain','plain']);
  // dynamic level matched to character (soft for cantabile, fuller for lively)
  rh[0].dyn = rnd(prof==='legato'?(wide?['pp','p','mp']:['p','mp']) : prof==='light'?['mp','mf',grade>2?'f':'mf'] : wide?['pp','p','mp','mf']:['p','mp','mf']);

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
  if(prof==='light' && stacBar<0 && chance(.4)){ const ab=1+Math.floor(Math.random()*Math.max(1,nbars-2)); const dn=idxInBars(ab,ab)[0]; if(dn!=null && !rh[dn].art && !rh[dn].slur) rh[dn].art='->'; } // accent on any inner downbeat, not always bar 1

  rh.forEach(n=>delete n.bar);   // strip internal phrase marker
  // starting fingers, computed from the actual hand positions (the melody's window + the accomp's tonic box)
  const mStart=clamp(strong[0],4);
  const melodyFing = swap ? 5-mStart : mStart+1;       // RH melody: thumb on the bottom; LH melody: pinky on the bottom
  const accompFing = swap ? 1 : 5;                     // accomp opens on the I-chord root (bottom of its box)
  // assign to staves: treble = the higher-register part, bass = the lower. when swapped, the melody (rh) sits low.
  const ex={ grade, key:ly, mode, flat, time, tempo, rh: swap?lh:rh, lh: swap?rh:lh,
             rhFinger: swap?accompFing:melodyFing, lhFinger: swap?melodyFing:accompFing };
  return ex;
}

export function generate(grade, tries=3000){
  const opts = { swap: Math.random()<0.2 };   // commit to swap-or-not for the whole rejection-sampling run
  let best=null, bestScore=1e9;
  for(let i=0;i<tries;i++){
    const ex=buildCandidate(grade, opts);
    const v=validate(ex);
    const score=v.errors.length*1000+v.warnings.length;   // prefer no errors, then fewest warnings
    if(score===0) return ex;
    if(score<bestScore){ best=ex; bestScore=score; }
  }
  return best;   // best available (UI shows any remaining errors/warnings)
}
