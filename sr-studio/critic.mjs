// MUSICALITY CRITIC — measures the SPECIFIC failures diagnosed on the "sounds random" piece, so generator
// fixes can be verified objectively and regressions caught. This is a MEASUREMENT tool only: it never
// constrains generation, so it cannot narrow the exploration space. Harmony is inferred from the LH (the
// bank stores no chord symbols), which is enough to detect melody-vs-harmony problems.
const PCS = m => ((m % 12) + 12) % 12;
const LET = { c:0, d:2, e:4, f:5, g:7, a:9, b:11 };

function tonicPc(ex){ return PCS(LET[ex.key[0]] + (ex.key[1]==='f'?-1:ex.key[1]==='s'?1:0)); }
function beatLenOf(ex){ return (ex.time==='6/8'||ex.time==='3/8') ? 1.5 : 1; }
function barUnitsOf(ex){ const [n,d]=ex.time.split('/').map(Number); return n * (4/d); }   // quarter-beats per bar
function strongPositions(ex){ const barU=barUnitsOf(ex), bl=beatLenOf(ex);
  if(ex.time==='4/4') return [0,2];
  if(ex.time==='6/8') return [0,1.5];
  const out=[]; for(let p=0;p<barU-1e-9;p+=bl) out.push(p); return out; }   // 3/4,2/4,3/8: every beat is "strong-ish", but beat 1 weighted

// per-bar LH pitch-classes (the sounding harmony)
function lhBarPCs(ex){ const barU=barUnitsOf(ex); const out={}; let t=0;
  for(const n of ex.lh){ if(!n.rest){ const bi=Math.floor(t/barU+1e-9); (out[bi]??=new Set()); (Array.isArray(n.m)?n.m:[n.m]).forEach(m=>out[bi].add(PCS(m))); } t+=n.d; }
  return out; }

// notes of a hand with position-in-bar + bar index
function handNotes(ex, hand){ const barU=barUnitsOf(ex); const out=[]; let t=0;
  for(const n of (hand||ex.rh)){ const bi=Math.floor(t/barU+1e-9); out.push({...n, bar:bi, pos:+(t-bi*barU).toFixed(3)}); t+=n.d; }
  return out; }

export function critique(ex){
  const barU=barUnitsOf(ex), strong=strongPositions(ex), tonic=tonicPc(ex);
  const melHand = ex[ex._mel || 'rh'] || ex.rh;                    // the melody staff (rh unless a swap piece)
  const accHand = (ex._mel === 'lh') ? ex.rh : ex.lh;             // the accompaniment staff (for the cadential bass)
  const mel = handNotes(ex, melHand);
  const ctBar = ex._ct ? ex._ct.map(a=>new Set(a)) : null;        // TRUE chord tones per bar (from the generator)
  const lhPC = ctBar ? null : lhBarPCs(ex);                        // fallback: infer from the LH (bank pieces)
  const sung = mel.filter(n=>!n.rest && !Array.isArray(n.m));
  const isChordTone = n => { const s = ctBar ? ctBar[n.bar] : (lhPC && lhPC[n.bar]); return !!s && s.has(PCS(n.m)); };
  const onStrong = n => strong.some(sp=>Math.abs(n.pos-sp)<1e-9);

  // 1. SKELETON: fraction of strong-beat melody notes that are chord tones. A strong beat that is a REST or
  //    a non-chord tone is an unanchored beat (the harmony can't speak through). Low = wandering / no frame.
  const strongNotes = sung.filter(onStrong);
  const strongAnchored = strongNotes.filter(isChordTone).length;
  // count strong beats that have NO sung note at all (a rest on the beat = also unanchored)
  let strongRests=0; for(const n of mel){ if((n.rest||Array.isArray(n.m)) && onStrong(n)) strongRests++; }
  const skeleton = strongNotes.length ? strongAnchored/strongNotes.length : 0;

  // 2. ON-BEAT DISSONANCE + repeated non-chord tendency tones (the B-B-B-B over C, F-F-F over G).
  const onBeatDiss = strongNotes.filter(n=>!isChordTone(n)).length;
  let dissRepeat=0, run=1;                                   // runs of >=3 same-PC NON-chord tones anywhere
  for(let i=1;i<sung.length;i++){ if(PCS(sung[i].m)===PCS(sung[i-1].m) && !isChordTone(sung[i])){ run++; if(run===3) dissRepeat++; } else run=1; }

  // 3. STEP/LEAP balance. Too stepwise = scalar wandering (no skeleton); too leapy = arpeggiation.
  let steps=0,leaps=0; for(let i=1;i<sung.length;i++){ const d=Math.abs(sung[i].m-sung[i-1].m); if(d===0)continue; if(d<=2)steps++; else leaps++; }
  const leapRatio = (steps+leaps)? leaps/(steps+leaps) : 0;

  // 4. STATIC repeats: runs of >=3 identical pitches (hammering one note). Aimless.
  let staticRuns=0; run=1; for(let i=1;i<sung.length;i++){ if(sung[i].m===sung[i-1].m){ run++; if(run===3) staticRuns++; } else run=1; }

  // 5. MOTIF recurrence: does a bar's pitch-INTERVAL shape recur (exact or transposed) elsewhere? A tune
  //    restates an idea; a random stream never does. Compare each bar's interval sequence to every later bar.
  // read the melodic LINE through chords (top note), so a restatement whose note got thickened to a chord or
  // decorated still matches its original shape — otherwise a one-note decoration hides an audible motif.
  const line = mel.filter(n=>!n.rest).map(n=>({bar:n.bar, m: Array.isArray(n.m)?Math.max(...n.m):n.m}));
  const barSeqs={}; for(const n of line){ (barSeqs[n.bar]??=[]).push(n.m); }
  const shape = arr => arr.slice(1).map((m,i)=>m-arr[i]).join(',');   // interval shape (transposition-invariant)
  const shapes = Object.values(barSeqs).filter(a=>a.length>=2).map(shape);
  let motif=false; for(let i=0;i<shapes.length;i++) for(let j=i+1;j<shapes.length;j++) if(shapes[i]&&shapes[i]===shapes[j]) motif=true;

  // 6. CADENCE: ends ON the tonic, approached by a dominant OR subdominant somewhere in the last two bars, with
  //    the melody landing on a tonic-triad tone. This accepts perfect AND plagal cadences, and V->I compressed
  //    into the final bar or reached through a decorative passing bass — only a genuinely unresolved ending fails.
  const nb = Math.max(...mel.map(n=>n.bar))+1;
  const bassSeq = barsBassSeq(ex, nb-2, nb-1, accHand);           // ordered distinct bass PCs across the last two bars
  const domPc = PCS(tonic+7), subPc = PCS(tonic+5);
  const endsTonic = bassSeq.length && bassSeq[bassSeq.length-1]===tonic;
  const approach = bassSeq.slice(0,-1).some(p=>p===domPc||p===subPc);
  const lastMel = sung.length? PCS(sung[sung.length-1].m):-1;
  const melOnTonicTriad = [tonic,PCS(tonic+4),PCS(tonic+3),PCS(tonic+7)].includes(lastMel);
  const cadence = !!(endsTonic && approach && melOnTonicTriad);

  return { skeleton:+skeleton.toFixed(2), strongRests, onBeatDiss, dissRepeat, leapRatio:+leapRatio.toFixed(2),
           staticRuns, motif, cadence, tonic };
}
// ordered, consecutive-deduped bass pitch-classes (lowest note of each LH event) across bars [b0..b1]
function barsBassSeq(ex, b0, b1, hand){ const barU=barUnitsOf(ex); const seq=[]; let t=0;
  for(const n of (hand||ex.lh)){ const bi=Math.floor(t/barU+1e-9); if(bi>=b0 && bi<=b1 && !n.rest){ const p=PCS(Array.isArray(n.m)?Math.min(...n.m):n.m); if(seq[seq.length-1]!==p) seq.push(p); } t+=n.d; }
  return seq; }

// CAPABILITY CENSUS — the hard anti-narrowing guard (Matthew's one rule: a fix eliminates a PROBLEM, never a
// POSSIBILITY). A broad fingerprint of everything the generator CAN do. The loop rule: after any fix, NO count
// may fall and NO range may compress. If a fix improves quality but drops a capability, it removed a device from
// the vocabulary -> reject. Counts of near-unique things (contours, cells) carry sampling noise, handled by a
// tolerance in the checker; small-cardinality signals (intervals, articulations, dynamics) and the RANGES
// (register, leap-balance spread) are the reliable "did we lose a device" detectors.
export function capabilityCensus(pieces){
  const distinct = fn => new Set(pieces.map(fn).filter(x=>x!=null&&x!=='')).size;
  const rhythmCells=new Set(), lhCells=new Set(), progs=new Set(), contours=new Set();
  const intervals=new Set(), arts=new Set(), dyns=new Set(), chordSigs=new Set();
  let withRest=0, withChrom=0, lo=999, hi=0, leapLo=1, leapHi=0;
  const LET={c:0,d:2,e:4,f:5,g:7,a:9,b:11};
  for(const ex of pieces){ const b=barUnitsOf(ex); const melHand=ex[ex._mel||'rh']||ex.rh;
    const cells=(hand,fmt)=>{ let t=0,bi=0,cur=[]; for(const n of hand){ const nb=Math.floor(t/b+1e-9); if(nb!==bi){ (hand===melHand?rhythmCells:lhCells).add(cur.join(',')); cur=[]; bi=nb; } cur.push(fmt(n)); t+=n.d; } if(cur.length)(hand===melHand?rhythmCells:lhCells).add(cur.join(',')); };
    cells(melHand, n=>n.rest?'r'+n.d:n.d);
    cells(ex.lh,   n=>n.rest?'r':(Array.isArray(n.m)?'c':'b')+n.d);
    const s=melHand.filter(n=>!n.rest&&!Array.isArray(n.m)).map(n=>n.m);
    contours.add(s.slice(1).map((m,i)=>Math.sign(m-s[i])).join(''));
    let steps=0,leaps=0; for(let i=1;i<s.length;i++){ const d=Math.abs(s[i]-s[i-1]); if(d===0)continue; intervals.add(Math.min(d,12)); if(d<=2)steps++; else leaps++; }
    const lr=(steps+leaps)?leaps/(steps+leaps):0; leapLo=Math.min(leapLo,lr); leapHi=Math.max(leapHi,lr);
    progs.add(barsBassSeq(ex,0,99,(ex._mel==='lh')?ex.rh:ex.lh).join('-'));
    if(ex._ct) ex._ct.forEach(a=>chordSigs.add([...a].sort((x,y)=>x-y).join(',')));
    const tpc=PCS(LET[ex.key[0]]+(ex.key[1]==='f'?-1:ex.key[1]==='s'?1:0));
    const scale=new Set((ex.mode==='min'?[0,2,3,5,7,8,10,11]:[0,2,4,5,7,9,11]).map(x=>PCS(tpc+x)));
    let hasRest=false, chrom=false;
    for(const hand of [ex.rh,ex.lh]) for(const n of hand){ if(n.rest){hasRest=true;continue;} if(n.art)arts.add(n.art); if(n.dyn)dyns.add(n.dyn);
      (Array.isArray(n.m)?n.m:[n.m]).forEach(m=>{ if(m<lo)lo=m; if(m>hi)hi=m; if(!scale.has(PCS(m)))chrom=true; }); }
    if(hasRest)withRest++; if(chrom)withChrom++;
  }
  // DEVICE RATES — how OFTEN each device actually occurs (not just whether it can). The rate floor in the checker
  // stops a "fix" from suppressing a device toward zero while technically leaving it "possible" (Matthew's trap).
  let allSteps=0,allNotes=0,repeats=0,bigLeaps=0,longNotes=0,restEvents=0,totEvents=0;
  for(const ex of pieces){ const melHand=ex[ex._mel||'rh']||ex.rh;
    for(const hand of [ex.rh,ex.lh]) for(const n of hand){ totEvents++; if(n.rest)restEvents++; else if((Array.isArray(n.m)?0:n.d)>=2)longNotes++; }
    const s=melHand.filter(n=>!n.rest&&!Array.isArray(n.m)).map(n=>n.m);
    for(let i=1;i<s.length;i++){ allNotes++; const d=Math.abs(s[i]-s[i-1]); if(d===0)repeats++; else { if(d<=2)allSteps++; if(d>=7)bigLeaps++; } }
  }
  const r = (a,b)=>b?+((a/b).toFixed(3)):0;
  return { metres:distinct(p=>p.time), tempos:distinct(p=>p.tempo), keys:distinct(p=>p.key+p.mode),
    rhythmCells:rhythmCells.size, lhCells:lhCells.size, contours:contours.size, intervals:intervals.size,
    progressions:progs.size, chordSigs:chordSigs.size, articulations:arts.size, dynamics:dyns.size,
    piecesWithRest:withRest, piecesWithChromatic:withChrom, registerLo:lo, registerHi:hi,
    leapRatioLo:+leapLo.toFixed(2), leapRatioHi:+leapHi.toFixed(2),
    rateRepeat:r(repeats,allNotes), rateStep:r(allSteps,allNotes), rateBigLeap:r(bigLeaps,allNotes),
    rateLongNote:r(longNotes,totEvents), rateRest:r(restEvents,totEvents) };
}

// BATCH VARIETY — the anti-formulaic guard. A fix that improves a quality metric by making pieces converge
// gets caught here: these ratios (distinct / total) must NOT fall after a fix. Signals chosen to span the
// dimensions a formula would collapse: metre, character, opening rhythm, melodic contour, harmonic bassline.
export function variety(pieces){
  const uniq = arr => new Set(arr).size / Math.max(1, arr.length);
  const barU0 = ex => barUnitsOf(ex);
  const openRhythm = ex => { const b=barU0(ex); let t=0,out=[]; for(const n of ex.rh){ if(t>=2*b-1e-9) break; out.push(n.rest?'r':n.d); t+=n.d; } return out.join(','); };
  const contour = ex => { const s=ex.rh.filter(n=>!n.rest&&!Array.isArray(n.m)).map(n=>n.m); return s.slice(1).map((m,i)=>Math.sign(m-s[i])).join(''); };
  const bassLine = ex => barsBassSeq(ex,0,99).join('-');
  return {
    metre:   uniq(pieces.map(p=>p.time)),
    tempo:   uniq(pieces.map(p=>p.tempo)),
    openRhythm: uniq(pieces.map(openRhythm)),
    contour: uniq(pieces.map(contour)),
    bassLine: uniq(pieces.map(bassLine)),
  };
}
