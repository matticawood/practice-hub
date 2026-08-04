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

export function fingerHand(notes, hand, scalePcs, chordFit=true){
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
  const N = R.length; if(!N) return { fings, print };

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
      const w = open ? 10 : 2.6;
      // ...BUT the thumb is never forced onto a BLACK key — the thumb-avoids-black rule overrides this one (an
      // E-flat-major scale doesn't put the thumb on E-flat; the black note takes a longer finger, thumb stays white).
      if(pe.lo && f!==loF && !(loF===1 && isBlack(p))) c+=w;     // the position's LOWEST note -> the low outer finger
      if(pe.hi && f!==hiF && !(hiF===1 && isBlack(p))) c+=w; }   // the position's HIGHEST note -> the high outer finger
    if(isBlack(p)){ if(f===1) c+=6.5; else if(f===5) c+=2.8; }   // the thumb (and 5th) strongly shun black keys — the thumb belongs on a white note (last resort only)
    if(f===4) c+=0.6;                                            // the weak 4th is used deliberately (once per octave)
    // CHROMATIC line: a BLACK note in a run of semitones takes a long middle finger (2/3), not the weak 4/5 (nor
    // the thumb) — which also stops the awkward 3-4-5 climb over consecutive chromatic notes. A bias, so a firmly
    // committed hand position can still win.
    if(chromatic(k) && isBlack(p)){ if(f>=4) c+=2.8; else if(f===2) c+=1.1; }   // the black takes the long 3 (2 second, weak 4/5 last)
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
    if(pw>0){                                                    // moving toward the pinky
      if(f2>f1)          return am*AW + st + repo;               // fingers spread outward (normal)
      if(f2===1 && f1>1) return 2 + am*0.85;                     // thumb passes under (the legitimate in-position shift)
      if(f2===f1)        return 3 + am*AW + repo;                // same finger slid (discouraged)
      return 12 + am*AW + repo;                                  // awkward cross
    } else {                                                     // moving toward the thumb
      if(f2<f1)          return am*AW + st + repo;               // fingers close inward (normal)
      if(f1===1 && f2>1) return 2 + am*0.85;                     // a finger crosses over the thumb
      if(f2===f1)        return 3 + am*AW + repo;
      return 12 + am*AW + repo;
    }
  };

  // Across a REST the hand LIFTS off the keys and re-places, so the move is a free reposition — the connected-
  // motion penalties (awkward cross, slide) must NOT apply, or a jump-then-rest wrongly looks unplayable and the
  // right finger (e.g. the pinky on a low bass reached by a downward leap) gets rejected.
  const lift = (p1,f1,p2,f2) => Math.abs(anchor(p2,f2)-anchor(p1,f1))*0.6 + 0.4;
  const INF=1e9;
  const dp = Array.from({length:N}, ()=>new Array(6).fill(INF));
  const bk = Array.from({length:N}, ()=>new Array(6).fill(0));
  for(let f=1;f<=5;f++) dp[0][f]=noteCost(0,f);
  for(let k=1;k<N;k++){ const gap = R[k].i > R[k-1].i + 1;        // a rest sits between -> the hand lifts
    for(let f=1;f<=5;f++){ const nc=noteCost(k,f);
    for(let g=1;g<=5;g++){ const mv = gap ? lift(R[k-1].p,g,R[k].p,f) : move(R[k-1].p,g,R[k].p,f,R[k-1].d,R[k].d);
      const c=dp[k-1][g]+mv+nc;
      if(c<dp[k][f]){ dp[k][f]=c; bk[k][f]=g; } } } }
  let best=1,bv=INF; for(let f=1;f<=5;f++) if(dp[N-1][f]<bv){ bv=dp[N-1][f]; best=f; }
  const effort = N>1 ? bv/(N-1) : 0;                            // playability: avg awkwardness per move
  const seq=new Array(N); seq[N-1]=best;
  for(let k=N-1;k>0;k--) seq[k-1]=bk[k][seq[k]];
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
  return { fings, print, effort };
}
