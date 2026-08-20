// Sight Reading Studio — automatic fingering.
//
// Grounded in the piano-fingering literature (Parncutt et al.'s ergonomic model; Hart's
// dynamic-programming cost method) and standard pedagogy (scale/arpeggio conventions):
//
//   * Each finger has an ideal resting position within a five-finger frame (thumb..pinky =
//     C D E F G in shape). Placing finger f on pitch p implies a hand ANCHOR. Moving between
//     two notes costs the distance the anchor travels: a true five-finger passage costs 0,
//     a thumb-under a little, a leap/reposition more. Minimising total travel (economy of
//     motion, a stated pedagogical rule) reproduces the conventional fingerings WITHOUT
//     hand-coding them: the C-major scale falls out as 1 2 3 1 2 3 4 5, broken triads as
//     1 3 5 / 5 3 1, an octave as 1-5, and — because a shift is penalised — the hand holds a
//     position that reserves a finger for a lower/higher note that is still to come.
//   * Per-note penalties encode the hard pedagogy: the thumb (and the 5th) avoid black keys;
//     the weak 4th/5th are mildly discouraged so they are used deliberately, not gratuitously.
//   * A finger is PRINTED only at the opening of each hand and at a genuine hand relocation
//     (a leap that moves the anchor), never on a step, a repeat, or a scale's thumb-under —
//     matching how ABRSM prints sight-reading fingering.
//
// Solved per hand as a shortest path over finger choices (Viterbi DP), so it is globally
// optimal for the whole line rather than a greedy note-by-note guess.

const OFF = { 1:0, 2:2, 3:4, 4:5, 5:7 };           // finger -> semitone offset (for stretch/comfort, which are physical)
const OFFD = { 1:0, 2:1, 3:2, 4:3, 5:4 };          // finger -> SCALE-DEGREE offset within a 5-finger position
const BLACK = new Set([1,3,6,8,10]);
const isBlack = m => BLACK.has(((m%12)+12)%12);
export const _cfg = { roles: true };

export function fingerHandDP(notes, hand, scalePcs, chordFit=true, pin=null){
  // `pin` (optional Map: note-index -> forced finger) constrains the solve — used by the audit to ask the counterfactual
  //   "could this pitch have kept its earlier finger?" (a refinger is a fault only if keeping it costs ~nothing globally).
  // Reason about the hand FRAME in scale degrees, not raw semitones: a five-finger position is five consecutive
  // scale degrees, so finger 3 is the third DEGREE (major or minor third alike). This is what lets a diatonic
  // position actually hold — every note in the span keeps its finger — instead of the frame sliding on semitones.
  const SC = (scalePcs&&scalePcs.length) ? [...new Set(scalePcs.map(x=>((x%12)+12)%12))].sort((a,b)=>a-b) : [0,2,4,5,7,9,11];
  const degreeOf = m => { const pc=((m%12)+12)%12, oct=Math.floor(m/12), i=SC.indexOf(pc);
    if(i>=0) return oct*7+i;                                     // a scale tone: exact degree
    let below=-1; for(let k=SC.length-1;k>=0;k--){ if(SC[k]<pc){ below=k; break; } }
    return below<0 ? oct*7-0.5 : oct*7+below+0.5; };            // a chromatic note sits half a degree above the tone below
  const outer = n => Array.isArray(n.m) ? (hand==='rh'?Math.max(...n.m):Math.min(...n.m)) : n.m;
  const R = []; notes.forEach((n,i)=>{ if(!n.rest) R.push({ i, p: outer(n), d: n.d }); });
  const fings = new Array(notes.length).fill(null); const print = new Set();
  const N = R.length; if(!N) return { fings, print, effort:0, bv:0 };

  // A note played by finger f implies the hand anchor (the frame's scale-degree origin) sits here:
  const S = hand==='rh' ? 1 : -1;                                // +1 pitch step = pinkyward for RH
  const anchor = (p,f) => hand==='rh' ? degreeOf(p) - OFFD[f] : degreeOf(p) + OFFD[f];
  // RESERVE: don't spend an outer finger (thumb/pinky) on a note when a MORE-EXTREME note is
  // coming that will need it within the same reach — the reason you open G3 on 4, not 5, so the
  // pinky is free for the low D in bar 4. Look ahead until the line clearly moves to a new
  // register (past a 6th away, i.e. the hand has repositioned); if a more-extreme note appears
  // first, this finger should be held back for it.
  const THRESH = 6;
  const reserved = (k,f) => {
    // which extreme is this finger, and which way to look for a note that outranks it
    let lookLower;
    if(hand==='lh'){ if(f===5) lookLower=true; else if(f===1) lookLower=false; else return false; }
    else          { if(f===5) lookLower=false; else if(f===1) lookLower=true;  else return false; }
    const p=R[k].p;
    for(let j=k+1;j<N;j++){ const q=R[j].p;
      if(R[j].i > R[j-1].i + 1) return false;                    // a rest = a new gesture: the hand repositions, so stop reserving
      if(lookLower){ if(q<p) return true; if(q>p+THRESH) return false; }
      else         { if(q>p) return true; if(q<p-THRESH) return false; }
    }
    return false;
  };
  // STRAND: a finger must leave room for the notes still to come in the SAME gesture (the reachable
  // run continuing in one direction). Finger 2 with three notes still to pass below it runs out —
  // so it must reposition first (start the arpeggio on 5), giving conventional 5-3-2-1 / 5-3-1
  // fingering instead of a dead end. Count the same-direction run within a hand-span (a 6th; beyond
  // that the hand repositions anyway) and require enough fingers to reach its end.
  const SPAN = 9;
  const stranded = (k,f) => {
    if(k>=N-1) return false;
    const d0=R[k+1].p-R[k].p, dir=Math.sign(d0), a0=Math.abs(d0);
    if(a0<3 || a0>7) return false;                               // only inside an ARPEGGIC gesture (skips of a 3rd-5th);
    let m=0;                                                     // scales cross the thumb, big leaps reposition -> no strand
    for(let j=k+1;j<N;j++){ const iv=Math.abs(R[j].p-R[j-1].p);
      if(Math.sign(R[j].p-R[j-1].p)!==dir || iv<3 || iv>7) break;  // gesture ends at a step, a leap, or a turn
      if(Math.abs(R[j].p-R[k].p)>SPAN) break;                   // beyond a hand-span -> the hand repositions there
      m++; }
    const pinkyward = S*dir > 0;                                 // run heads toward the pinky -> fingers rise
    return pinkyward ? (f+m>5) : (f-m<1);                        // not enough fingers left to finish the arpeggio
  };
  // A BASS ANCHOR: a note sitting clearly BELOW both its neighbours is the low root of an accompaniment
  // figure (oom-pah bass, broken-chord bottom, a struck bass). The outer anchoring finger belongs on it —
  // the pinky in the LH, the thumb in the RH — held steady, NOT whatever finger is cheapest to reach the
  // chord above from. This is what a melodic single-line DP gets wrong on a bass-plus-chord left hand.
  const anchorFinger = hand==='lh' ? 5 : 1;
  const isChord = k => Array.isArray(notes[R[k].i].m);
  const isBassAnchor = k => {
    if(hand==='lh' && isChord(k)) return true;                   // the bottom of a struck LH chord wants the pinky
    const p=R[k].p, prev=k>0?R[k-1].p:null, next=k<N-1?R[k+1].p:null;
    const below = q => q!=null && p < q-2;                       // a clear step-plus below the neighbour
    // an OOM bass: in the LH, a note with the "pah" CHORD sitting clearly ABOVE it is the bass even if the
    // previous chord's bottom happened to sit a semitone under it (the bar-5 case) — the pinky belongs here.
    // (Requires the next event to be a CHORD, so a walking single-note bass line isn't mistaken for an oom.)
    if(hand==='lh' && below(next) && k<N-1 && isChord(k+1)) return true;
    return (prev==null? below(next) : next==null? below(prev) : below(prev)&&below(next)); };
  // The START of an ascending stepwise run wants the anchoring finger (thumb in the RH, pinky in the LH)
  // so the run reads 1-2-3-4-5 rather than tucking the thumb under after one or two notes. Detect the
  // bottom of a run of 4+ steps up that isn't already being ascended into.
  const ascRunLen = k => {
    if(k>=N-1 || !(R[k+1].p>R[k].p && R[k+1].p-R[k].p<=2)) return 0;   // next must be a step up
    if(k>0 && R[k].p-R[k-1].p>0 && R[k].p-R[k-1].p<=2) return 0;       // already mid-ascent -> not the start
    let len=1; while(k+len<N && R[k+len].p-R[k+len-1].p>0 && R[k+len].p-R[k+len-1].p<=2) len++;
    return len;
  };
  const chromatic = k => (k>0 && Math.abs(R[k].p-R[k-1].p)===1) || (k<N-1 && Math.abs(R[k].p-R[k+1].p)===1);
  // Within a hand POSITION (a contiguous run inside a hand-span, before any reposition), the LOWEST note takes the
  // low outer finger (thumb in RH, pinky in LH) and the HIGHEST takes the high outer finger — the hand must not
  // waste an outer finger on an interior/unplayed note, which is what the global optimiser does when it parks the
  // thumb below the melody to sit nearer a high note later. This enforces "lowest = thumb, 2nd-lowest = 2, ...".
  const SPAN2 = 9;          // a consecutive leap beyond this repositions the hand
  const POSSPAN = 7;        // a five-finger POSITION spans a 5th; a note more than this from the anchor is a new position
  const posExtreme = k => { const p=R[k].p; let lo=true, hi=true, any=false;
    for(let j=k+1;j<N;j++){ if(R[j].i>R[j-1].i+1 || Math.abs(R[j].p-R[j-1].p)>SPAN2 || Math.abs(R[j].p-p)>POSSPAN) break; any=true; if(R[j].p<p)lo=false; if(R[j].p>p)hi=false; }
    for(let j=k-1;j>=0;j--){ if(R[j+1].i>R[j].i+1 || Math.abs(R[j].p-R[j+1].p)>SPAN2 || Math.abs(R[j].p-p)>POSSPAN) break; any=true; if(R[j].p<p)lo=false; if(R[j].p>p)hi=false; }
    return any ? {lo,hi} : {lo:false,hi:false}; };   // an ISOLATED note has no position, so no extreme rule
  const noteCost = (k,f) => { const p=R[k].p; let c=0;
    // CHORD FIT (look-ahead): the DP only sees a chord's OUTER note, but the note stacked toward the thumb needs a
    // finger too. For an interval of `dd` scale-degrees the outer finger must be at least dd+1 (a 3rd needs >=3, a
    // 5th+ needs the pinky/thumb=5) or the inner note would need finger 0. Making an unfittable outer finger costly
    // forces the GLOBAL optimiser to arrive on a playable one - i.e. to position the hand FOR the chord in advance
    // (Matthew: bar 6 fingered to reach the chord in bar 7), and it also stops the thumb-on-a-chord-bottom bug.
    if(chordFit && isChord(k)){ const m=notes[R[k].i].m, span=Math.max(...m)-Math.min(...m);
      // outer finger must leave room for the stacked note, BUT an interval wider than a 3rd is STRETCHED with fewer
      // fingers (a 4th/5th is 1-3 or 1-4, not 1-5), so cap the required gap at 2 (Matthew: a 4th fingers 1-3).
      const dd = span<=2?1 : span<=4?2 : span<=6?3 : span<=7?4 : span<=9?5 : span<=11?6 : 7;
      if(f < Math.min(dd,2)+1) c+=40; }
    { const pe=posExtreme(k), loF=hand==='rh'?1:5, hiF=hand==='rh'?5:1;
      // A PHRASE OPENING (the first note, or the first after a rest) arrives with the hand fresh, so it must
      // finger NATURALLY — the lowest note of the opening on the low outer finger — even if that forces a shift
      // later; the global optimiser otherwise pre-shifts to save the shift. Mid-phrase it's a gentle bias.
      const open = k===0 || (k>0 && R[k].i > R[k-1].i+1);
      const w = open ? 10 : 0;   // the outer-finger-ON-the-position-extreme force is a PHRASE-OPENING rule (place the fresh hand naturally, lowest note on the low outer finger). MID-phrase it fought a smooth line and minted step faults while being redundant with the local peak/valley penalty + move economy (which the data confirms cover peaks): dropping it → step-dir 2.1→1.7, step-slide 2.1→1.8, refinger 9.8→8.9, peak/valley still 0, 0 invalid.
      // ...BUT the thumb is never forced onto a BLACK key — the thumb-avoids-black rule overrides this one (an
      // E-flat-major scale doesn't put the thumb on E-flat; the black note takes a longer finger, thumb stays white).
      if(pe.lo && f!==loF && !(loF===1 && isBlack(p))) c+=w;     // the position's LOWEST note -> the low outer finger
      if(pe.hi && f!==hiF && !(hiF===1 && isBlack(p))) c+=w; }   // the position's HIGHEST note -> the high outer finger
    if(isBlack(p)){ if(f===1) c+=16; else if(f===5) c+=7; }     // in a melodic/scalic line the THUMB and LITTLE finger stay on WHITE keys — you navigate to avoid them on black (standard pedagogy); a chord grip with black outer notes is the exception (chords aren't fingered here as single notes) and a genuine last-resort still pays it
    if(f===4) c+=0.6;                                            // the weak 4th is used deliberately (once per octave)
    // CHROMATIC line: a BLACK note in a run of semitones takes a long middle finger (2/3), not the weak 4/5 (nor
    // the thumb) — which also stops the awkward 3-4-5 climb over consecutive chromatic notes. A bias, so a firmly
    // committed hand position can still win.
    if(chromatic(k) && isBlack(p)){ if(f>=4) c+=2.8; else if(f===2) c+=1.1; }   // the black takes the long 3 (2 second, weak 4/5 last)
    // The LOW-outer finger (RH thumb / LH pinky) is never PARKED on a local PEAK, nor the HIGH-outer on a local VALLEY:
    //   you EXTEND to the top note (3->4->5), you do NOT tuck the thumb onto the upper note of a two-note wiggle (the
    //   2-1-2-1 churn — a crossed hand, not a held position). [P — a strong pianist lean; a genuinely forced case can still pay it]
    if(k>0 && k<N-1 && R[k-1].i===R[k].i-1 && R[k+1].i===R[k].i+1){
      const peak = p>R[k-1].p && p>R[k+1].p, valley = p<R[k-1].p && p<R[k+1].p, loF = hand==='rh'?1:5, hiF = hand==='rh'?5:1;
      if((peak && f===loF) || (valley && f===hiF)) c += 8;
    }
    // and the chromatic fingering must BEGIN on the first note of the chromatic set: the white note that starts an
    // ascending chromatic run takes the thumb, so the sharps land on the long fingers (never a slide onto black).
    const chromStart = k<N-1 && !isBlack(p) && isBlack(R[k+1].p) && R[k+1].p-p===1 && !(k>0 && p-R[k-1].p===1);
    if(chromStart && f!==1) c+=4;
    if(reserved(k,f)) c+=2.2;                                    // hold the outer finger for the extreme note to come
    if(stranded(k,f)) c+=6;                                      // never dead-end mid-gesture
    // LH OOM-PAH idiom: the low single BASS note takes the pinky; the "pah" CHORD sitting above it is a
    // conventional grip (bottom on 3, thumb on top) — NOT another pinky-bass. So G-[Bb-D] fingers 5, then 3(-1).
    if(hand==='lh' && Array.isArray(notes[R[k].i].m) && k>0 && R[k-1].p < R[k].p-2){
      if(f===3){} else if(f===2) c+=0.9; else c+=3.2;            // pah chord bottom -> 3 (2 acceptable)
    } else if(isBassAnchor(k) && !reserved(k,anchorFinger) && f!==anchorFinger){
      c += (f===anchorFinger+(hand==='lh'?-1:1)?3:6);           // a genuine bass -> the pinky (RH: thumb), firmly; 4 a distant second
    }
    if(hand==='rh' && !isBlack(p) && ascRunLen(k)>=4 && f!==1) c += 2.0;   // start an ascending RH run on the thumb (only on a white key; never force the thumb onto a black run-start)
    return c; };
  // Transition cost. Fingers may only move against pitch (cross) via the thumb: the thumb passes
  // UNDER when continuing toward the pinky, and a finger crosses OVER the thumb when continuing
  // toward the thumb. Any other reversal, or sliding one finger between two pitches, is unidiomatic.
  // A finger pair comfortably spans only so far (~Parncutt MaxComf): adjacent fingers a 2nd/small
  // 3rd, a skip a 4th, and only thumb-pinky an octave. Reaching WIDER is a stretch, worse with the
  // weak 4th/5th. This is what makes a broken third finger 5-3 (skip) rather than the jammed 5-4.
  const COMF = { 1:3, 2:5, 3:8, 4:12 };
  const stretch = (f1,f2,p1,p2) => { if(f1===f2) return 0;
    const span=Math.abs(p2-p1), df=Math.abs(f2-f1);
    // reaching wider than the pair spans; much worse with the weak 4th/5th.
    const over = span - COMF[df];
    let c = over>0 ? over * ((f1>=4||f2>=4) ? 4.2 : 1.5) : 0;
    // never JAM two adjacent weak fingers (4-5 / 5-4) onto a 3rd or wider — a broken 3rd must be a SKIP
    // (5-3), not the jammed 5-4. (Adjacent weak fingers are fine only for a 2nd.)
    if(df===1 && (f1>=4||f2>=4) && span>=3) c += 5;
    return c;
  };
  // HOLD THE POSITION. The single biggest fault was the hand switching finger-frames for free whenever two
  // anchors happened to coincide, so a pitch got a different finger each time it recurred. Moving the frame is
  // now expensive (AW), so the DP commits to one position and only shifts when the music genuinely leaves it.
  const AW = 2.4;
  const move = (p1,f1,p2,f2,d1,d2) => {
    const pw = S*(p2-p1);                                        // pitch travel toward the pinky
    const am = Math.abs(anchor(p2,f2)-anchor(p1,f1));            // how far the hand frame moves
    const st = stretch(f1,f2,p1,p2);                             // reaching wider than the fingers span
    // Re-placing the hand is an EVENT with a fixed cost, and it is much harder between QUICK notes — you can't
    // scrunch the hand into a new position cleanly mid-run. So the hand HOLDS its position through fast
    // passagework and shifts only when forced (ideally on a longer note). A crossing is the one allowed fast shift.
    const quick = Math.min(d1??1, d2??1) <= 0.5;
    const repo = am>1e-9 ? (1.6 + (quick?2.8:0)) : 0;
    // You can slide a finger OFF a black key onto the adjacent white, but never SLIDE from a white onto a black.
    // The tell for a slide vs a legitimate lift is whether the HAND is repositioning: a same-finger step onto a
    // black key with the frame essentially unchanged (am<1) is a connected slide = not playable; the same move
    // WITH a real reposition (am>=1) is a lift and is allowed to fall through to the normal cost.
    if(f1===f2 && pw!==0 && Math.abs(p2-p1)<=2 && isBlack(p2) && am<1) return 20;
    if(pw===0) return f1===f2 ? 0 : 2.5;                         // repeated pitch: strongly keep the SAME finger
    // SAME FINGER on two DIFFERENT connected pitches = a drag/slide (or a lift-and-re-place). A composer/editor
    //   DISPREFERS it — you change fingers so the notes join — and the wider the reach the more dispreferred: a 2nd can
    //   slide, a 3rd+ really wants a change. But it is NOT forbidden — a detached note, or a spot where every other
    //   finger costs more, takes it (there are exceptions to everything). A LEAN that GROWS with the interval, never a
    //   wall — so the global optimiser prefers a real finger where one is cheaper, yet an exception still wins. [P]
    if(f1===f2) return 3 + am*AW + repo + Math.max(0, Math.abs(p2-p1)-2)*3;
    // a STEP ideally takes ADJACENT fingers — skipping a finger on a 2nd (2→4) leaves one stranded and reads worse
    //   (5-4-3-2 over 5-4-2-1). A mild lean toward adjacency, growing with the gap; reachable when a finger is genuinely
    //   reserved for what follows. Only on a step (a skip legitimately jumps fingers). [P]
    const stepGap = (Math.abs(p2-p1)<=2 && Math.abs(f2-f1)>1) ? (Math.abs(f2-f1)-1)*2.2 : 0;
    if(pw>0){                                                    // moving toward the pinky
      if(f2>f1)          return am*AW + st + repo + stepGap;     // fingers spread outward (normal)
      if(f2===1 && f1>1) return (f1===2 ? 12 : 2) + am*0.85;     // thumb passes UNDER a long finger (3/4/5); a tuck under only finger 2 is too tight (near-impossible) → costly
      return 12 + am*AW + repo;                                  // awkward cross (a strong lean against, not a ban)
    } else {                                                     // moving toward the thumb
      if(f2<f1)          return am*AW + st + repo + stepGap;     // fingers close inward (normal)
      if(f1===1 && f2>1) return (f2===2 ? 12 : 2) + am*0.85;     // a LONG finger (3/4/5) crosses OVER the thumb; finger 2 over the thumb is too tight (Matthew: thumb→2 step is impossible) → costly
      return 12 + am*AW + repo;
    }
  };

  // Across a REST the hand LIFTS off the keys and re-places, so the move is a free reposition — the connected-
  // motion penalties (awkward cross, slide) must NOT apply, or a jump-then-rest wrongly looks unplayable and the
  // right finger (e.g. the pinky on a low bass reached by a downward leap) gets rejected.
  const lift = (p1,f1,p2,f2) => Math.abs(anchor(p2,f2)-anchor(p1,f1))*0.6 + 0.4;
  const INF=1e9;
  // solve the Viterbi (optionally with a PIN: note-index -> forced finger) -> the fingering path + its total cost.
  const solve = (pm) => {
    const dp = Array.from({length:N}, ()=>new Array(6).fill(INF)), bk = Array.from({length:N}, ()=>new Array(6).fill(0));
    const pn = k => (pm && pm.has(R[k].i)) ? pm.get(R[k].i) : null;
    for(let f=1;f<=5;f++) dp[0][f] = (pn(0)!=null && pn(0)!==f) ? INF : noteCost(0,f);
    for(let k=1;k<N;k++){ const gap = R[k].i > R[k-1].i + 1;      // a rest sits between -> the hand lifts
      for(let f=1;f<=5;f++){ if(pn(k)!=null && pn(k)!==f) continue; const nc=noteCost(k,f);
      for(let g=1;g<=5;g++){ const mv = gap ? lift(R[k-1].p,g,R[k].p,f) : move(R[k-1].p,g,R[k].p,f,R[k-1].d,R[k].d);
        const c=dp[k-1][g]+mv+nc; if(c<dp[k][f]){ dp[k][f]=c; bk[k][f]=g; } } } }
    let best=1,bv=INF; for(let f=1;f<=5;f++) if(dp[N-1][f]<bv){ bv=dp[N-1][f]; best=f; }
    const s=new Array(N); s[N-1]=best; for(let k=N-1;k>0;k--) s[k-1]=bk[k][s[k]];
    return { seq:s, bv };
  };
  let { seq, bv } = solve(pin);
  // PREFER CONSISTENCY [P — how a pianist thinks]: among globally-optimal fingerings, keep a RECURRING pitch on its
  //   finger. Where two connected occurrences of one pitch were fingered differently, unify them to the best common
  //   finger — but ADOPT it ONLY when that costs no more than the small value of consistency (CONSIST); a genuine,
  //   NECESSARY reposition costs far more, so it is never disturbed. Selecting among tied optima, not overriding the
  //   optimiser. Skipped when the caller pinned (the audit's counterfactual wants the raw cost). [criteria-passing → stays in]
  if(!pin){ const CONSIST=1.0; const pm=new Map();
    // count same-finger legato SLIDES (same finger on two connected step-apart pitches, not the idiomatic black→white edge
    //   slide) — a physical fault WORSE than a re-finger. Consistency must never trade a re-finger for a slide.
    const slides = s => { let n=0; for(let k=1;k<N;k++){ if(R[k].i!==R[k-1].i+1) continue; const dp=Math.abs(R[k].p-R[k-1].p); if(s[k]===s[k-1] && dp>0 && dp<=2 && !(isBlack(R[k-1].p)&&!isBlack(R[k].p))) n++; } return n; };
    let curSlides = slides(seq);
    for(let pass=0; pass<6; pass++){ let changed=false;                          // more passes + every recurrence (no first-pair break): a pitch recurring 3+ times, and coupled pitches, only converge across passes
      for(let a=0;a<N;a++){ if(notes[R[a].i].rest || Array.isArray(notes[R[a].i].m)) continue;
        for(let b=a+1; b<N && R[b].i<=R[a].i+8; b++){
          if(R[b].i!==R[b-1].i+1) break;                          // a rest between frees the hand — consistency not required
          if(R[b].p!==R[a].p || seq[a]===seq[b]) continue;        // want the SAME pitch, differently fingered
          let bestC=null, bestCost=bv+CONSIST+1e-9, bestSeq=null, bestBv=null;
          for(let c=1;c<=5;c++){ const t=new Map(pm); t.set(R[a].i,c); t.set(R[b].i,c); const r=solve(t);
            if(r.bv<bestCost && slides(r.seq)<=curSlides){ bestCost=r.bv; bestC=c; bestSeq=r.seq; bestBv=r.bv; } }   // FAULT-AWARE: never adopt a unification that adds a slide
          if(bestC!=null){ pm.set(R[a].i,bestC); pm.set(R[b].i,bestC); seq=bestSeq; bv=bestBv; curSlides=slides(seq); changed=true; }
        } }
      if(!changed) break;
    }
  }
  const effort = N>1 ? bv/(N-1) : 0;                            // playability: avg awkwardness per move
  for(let k=0;k<N;k++) fings[R[k].i]=seq[k];

  // Repeated CHORD SHAPE -> the SAME fingering every time it recurs. An oom-pah 'pah' chord is one shape struck
  // over and over; it must not be re-fingered 3, then 5, then 1 across a bar just because the DP saw each copy in
  // a slightly different local context. The first occurrence's finger wins; every identical chord copies it.
  const shapeKey = k => { const m=notes[R[k].i].m; return Array.isArray(m) ? m.join(',') : null; };
  { const firstShape=new Map();
    for(let k=0;k<N;k++){ const key=shapeKey(k); if(key==null) continue;
      if(firstShape.has(key)){ seq[k]=firstShape.get(key); fings[R[k].i]=seq[k]; } else firstShape.set(key, seq[k]); } }

  // PRINT (to Matthew's spec): one finger per hand at the very start; each GENUINE position change, marked on the
  // note where the new position BEGINS; each CROSSING, on the note the cross actually happens; and the occasional
  // NON-OBVIOUS stretch (a 4 taken because a 5 must follow it). A note that stays in the SAME hand position needs
  // nothing; a repeated chord shape / figure is fingered ONCE, never re-marked as the harmony moves under it.
  print.add(R[0].i);
  const anc = k => anchor(R[k].p, seq[k]);                        // frame id = scale-degree the thumb sits on
  const shownShape=new Set(); { const k0=shapeKey(0); if(k0) shownShape.add(k0); }
  const shownSig=new Set();
  for(let k=1;k<N;k++){
    const dpv = R[k].p - R[k-1].p;
    const key = shapeKey(k);
    // A finger is printed at a genuine POSITION CHANGE, never on a chord that merely sits within the position the
    // hand is already in (Matthew: don't finger a chord just after a position change - finger the change itself).
    if(key && shownShape.has(key)) continue;                     // a recurring chord shape: already fingered, don't re-mark
    if(key) shownShape.add(key);
    const thumbUnder = S*dpv>0 && seq[k]===1 && seq[k-1]>1;       // ascending: thumb passes under  -> mark this (thumb) note
    const crossOver  = S*dpv<0 && seq[k-1]===1 && seq[k]>1;       // descending: a finger crosses over the thumb -> mark this note
    const cross = thumbUnder || crossOver;
    const frameMove = Math.abs(anc(k) - anc(k-1));               // did the hand actually change POSITION?
    const relocate = frameMove>=1 && !cross;                     // a real reposition (a crossing is its own case, above)
    const stretch = !cross && frameMove<1 && seq[k]===4 && k<N-1 && seq[k+1]===5 && Math.abs(R[k+1].p-R[k].p)>=3; // reach to 4 to keep 5
    if(!(cross || relocate || stretch)) continue;
    const bigLeap = Math.abs(dpv)>=7;
    const sig = (cross?'X':relocate?'L':'T') + Math.sign(dpv) + ':' + seq[k-1] + '>' + seq[k];
    if(!bigLeap && !cross && shownSig.has(sig)) continue;        // suppress an obviously repeating figure's reposition
    print.add(R[k].i); shownSig.add(sig);
  }
  return { fings, print, effort, bv };   // bv = TOTAL path cost (for a fixed-total comparison, e.g. the audit's refinger necessity test)
}

// ==============================================================================================================
// FORWARD, GESTURE-BASED fingering REASONER - the primary fingerer (replaces the cost-DP above, kept as fingerHandDP
// for reference/comparison). Reasons like a player reading forward: segment the line into gestures the hand plays
// without repositioning, recognise each gesture's IDIOM (scale / arpeggio / positional / octave / chord), finger it by
// that idiom + reserve + economy + thumb-off-black, carrying the hand across gestures. Marks ABRSM-sparse by GRIP.
// Verified against a canonical harness (scales/arpeggios/skip-scale/reserve, both hands) + fault metrics on real output
// (thumb-on-black ~0, ~10x fewer same-finger-leaps than the DP). Returns {fings, print, effort} like the DP.
// ==============================================================================================================
export function fingerHand(notes, hand, scalePcs){
  const SC = (scalePcs&&scalePcs.length) ? [...new Set(scalePcs.map(x=>((x%12)+12)%12))].sort((a,b)=>a-b) : [0,2,4,5,7,9,11];
  const degreeOf = m => { const pc=((m%12)+12)%12, oct=Math.floor(m/12), i=SC.indexOf(pc);
    if(i>=0) return oct*7+i;
    let below=-1; for(let k=SC.length-1;k>=0;k--){ if(SC[k]<pc){ below=k; break; } }
    return below<0 ? oct*7-0.5 : oct*7+below+0.5; };
  const outer = n => Array.isArray(n.m) ? (hand==='rh'?Math.max(...n.m):Math.min(...n.m)) : n.m;
  const R=[]; notes.forEach((n,i)=>{ if(!n.rest) R.push({i,p:outer(n),chord:Array.isArray(n.m),m:n.m,dur:n.d}); });
  const N=R.length; const fings=new Array(notes.length).fill(null); const print=new Set();
  if(!N) return {fings,print,effort:0};
  R.forEach(r=>r.deg=degreeOf(r.p));
  const S = hand==='rh'?1:-1;                       // +1 pitch step = pinkyward for RH
  const outerLow = hand==='rh' ? 1 : 5;             // finger on the LOWEST pitch of a frame
  const outerHigh = hand==='rh' ? 5 : 1;            // finger on the HIGHEST pitch of a frame
  const seq = new Array(N).fill(null);              // finger per sounding note (outer finger for a chord)
  let handAnchor = null;                            // CONTINUOUS HAND-STATE: the thumb-side low degree the hand currently sits on

  // ---- 1) SEGMENT into gestures the hand plays without a lift/reposition ----
  // A boundary is a rest (hand lifts), a 6th+ leap (hand relocates), or an arpeggic run passing beyond an octave span.
  const seg=[]; let st=0;
  for(let k=1;k<N;k++){
    const rest = R[k].i > R[k-1].i+1;
    const dd = R[k].deg - R[k-1].deg, add = Math.abs(dd);
    const step = add<=1+1e-9;
    const octaveLeap = Math.abs(R[k].p-R[k-1].p)===12;             // an octave is a reachable STRETCH (1-5), not a reposition
    let boundary = rest || (add>=5 && !octaveLeap);                 // rest / 6th+ leap (but hold an octave in one frame)
    if(!boundary && !step && Math.abs(R[k].deg - R[st].deg) > 7+1e-9) boundary=true;  // arpeggio past an octave repositions
    // SUSTAINED DIRECTION REVERSAL: an up-arpeggio then a down-scale is TWO gestures, not one mixed run - so the arpeggio
    // keeps its own idiom (its thumb on its anchor, black or not) and the scale is fingered as a scale. A single turn
    // (up then straight back down by one) is NOT a boundary - the new direction must CONTINUE for it to be a real reversal.
    if(!boundary && k>=2 && k<N-1){ const d1=Math.sign(R[k].deg-R[k-1].deg), d0=Math.sign(R[k-1].deg-R[k-2].deg), dN=Math.sign(R[k+1].deg-R[k].deg);
      if(d1!==0 && d0!==0 && d1!==d0 && dN===d1) boundary=true; }
    if(boundary){ seg.push([st,k-1]); st=k; }
  }
  seg.push([st,N-1]);

  // ---- 2) classify + finger each gesture, carrying the frame ----
  // classify by the intervals inside the gesture
  const classify = (a,b) => {
    if(R.slice(a,b+1).some(r=>r.chord)) return 'chord';
    const L=b-a+1; if(L===1) return 'single';
    let steps=0, skips=0, dirs=new Set();
    for(let k=a+1;k<=b;k++){ const dd=R[k].deg-R[k-1].deg, ad=Math.abs(dd); dirs.add(Math.sign(dd));
      if(ad<=1+1e-9) steps++; else skips++; }
    const oneDir = dirs.size<=1 || (dirs.has(0)&&dirs.size<=2);
    if(L>=3 && steps>=skips && oneDir) return 'scalar';            // a run of steps (a scale / skip-scale line)
    if(L>=3 && skips>steps && oneDir) return 'arpeggic';          // a broken chord (skips of 3rds/5ths)
    if(L===2 && Math.abs(R[b].deg-R[a].deg)>=2) return 'arpeggic'; // a lone skip (broken 3rd/4th/5th)
    return 'positional';                                           // short / mixed / turning -> one hand placement
  };

  // SCALE fingering, BLACK-AWARE. Walk from the thumb end (low pitch for RH, high for LH). Within a 5th it is plain
  // positional. Wider, it groups into 3s/4s and crosses the thumb UNDER only onto WHITE notes (a scale never puts the
  // thumb on a black key), extending to the pinky on the run's final notes. Same finger per pitch ascending or descending.
  const white = k => !isBlack(R[k].p);
  const SCq=SC; const pcOfDeg = d => SCq[((d%7)+7)%7];             // pitch-class of a scale degree
  // A scalar run is fingered by its SITUATION:
  //  - a FRAGMENT within a 5th (span<=4) is a five-finger position: thumb-to-pinky, thumb on the low note (RH) even if it
  //    is black (a position anchor, no thumb-under) - Matthew's "a D-to-A run is just thumb to little finger".
  //  - a GENUINE scale (span>=6th, so it needs thumb-unders) takes the CONVENTIONAL fingering for its key, DERIVED not
  //    hard-coded: the thumb falls on the TONIC and the 4th degree (RH) / 5th degree (LH), each shifted UP off a black key
  //    (so B-flat's thumbs come out on C and F), groups run 3-4, and the run's own extreme extends the last group (ends on
  //    4/5, not a restarted thumb). Read off the present notes so a SKIP-scale keeps each note's full-scale finger.
  const scaleFingerRun = (a,b) => {
    const loDeg=Math.round(Math.min(R[a].deg,R[b].deg)), hiDeg=Math.round(Math.max(R[a].deg,R[b].deg)), span=hiDeg-loDeg;
    if(span<=4){ for(let k=a;k<=b;k++){ const d=Math.round(R[k].deg);
      seq[k] = hand==='rh' ? Math.min(5,(d-loDeg)+1) : Math.min(5,(hiDeg-d)+1); } return; }
    const line=[]; for(let d=loDeg; d<=hiDeg; d++) line.push(d);
    const thumbEnd = hand==='rh' ? line : line.slice().reverse();  // walk from the thumb end (low for RH, high for LH)
    const L=thumbEnd.length, fOf={};
    const thumbPcs=new Set();                                      // conventional thumb pitch-classes for THIS key (tonic + 4th/5th, off black)
    for(const bd of (hand==='rh'?[0,3]:[0,4])){ let dd=bd; while(isBlack(pcOfDeg(dd))) dd++; thumbPcs.add(pcOfDeg(dd)); }
    let firstThumb = thumbEnd.findIndex(d=>thumbPcs.has(pcOfDeg(d))); if(firstThumb<0) firstThumb=0;
    let f=0;
    for(let t=firstThumb;t<L;t++){ const d=thumbEnd[t];
      if(thumbPcs.has(pcOfDeg(d)) && t!==L-1) f=1;                 // thumb-under onto a white key - except the very last note
      else f=(f===0?1:f+1);                                        // otherwise the group ascends (its extreme extends to 4/5)
      fOf[d]=Math.min(5,f);
    }
    // LEADING notes before the first thumb (a black-key tonic can't take the thumb): a scale starts on the finger it ENDS
    // on, so mirror them from the top of the run (a single leading tonic = the top tonic's finger: Bb->4, Eb->3).
    for(let t=0;t<firstThumb;t++){ const mirror=L-1-(firstThumb-1-t);
      fOf[thumbEnd[t]] = (mirror>=0 && fOf[thumbEnd[mirror]]!=null) ? fOf[thumbEnd[mirror]] : Math.max(2,4-(firstThumb-1-t)); }
    for(let k=a;k<=b;k++) seq[k]=fOf[Math.round(R[k].deg)] ?? outerLow;
  };

  // ARPEGGIC: skip fingers. Assign from the THUMB end (thumb=1) outward, adding a finger-gap per interval (step +1, 3rd
  // +2, 6th/7th +3, octave +4) - and if that would overrun finger 5 before the pinkyward extreme, COMPRESS the lower
  // intervals (nearest the thumb) so the pinky is RESERVED for the extreme. That is what makes a broken triad 1-3-5,
  // an octave 1-5, and B-D-F#-G (a triad continuing up a step) come out 1-2-4-5 instead of stranding the pinky.
  const incOf = iv => iv<=1?1 : iv<=4?2 : iv<=6?3 : 4;
  const arpFingerRun = (a,b) => {
    // order thumb-end -> pinky-end (RH: low->high; LH: high->low)
    const ord=[...Array(b-a+1).keys()].map(x=>a+x).sort((x,y)=> hand==='rh' ? R[x].deg-R[y].deg : R[y].deg-R[x].deg);
    const incs=[]; for(let t=1;t<ord.length;t++) incs.push(incOf(Math.abs(R[ord[t]].deg-R[ord[t-1]].deg)));
    let sum=incs.reduce((s,x)=>s+x,0);
    for(let t=0; sum>4 && t<incs.length; t++){ while(incs[t]>1 && sum>4){ incs[t]--; sum--; } }  // compress from the thumb end -> reserve the pinky
    let f=1; seq[ord[0]]=1; for(let t=1;t<ord.length;t++){ f=Math.min(5,f+incs[t-1]); seq[ord[t]]=f; }
  };

  // ROLE of a note relative to its immediate NEIGHBOURS (across gesture boundaries too): a clear local LOW is a bass
  // anchor (pinky in LH / thumb in RH); a clear local HIGH is the top outer finger. This is what puts the LH pinky on
  // an oom-pah bass and stops a lone low note taking the thumb.
  const isLowAnchor = k => { const p=R[k].deg, a=k>0?R[k-1].deg:null, b2=k<N-1?R[k+1].deg:null;
    return a==null ? (b2!=null&&p<b2-1) : b2==null ? (p<a-1) : (p<a-1 && p<b2-1); };
  const isHighAnchor = k => { const p=R[k].deg, a=k>0?R[k-1].deg:null, b2=k<N-1?R[k+1].deg:null;
    return a==null ? (b2!=null&&p>b2+1) : b2==null ? (p>a+1) : (p>a+1 && p>b2+1); };

  // frame helpers: fingerAt(t,d) = which finger sits on degree d when the THUMB is on degree t; thumbFrom(d,f) = the thumb
  // degree implied by playing degree d with finger f. The hand state `handAnchor` IS this thumb degree, threaded per note.
  const fingerAt = (t,d) => hand==='rh' ? (d-t)+1 : (t-d)+1;
  const thumbFrom = (d,f) => hand==='rh' ? d-(f-1) : d+(f-1);
  // POSITIONAL / SINGLE / CHORD, threaded through the CONTINUOUS HAND-STATE so every seam is reasoned (no jam can arise):
  // each note is fingered from where the hand ALREADY sits (economy), the hand RE-ANCHORS only when it must move, and the
  // implied hand position is carried to the next note - so a lone bass on the pinky flows into a 3rd-up as 5->3 (a skip),
  // never the jammed 5->4.
  const posFingerRun = (a,b) => {
    const degs=R.slice(a,b+1).map(r=>Math.round(r.deg)); const loDeg=Math.min(...degs), hiDeg=Math.max(...degs);
    const covers = t => degs.every(d=>{ const f=fingerAt(t,d); return f>=1&&f<=5; });
    // place the frame for this gesture: KEEP the carried hand if it covers (the seam flows); else place by reserve.
    let anchor = (handAnchor!=null && covers(handAnchor)) ? handAnchor : (hand==='rh'?loDeg:hiDeg);
    for(let k=a;k<=b;k++){ const d=Math.round(R[k].deg);
      const reachable = handAnchor!=null && fingerAt(handAnchor,d)>=1 && fingerAt(handAnchor,d)<=5;
      // an LH struck CHORD above a bass (an oom-pah "pah"): thumb on TOP, bottom by width+trajectory (reserve the pinky for
      // a returning bass). This is the one grip that isn't a plain frame note - but it still re-anchors the hand after.
      if(R[k].chord && hand==='lh' && isHighAnchor(k)){
        const dd=Math.round(Math.max(...R[k].m.map(degreeOf))-Math.min(...R[k].m.map(degreeOf)));
        const returnsLow = k<N-1 && !R[k+1].chord && R[k+1].deg < R[k].deg-2;
        seq[k] = (returnsLow && dd<=3) ? Math.max(2,Math.min(4,1+dd)) : Math.max(2,Math.min(5,1+dd));
      }
      // a lone BASS/PEAK the carried hand can't already reach = a real reposition: take the outer finger and RE-ANCHOR.
      else if(a===b && isLowAnchor(k) && !reachable){ seq[k]=outerLow; }
      else if(a===b && isHighAnchor(k) && !reachable){ seq[k]=outerHigh; }
      // otherwise finger from the hand where it sits (economy). If the note runs OFF the frame, the hand RE-ANCHORS (that
      // note takes the outer finger and the frame shifts to it) instead of CLAMPING to 5 - clamping is what jams a wide
      // gesture (the top note on 5 and the 3rd below stuck on 4). Re-anchoring makes the 3rd below come out 3 (a skip).
      else { let f=fingerAt(anchor,d);
        if(f>5){ anchor = hand==='rh' ? d-4 : d+4; f=5; }          // ran off the pinky end -> shift the hand, this note takes the pinky
        else if(f<1){ anchor = d; f=1; }                           // ran off the thumb end -> shift, this note takes the thumb
        seq[k]=f; }
      handAnchor = thumbFrom(d, seq[k]);   // THREAD: carry the implied hand position to the next note / gesture
    }
  };

  for(const [a,b] of seg){
    const cls = classify(a,b);
    if(cls==='scalar') scaleFingerRun(a,b);
    else if(cls==='arpeggic') arpFingerRun(a,b);
    else posFingerRun(a,b);
    if(seq[b]!=null) handAnchor = thumbFrom(Math.round(R[b].deg), seq[b]);   // carry the hand position OUT of every gesture (incl. a scale/arp) so the next seam is reasoned
  }

  // FIGURE-RECOGNITION (the editor's model): the generator TAGGED each LH note with the figure ROLE it built, so where the
  // figure is KNOWN, apply its CONVENTIONAL fingering AND connect it to its neighbours by comfort. The seam rule is the
  // crux: a "pah" chord's bottom finger must SKIP from the bass's pinky (5 -> 3), reserving the pinky for the bass's return
  // - NEVER collide with it (the 5->5 / 5->4 jam). Untagged notes keep the gesture fingering above.
  // INFER the oom-pah pairing where the generator left notes untagged (57% of LH notes): a struck chord NEXT TO a clear
  // local-low, and that low next to the chord, are a "pah" + its "oom". Both halves require the PAIRING, so a standalone
  // block/held chord is never mis-gripped. This routes untagged oom-pahs through the SAME coordinated role-path (bass on
  // the pinky the chord grip reserves) - jam-free by construction, unlike a post-hoc bass nudge.
  const isBassLow = k => !R[k].chord && isLowAnchor(k);
  const inferRole = k => {
    if(_cfg.inferOompah===false) return undefined;
    if(R[k].chord) return ((k>0 && isBassLow(k-1)) || (k<N-1 && isBassLow(k+1))) ? 'chord' : undefined;
    if(isBassLow(k) && ((k>0 && R[k-1].chord) || (k<N-1 && R[k+1].chord))) return 'bass';
    return undefined;
  };
  if(_cfg.roles && hand==='lh' && R.some((r,k)=>(notes[r.i] && notes[r.i]._role) || inferRole(k))){
    const roleOf = k => (notes[R[k].i] && notes[R[k].i]._role) || inferRole(k);
    const spanOf = k => { const m=notes[R[k].i].m; return Array.isArray(m) ? Math.round(Math.abs(degreeOf(Math.max(...m))-degreeOf(Math.min(...m)))) : 0; };
    for(let k=0;k<N;){ const role=roleOf(k);
      if(role==='bass'){                                            // the low root -> pinky, BUT only when it's a STATIC/repeated root
        let j=k; while(j<N && roleOf(j)==='bass') j++;              //   (the reserve-pinky idiom). A MOVING bass is a melodic line:
        const distinct = new Set(R.slice(k,j).map(r=>Math.round(r.deg))).size;   //   keep the connected gesture fingering the loop above
        if(j-k===1 || distinct===1) for(let x=k;x<j;x++) seq[x]=5;  //   already gave it - clobbering every note to 5 is what jams a walk.
        k=j; continue; }
      if(role==='chord'){                                          // the "pah": thumb on TOP, and it RESERVES the pinky (bottom on 3)
        seq[k] = 3;                                                 //   so the pinky is free to drop onto the returning bass -> the bass gets 5 as a CONSEQUENCE, not a rule
        k++; continue; }
      if(role==='held'){ const dd=spanOf(k); seq[k] = dd<=0 ? 5 : Math.min(5,1+dd); k++; continue; }   // a HELD chord rings: full grip, no bass to reserve for
      if(role==='arp'){ let j=k; while(j<N && roleOf(j)==='arp') j++; arpFingerRun(k,j-1); k=j; continue; }   // a broken chord -> skip fingers (reserve-compressed)
      k++;                                                          // alberti / walk / untagged: keep the gesture fingering
    }
  }

  // (No blanket thumb-off-black pass: a SCALE already crosses the thumb onto white keys by construction, while a POSITION
  //  anchor or an ARPEGGIO bottom is CONVENTIONALLY allowed the thumb on a black key - Matthew's F#-A-D. Thumb-on-black is
  //  contextual, decided by the gesture idiom, not banned.)
  // repeated pitch keeps the same finger (economy) - done BEFORE the repairs so a repair that fixes a same-finger 3rd on a
  // repeated bass/chord note is not silently REVERTED by re-equalising the repeat afterwards (that left the jam standing).
  if(_cfg.repEqFirst!==false) for(let k=1;k<N;k++) if(Math.abs(R[k].p-R[k-1].p)<1e-9 && R[k].i===R[k-1].i+1) seq[k]=seq[k-1];

  // TWO IDIOM REPAIRS, iterated until they SETTLE (a repair can shift a finger into a new jam with the next note):
  //  - A SKIP takes SKIP fingers: two notes a 3rd+ apart are fingered a skip apart (>=2), never the jammed weak 5-4
  //    (Matthew's rule) - a 1-2/2-3 on a 3rd is a valid reserve stretch, so only weak-finger (>=4) jams are repaired.
  //  - A STEP takes ADJACENT fingers (or a thumb-cross): a 2nd never skips a finger (4->2) mid-line.
  for(let pass=0; _cfg.repairs!==false && pass<4; pass++){ let changed=false;
    for(let k=1;k<N;k++){ if(R[k].i!==R[k-1].i+1 || seq[k]==null || seq[k-1]==null) continue;
      const dd=Math.abs(R[k].deg-R[k-1].deg), df=Math.abs(seq[k]-seq[k-1]), pdir=R[k].p>R[k-1].p?1:-1;
      // a 3rd/4th (dd 2-3) must take SKIP fingers: SAME-finger (df 0, you can't play a 3rd with one finger) always jams;
      // ADJACENT weak fingers (df 1, max>=4) jam too - but a 1-2/2-3 on a 3rd is a valid reserve stretch, so those don't.
      // (a 5th+ same-finger is a reposition you LIFT for - left to leap-differ, not forced here.)
      if(dd>=2-1e-9 && dd<=3+1e-9 && (df===0 || (df===1 && Math.max(seq[k],seq[k-1])>=4))){
        let c2=seq[k-1]+2*pdir;
        if(c2>=1&&c2<=5){ if(seq[k]!==c2){seq[k]=c2;changed=true;} }
        else { const c1=seq[k]-2*pdir; if(c1>=1&&c1<=5&&seq[k-1]!==c1){seq[k-1]=c1;changed=true;} }
      } else if(dd>=1-1e-9 && dd<=1+1e-9 && df>=2 && seq[k]!==1 && seq[k-1]!==1){   // a step with a finger gap (not a cross)
        const v=seq[k-1]+pdir; if(v>=1&&v<=5&&seq[k]!==v){seq[k]=v;changed=true;}
      }
    }
    if(!changed) break;
  }
  // NEVER the same finger across a LEAP (adjacent notes, no rest, more than a 2nd apart): you lift, you don't slide one
  // finger. Nudge the landing finger by one toward the interior, staying in [1,5] and away from the source finger.
  for(let k=1;k<N;k++){ if(R[k].i!==R[k-1].i+1) continue;
    if(Math.abs(R[k].p-R[k-1].p)<=2) continue;                      // a step can repeat a finger only via a slide; leaps only here
    if(seq[k]!==seq[k-1] || seq[k]==null) continue;
    const up = R[k].p>R[k-1].p;                                     // leaping up (RH) wants a higher finger, etc.
    const dir = hand==='rh' ? (up?1:-1) : (up?-1:1);
    let cand = seq[k]+dir;                                          // step the landing finger toward where the leap goes
    if(cand<1||cand>5||cand===seq[k-1]) cand = seq[k]-dir;          // else the other way
    if(cand<1||cand>5||cand===seq[k-1]) cand = (seq[k-1]===1?2 : seq[k-1]===5?4 : seq[k-1]+1);   // last resort: anything != source, in range
    seq[k]=Math.max(1,Math.min(5,cand));
  }

  // LOCAL ARP RE-FINGER (last resort for a CHAIN the pairwise repair can only FLIP): a monotonic run of >=3 notes moving
  // one direction all by 3rd+ skips is an arpeggio the positional frame fingered by degree-offset (a 4th -> finger 4 ->
  // a jammed 4-5 on the next 3rd). Try arp RESERVE spacing on the run, and KEEP it ONLY if it strictly reduces the jams
  // over the run + its two boundary seams - so a good frame is never disturbed and no new seam jam is introduced.
  if(_cfg.arpFix!==false){
    const isJam=x=>{ if(x<1||x>=N||R[x].i!==R[x-1].i+1||seq[x]==null||seq[x-1]==null)return 0; const iv=Math.abs(R[x].p-R[x-1].p),df=Math.abs(seq[x]-seq[x-1]),lo=Math.min(seq[x],seq[x-1]); return ((iv>=3&&iv<=4&&df===0)||(iv>=3&&iv<=4&&df===1&&lo>=4))?1:0; };
    let k=0;
    while(k<N){ let j=k;
      while(j+1<N && R[j+1].i===R[j].i+1 && Math.abs(R[j+1].deg-R[j].deg)>=2-1e-9
            && (j===k || Math.sign(R[j+1].deg-R[j].deg)===Math.sign(R[j].deg-R[j-1].deg))) j++;
      if(j-k>=2){ const hi=Math.min(N-1,j+1); let before=0; for(let x=k;x<=hi;x++) before+=isJam(x);
        const save=seq.slice(k,j+1); arpFingerRun(k,j);
        let after=0; for(let x=k;x<=hi;x++) after+=isJam(x);
        if(after>=before) for(let x=k;x<=j;x++) seq[x]=save[x-k];   // no strict improvement -> revert
      }
      k = j>k ? j+1 : k+1;
    }
  }

  if(_cfg.repEqFirst===false) for(let k=1;k<N;k++) if(Math.abs(R[k].p-R[k-1].p)<1e-9 && R[k].i===R[k-1].i+1) seq[k]=seq[k-1];   // (old ordering, for A/B)

  // ECONOMY (situation 1 - STAY): a compact legato phrase that FITS ONE hand position (span <= 5 scale-degrees, so no
  // thumb-cross is needed, and no struck chord) is played AS that one position - each pitch takes its fixed position
  // finger. Then a pitch the hand never had to leave can't come out with two different fingers (the shuffle the situational
  // audit found). A within-a-5th scale/arp already equals this mapping, so it is idempotent there; it only corrects the
  // mixed/turning phrases that re-anchored for no reason. It does NOT touch phrases that genuinely span more than a 5th
  // (those need real repositioning / thumb-crosses) or oom-pah phrases (a chord = the hand bounces by design).
  if(_cfg.economy!==false){ let a=0;
    for(let k=1;k<=N;k++){ if(k===N || R[k].i!==R[k-1].i+1){ const b=k-1;
      // a chord-free compact phrase is played AS one position - each pitch its fixed position finger. (Guard a chromatic
      // note with no scale-degree, which would poison the low/high of the frame.) An oom-pah phrase (a struck chord) is
      // left alone here: its bass+chord must be fingered as a COORDINATED unit (bass on the pinky the chord grip reserves)
      // - a post-hoc bass nudge fights the existing grip and jams, so untagged-oom-pah economy is handled elsewhere.
      // require INTEGER degrees: a chromatic note has a fractional degree (x.5), and the five-finger position mapping is
      // only valid diatonically - rounding a chromatic degree mis-maps it (e.g. damages a harmonic-minor arp into a jam).
      if(b>a && R.slice(a,b+1).every(r=>!r.chord && Number.isInteger(r.deg))){
        const degs=R.slice(a,b+1).map(r=>Math.round(r.deg)); const lo=Math.min(...degs), hi=Math.max(...degs);
        if(hi-lo<=4) for(let x=a;x<=b;x++){ const d=Math.round(R[x].deg); seq[x] = hand==='rh' ? (d-lo)+1 : (hi-d)+1; }
      }
      a=k; } }
  }

  for(let k=0;k<N;k++) fings[R[k].i]=seq[k];

  // ---- 3) MARKING (ABRSM-sparse): a finger prints only when the reader can't INFER it from what came before. The unit
  // of inference is the GRIP - a bass on the pinky, an oom-pah pah-chord, a five-finger position, a thumb-cross. Once a
  // grip has been shown, its recurrences (the same shape over changing harmony) are inferred, so they are NOT re-marked.
  // That is what collapses a whole oom-pah accompaniment to its opening, while a genuinely NEW position still prints. ----
  const gStart = new Set(seg.slice(1).map(s=>s[0]));
  const grip = k => {                                              // a coarse hand-shape signature (NOT pitch): role + finger
    const role = R[k].chord ? 'C' : isLowAnchor(k) ? 'B' : isHighAnchor(k) ? 'P' : 'p';
    return role + seq[k];
  };
  const shown=new Set(); print.add(R[0].i); shown.add(grip(0));
  for(let k=1;k<N;k++){
    const rest = R[k].i!==R[k-1].i+1;
    const asc = R[k].p>R[k-1].p;
    // A THUMB-CROSS is a specific event, always shown - BUT only a REAL one: the thumb lands on a NEW note, extending the
    // hand past its position (the implied thumb-anchor MOVES). Using finger 1 WITHIN a fixed five-finger position is not a
    // cross (the thumb is stationary - e.g. Grade 2, where a whole piece sits in one position: A3(3)->C4(1) is just
    // pinky-side to thumb, the hand does not move). Requiring the anchor to move stops the spurious per-note marks.
    const thumbMoved = thumbFrom(Math.round(R[k].deg),seq[k]) !== thumbFrom(Math.round(R[k-1].deg),seq[k-1]);
    const cross = !rest && thumbMoved && ((asc&&seq[k]===1&&seq[k-1]>1)||(!asc&&seq[k-1]===1&&seq[k]>1));
    if(cross){ print.add(R[k].i); continue; }
    // ONLY the ANCHOR of a new hand placement can need a mark: a struck chord, or a gesture-start where the hand actually
    // RELOCATED. Relocation is the REAL thing, not the rest/leap PROXY: the implied hand-anchor (thumbFrom) moved AT ALL
    // (a step counts - Matthew: if the hand shifts up a step to reach the coming notes, the player must be TOLD the finger
    // at that moment so they reposition in time). So a gesture where the hand sits STILL earns no mark (reader stays in
    // position); ANY genuine shift does. Interior notes of a gesture (a scale, a broken chord) finger themselves and are
    // never candidates. Thumb-crosses are handled above (a specific event, always shown).
    const relocated = gStart.has(k) && thumbFrom(Math.round(R[k].deg),seq[k]) !== thumbFrom(Math.round(R[k-1].deg),seq[k-1]);
    const candidate = R[k].chord || relocated;
    if(!candidate) continue;
    const g = grip(k);
    if(shown.has(g)) continue;                                      // this grip already taught -> the reader infers it
    print.add(R[k].i); shown.add(g);
  }

  return { fings, print, effort:0, _seg: _cfg.debug ? seg.map(([a,b])=>[R[a].i, R[b].i, classify(a,b)]) : undefined };
}
