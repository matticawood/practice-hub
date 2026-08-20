// Sight Reading Studio — shared engine: note model, validator, LilyPond emit.
// An EXERCISE: { grade, key, mode:'maj'|'min', flat:bool, time, tempo, partial?, rh:[note], lh:[note] }
// A NOTE: { m:int|int[], d:float(quarter-beats), fing?, dyn?, hp?('\\<'|'\\>'|'\\!'|'\\!\\>'), slur?('('|')'), art?('-.'|'--'|'->'), ferm?:true, rest?:true }
// art '--' is tenuto and 'ferm' a pause: both are Grade 4 additions (ABRSM introduces
// tenuto, the fermata and chromatic notes at Grade 4; no new keys or rhythms).

import { fingerHand, fingerHandDP } from './fingering.mjs';
import { gradeParams } from './grade-params.mjs';   // single source of truth for the per-grade chord-size cap

export const POS = { maj:[0,2,4,5,7], min:[0,2,3,5,7] };

const PC_SHARP=['c','cis','d','dis','e','f','fis','g','gis','a','ais','b'];
const PC_FLAT =['c','des','d','ees','e','f','ges','g','aes','a','bes','b'];
const LETTER={C:0,D:2,E:4,F:5,G:7,A:9,B:11};

export function nameToMidi(s){            // "E4","F#4","Bb3" -> midi
  const m=/^([A-Ga-g])([#b]?)(-?\d)$/.exec(s.trim()); if(!m) return null;
  let v=LETTER[m[1].toUpperCase()]+(m[2]==='#'?1:m[2]==='b'?-1:0);
  return v+(+m[3]+1)*12;
}
export function midiToName(m,flat){        // midi -> "E4"
  const pc=((m%12)+12)%12, oct=Math.floor(m/12)-1;
  const tbl=flat?['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']:['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  return tbl[pc]+oct;
}
export function midiToLy(m,flat){
  const pc=((m%12)+12)%12, oct=Math.floor(m/12)-1, t=oct-3;
  return (flat?PC_FLAT:PC_SHARP)[pc]+(t>=0?"'".repeat(t):",".repeat(-t));
}
const durLy=d=>({4:'1',3:'2.',2:'2',1.5:'4.',1:'4',0.75:'8.',0.5:'8',0.25:'16'})[d]||String(d);
// ---- notate a duration to the metre: split it into note-values that respect the bar's main
// division so nothing crosses it un-tied, and so every piece is a real note value. In common time
// (4/4) a note may not cross the HALFWAY mark (beat 3) unless it begins on the downbeat: a note that
// starts off the beat and spans the middle is written as tied notes that show beat 3 (Matthew's rule).
// Returns the ordered sub-durations; the caller ties them (notes) or lays them consecutively (rests).
const _DURS=[4,3,2,1.5,1,0.75,0.5,0.25];
const _rep=d=>({4:1,3:1,2:1,1.5:1,1:1,0.75:1,0.5:1,0.25:1})[d]!=null;
function notate(pos,d,barUnits,time){
  const crossings=[];
  if(time==='4/4' && pos>1e-9) crossings.push(2);          // the middle of a common-time bar (from off the downbeat)
  if(time==='6/8'){                                        // 6/8 divides into two dotted-crotchet beats. Any note that
    const fullBar = pos<1e-9 && Math.abs(d-barUnits)<1e-9; // crosses the mid-bar must tie across it EXCEPT the one
    if(!fullBar) crossings.push(1.5);                      // whole-bar value, a dotted minim (a plain minim is illegal here)
  }
  let segs=[[pos,d]];
  for(const b of crossings){ const out=[]; for(const [p,len] of segs){ const e=p+len;
    if(p<b-1e-9 && e>b+1e-9) out.push([p,b-p],[b,e-b]); else out.push([p,len]); } segs=out; }
  const out=[];
  for(let [p,len] of segs){
    if(_rep(len)){ out.push(len); continue; }              // already a single note value
    while(len>1e-9){ let v=_DURS.find(x=> x<=len+1e-9 && !crossings.some(b=> p<b-1e-9 && p+x>b+1e-9));
      if(v==null) v=len; out.push(v); p+=v; len-=v; }
  }
  return out;
}

// ---- grade parameters ----
export const GRADES = {
  2:{ bars:{'4/4':4,'3/4':4,'2/4':6}, fixedPosition:true, maxSpan:7 },
  3:{ bars:{'4/4':8,'3/4':8,'2/4':8,'3/8':8}, fixedPosition:false, maxSpan:15 },   // hand travels at G3+: the tune self-limits to an
  4:{ bars:{'4/4':8,'3/4':8,'2/4':8,'3/8':8,'6/8':8}, fixedPosition:false, maxSpan:17 }, // octave, but a moving oom-pah/arpeggio accompaniment spans a 10th+
};

// Fingering lives in fingering.mjs (an ergonomic DP grounded in the Parncutt/Hart literature
// plus scale/arpeggio convention), imported above and re-exported so callers can reach it here.
export { fingerHand, notate };

// interval in semitones -> diatonic degree span (a 3rd spans 2 degrees, a 5th 4, a 6th 5), used to derive
// the inner finger of a chord from the outer one the solver placed. Shared by the renderer and the resolver.
const _DEGSPAN={0:0,1:1,2:1,3:2,4:2,5:3,6:3,7:4,8:5,9:5,10:6,11:6,12:7};
// resolveHandFingers: the SINGLE source of truth for "what finger is actually shown on each note" — solver-derived
// or hand-set, single notes or per-chord-member. Returns per note: null (no finger shown) | a number (single note)
// | an array [f0,f1,...] in m-order (chord). The renderer (voice) AND the editor both read this, so what you see on
// a note always equals what the editor reports and what gets baked in on the first manual edit.
export function resolveHandFingers(notes, hand, fg){
  const hasManual = notes.some(n=>n.fing!=null);           // any hand-set finger -> show ONLY hand-set marks
  return notes.map((n,i)=>{
    if(n.rest) return null;
    const printFing = hasManual ? (n.fing!=null) : fg.print.has(i);
    if(!printFing) return null;
    if(Array.isArray(n.m)){
      const loN=Math.min(...n.m), hiN=Math.max(...n.m), dd=_DEGSPAN[Math.min(hiN-loN,12)] ?? 2;
      if(Array.isArray(n.fing)) return n.m.map((m,j)=> n.fing[j]==null?null:n.fing[j]);
      const outerF = hasManual ? n.fing : fg.fings[i];       // a single value -> derive the partner by the degree span
      let fTop, fBot; if(hand==='rh'){ fTop=outerF; fBot=outerF-dd; } else { fBot=outerF; fTop=outerF-dd; }
      if(!(fBot>=1&&fBot<=5&&fTop>=1&&fTop<=5)){              // no valid partner -> standard shape: thumb inner, spread outer
        if(hand==='rh'){ fBot=1; fTop=Math.min(5,1+dd); } else { fTop=1; fBot=Math.min(5,1+dd); }
      }
      return n.m.map(m => m===hiN?fTop : m===loN?fBot : null);
    }
    return hasManual ? n.fing : fg.fings[i];
  });
}
export function resolveFingering(ex){
  const LET={c:0,d:2,e:4,f:5,g:7,a:9,b:11};
  const tonicPc=((LET[ex.key[0]]+(ex.key[1]==='f'?-1:ex.key[1]==='s'?1:0))%12+12)%12;
  const scalePcs=(ex.mode==='min'?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11]).map(x=>(tonicPc+x)%12);
  return { rh: resolveHandFingers(ex.rh,'rh',fingerHandDP(ex.rh,'rh',scalePcs)),
           lh: resolveHandFingers(ex.lh,'lh',fingerHandDP(ex.lh,'lh',scalePcs)) };
}

// ---- validator ----
export function validate(ex){
  const g=GRADES[ex.grade]; const probs=[], warns=[];   // probs=hard errors (block), warns=stylistic (inform)
  const [top,bottom]=ex.time.split('/').map(Number);
  const barUnits=(top/bottom)*4;            // bar length in quarter-beats (4/4=4, 6/8=3, 3/8=1.5)
  const expBars=g.bars[ex.time];
  const tl=seq=>{let t=0,o=[];for(const n of seq){o.push({...n,t});t+=n.d;}return o;};
  const RH=tl(ex.rh), LH=tl(ex.lh);
  const lo=n=>Array.isArray(n.m)?Math.min(...n.m):n.m, hi=n=>Array.isArray(n.m)?Math.max(...n.m):n.m;
  const sound=(a,t)=>{let c=null;for(const n of a){if(n.t<=t+1e-9)c=n;else break;}return c;};
  const onsets=[...new Set([...RH,...LH].map(n=>n.t))].sort((a,b)=>a-b);
  const bb=t=>`b${Math.floor((t+ (ex.partial||0))/barUnits)+1}.${+(((t+(ex.partial||0))%barUnits)/(barUnits/top)+1).toFixed(2)}`;
  // bar count + bar fill
  const partial=ex.partial||0;
  const tot=RH.at(-1).t+RH.at(-1).d - partial;
  if(Math.round(tot/barUnits*100)/100!==expBars) probs.push(`length ${(tot/barUnits).toFixed(2)} bars, Grade ${ex.grade} ${ex.time} wants ${expBars}`);
  for(const [s,nm] of [[ex.rh,'RH'],[ex.lh,'LH']]){let a=0;s.forEach(n=>a+=n.d);if(Math.round((a-partial)/barUnits*100)/100!==expBars)probs.push(`${nm} total beats off`);}
  // grade cap on simultaneous notes per hand: Grade 2 is a single line; Grade 3/4 allow at most a 2-note chord
  { const maxNotes = gradeParams(ex.grade).chordMax ?? (ex.grade<=2 ? 1 : 2);   // read gp.chordMax, not a hard-coded grade number (was `grade<=2?1:2` - drifted from gp at grade 8)
    for(const [s,nm] of [[ex.rh,'RH'],[ex.lh,'LH']]) for(const n of s)
      if(!n.rest && Array.isArray(n.m) && n.m.length>maxNotes) probs.push(`${nm}: ${n.m.length}-note chord exceeds Grade ${ex.grade} (max ${maxNotes})`); }
  // rhythm must be readable: clean durations, and sub-beat notes may not cross a beat boundary
  const beatLen=(bottom===8 && top%3===0)?1.5:1;        // compound beat = dotted-crotchet
  const OKDUR=new Set([0.25,0.5,0.75,1,1.5,2,3,4,6]);
  for(const [seq,nm] of [[ex.rh,'RH'],[ex.lh,'LH']]){ let t=partial?barUnits-partial:0;
    for(const n of seq){ if(!OKDUR.has(n.d) && !n.tup) probs.push(`${nm}: unreadable note value (${n.d})`);   // triplet (tup) notes are 1/3 durations, rendered as \tuplet 3/2 — legitimate
      const w=((t%barUnits)+barUnits)%barUnits, end=w+n.d;
      if(!n.tup && n.d<beatLen-1e-9 && Math.floor(w/beatLen+1e-9)!==Math.floor((end-1e-9)/beatLen))
        probs.push(`${nm}: rhythm crosses a beat (note ${n.d} starting ${w.toFixed(2)} into the bar)`);
      t+=n.d; }
  }
  // range / fingering
  function fingerOf(hand,tl,nm){
    const notes=tl.filter(n=>!n.rest && n.m!=null);            // rests have no pitch: lo/hi return undefined -> NaN, which silently defeated the span check (a hand with any rest bypassed it entirely)
    if(!notes.length) return hand==='rh'?1:5;
    const mins=notes.map(lo), maxs=notes.map(hi); const lowest=Math.min(...mins), highest=Math.max(...maxs);
    if(g.fixedPosition){
      // FIVE-FINGER POSITION, measured as a composer/player thinks: FIVE FINGERS on five adjacent scale-degrees. A
      // chromatic (the raised leading tone) is an INFLECTION of a finger's note - the hand hasn't moved - so it counts as
      // its BASE scale-degree, not as widening the hand. So the constraint is the DIATONIC span (<=4 degrees = 5 fingers),
      // NOT the raw semitone span (which miscounted a leading tone as leaving the position, and forced the generator to
      // fight the harmonic minor). A note an OCTAVE out is a different degree entirely, so it is still caught.
      const LET={c:0,d:2,e:4,f:5,g:7,a:9,b:11};
      const tpc=(((LET[(ex.key||'c')[0]]??0)+((ex.key||'')[1]==='f'?-1:(ex.key||'')[1]==='s'?1:0))%12+12)%12;
      const sc=(ex.mode==='min')?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];
      const dIdx=p=>{ const rel=(((p-tpc)%12)+12)%12; let d=0; for(let i=0;i<7;i++) if(sc[i]<=rel) d=i; return 7*Math.floor((p-tpc)/12)+d; };
      const di=notes.flatMap(n=>Array.isArray(n.m)?n.m.map(dIdx):[dIdx(n.m)]);
      const dspan=Math.max(...di)-Math.min(...di);
      if(dspan>4) probs.push(`${nm}: five-finger position exceeded (${dspan+1} scale-degrees span the hand, max 5)`);
    } else if(highest-lowest>g.maxSpan) probs.push(`${nm}: range ${highest-lowest} semis > ${g.maxSpan} (too wide for the grade)`);
    const first=notes[0]; const fnote=hand==='rh'?lo(first):lo(first);
    if(g.fixedPosition){
      // a five-finger position may sit on ANY degree of the key. The span check above guarantees it fits one
      // hand; the exact starting finger is supplied by the generator (ex.rhFinger/ex.lhFinger). Here we only
      // need a best-effort fallback, so place the finger by the first note's position within the span.
      const idx = Math.max(0, Math.min(4, Math.round((fnote-lowest)/Math.max(1,highest-lowest)*4)));
      return hand==='rh'?idx+1:5-idx;
    } else {
      // grade 3/4: only a plausible STARTING finger (passage may shift)
      const span=fnote-lowest;
      if(hand==='rh') return Math.min(5,Math.max(1,Math.round(span/2)+1));
      return Math.min(5,Math.max(1,5-Math.round((fnote-lowest)/2)));
    }
  }
  const rhFc=fingerOf('rh',RH,'RH'), lhFc=fingerOf('lh',LH,'LH'); // always run (does the range/position checks)
  const rhF = ex.rhFinger ?? rhFc, lhF = ex.lhFinger ?? lhFc;     // prefer the generator's exact finger
  // parallels + clashes (outer voices: RH top vs LH bottom)
  // Three harmony rules live here alongside the clash check. They are WARNINGS, so
  // they never block approval, but generate() scores against them, so its rejection
  // sampling now selects for harmonic sense rather than mere legality:
  //   1. beats should be consonant  2. never leap into a dissonance  3. no 6/4 on a downbeat
  const CONSONANT = new Set([0,3,4,7,8,9]);        // unison, 3rds, 5th, 6ths, octave
  const IVNAME = {1:'m2',2:'M2/9th',5:'P4',6:'tritone',10:'m7',11:'M7'};
  const prevIn = (arr, n, pick) => { const i=arr.indexOf(n); const q=i>0?arr[i-1]:null;
    return (!q || q.rest) ? null : Math.abs(pick(n)-pick(q)); };
  let p=null;
  for(const t of onsets){ const rn=sound(RH,t), ln=sound(LH,t); if(!rn||!ln||rn.rest||ln.rest){p=null;continue;}
    const a=hi(rn), b=lo(ln), s=((a-b)%12+12)%12;
    if(p){const mv=(a!==p.a)&&(b!==p.b), sd=Math.sign(a-p.a)===Math.sign(b-p.b);
      if(mv&&sd&&s===p.s&&(s===7||s===0)) warns.push(`parallel ${s===7?'5th':'8ve'} ${bb(p.t)}->${bb(t)} (stylistic, not an ABRSM rule)`);}
    if(s===1||s===2||s===11) warns.push(`clash (${['','m2','M2/9th','','','','','','','','','M7'][s]}) at ${bb(t)}`);
    const pos = t + partial;                        // position measured from the barline
    const onBeat   = Math.abs(pos % beatLen) < 1e-9;
    const onDownbeat = Math.abs(pos % barUnits) < 1e-9;
    if(onBeat && !CONSONANT.has(s))
      warns.push(`dissonance (${IVNAME[s]||s}) on the beat at ${bb(t)}`);
    if(onDownbeat && s===5)
      warns.push(`6/4 on the downbeat at ${bb(t)} (bare 4th above the bass)`);
    if(!CONSONANT.has(s)){
      const rMove = rn.t===t ? prevIn(RH,rn,hi) : null;
      const lMove = ln.t===t ? prevIn(LH,ln,lo) : null;
      if((rMove!=null && rMove>2) || (lMove!=null && lMove>2))
        warns.push(`leap into a dissonance (${IVNAME[s]||s}) at ${bb(t)}`);
    }
    p={t,a,b,s};
  }
  // articulation must match between hands when they share a beat AND a duration
  const rmap=new Map(RH.map(n=>[n.t,n])), lmap=new Map(LH.map(n=>[n.t,n]));
  for(const t of onsets){ const r=rmap.get(t), l=lmap.get(t); if(r&&l&&r.d===l.d){
    const ra=r.art||'', la=l.art||''; if(ra!==la && (ra==='-.'||la==='-.')) warns.push(`articulation mismatch at ${bb(t)} (staccato on one hand only)`); } }
  // staccato only on short notes (hard: contradictory notation)
  for(const [s,nm] of [[ex.rh,'RH'],[ex.lh,'LH']]) s.forEach((n,i)=>{ if(n.art==='-.'&&n.d>1) probs.push(`${nm} note ${i+1}: staccato on a long note`); });
  if(![...ex.rh,...ex.lh].some(n=>n.dyn)) warns.push('no dynamic marking');
  // the MELODIC line should genuinely move — checked on whichever hand is the melody (either may carry it)
  const pitches = s => s.filter(n=>!n.rest).map(n=>Array.isArray(n.m)?n.m[0]:n.m);
  const rhP=pitches(ex.rh), lhP=pitches(ex.lh);
  const rng = a => a.length? Math.max(...a)-Math.min(...a) : 0;
  const melDistinct=Math.max(new Set(rhP).size, new Set(lhP).size), melRange=Math.max(rng(rhP), rng(lhP));
  if(melDistinct<4) warns.push(`melody static (${melDistinct} distinct pitches)`);
  if(melRange<5) warns.push(`melody range narrow (${melRange} semis)`);
  return { ok:probs.length===0, errors:probs, warnings:warns, problems:[...probs,...warns], rhF, lhF };
}

// ---- LilyPond ----
export function toLily(ex, withNumber=true, sink=null){
  const v=validate(ex);
  const mode=ex.mode==='maj'?'major':'minor';
  const key=ex.key.length>1 ? ex.key[0]+(ex.key[1]==='f'?'es':ex.key[1]==='s'?'is':ex.key[1]) : ex.key; // bf->bes, ef->ees
  // The raised leading tone of a minor key is ALWAYS a sharp/natural, never a flat of
  // the tonic's letter (G minor -> F#, never Gb; D minor -> C#, never Db). Compute its
  // pitch class from the key so it spells right regardless of whether a note was tagged.
  const _LET={c:0,d:2,e:4,f:5,g:7,a:9,b:11};
  const tonicPc = ((_LET[ex.key[0]] + (ex.key[1]==='f'?-1:ex.key[1]==='s'?1:0))%12+12)%12;
  const leadingPc = ex.mode==='min' ? (tonicPc+11)%12 : -1;
  // Sharp spelling when: the note is tagged as raised, OR it is the leading-tone pitch
  // class of a minor key (where a flat spelling would be an enharmonic misspelling).
  // per-member accidental: n.alt may be a scalar (single note / whole event) or an array aligned to n.m (one per chord member)
  const sp = (m,n,j) => { const a = Array.isArray(n.alt) ? n.alt[j] : n.alt;
    return midiToLy(m, a==='b' ? true : (a==='#' || (((m%12)+12)%12)===leadingPc) ? false : ex.flat); };
  const noteLy=n=>{
    if(n.rest) return 'r'+durLy(n.d);
    const pitch=Array.isArray(n.m)? '<'+n.m.map((m,j)=>sp(m,n,j)).join(' ')+'>' : sp(n.m,n);
    return pitch+durLy(n.d);
  };
  const [_top,_bot]=ex.time.split('/').map(Number); const barUnits=(_top/_bot)*4;
  // the diatonic scale (pitch classes) so the fingerer reasons in SCALE DEGREES, not raw semitones
  const scalePcs=(ex.mode==='min'?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11]).map(x=>(tonicPc+x)%12);
  const rhFg=fingerHandDP(ex.rh,'rh',scalePcs), lhFg=fingerHandDP(ex.lh,'lh',scalePcs);
  // voice() emits a staff's note stream. When `sink` (an array) is passed, it also records, per emitted
  // token, the note's index + column span WITHIN the returned string (and per-chord-member pitch offsets),
  // so a rendered notehead can be mapped back to the exact data note. The emitted string is unchanged.
  const voice=(tl,fg,hand,sink)=>{
    const resolved = resolveHandFingers(tl, hand, fg);         // the fingers actually shown (shared with the editor)
    let acc = ex.partial ? (barUnits - ex.partial) : 0;       // bar position of the first note (after any anacrusis)
    const toks=[], meta=[]; let tripN=0;
    tl.forEach((n,i)=>{
      const pos = ((acc%barUnits)+barUnits)%barUnits; acc += n.d;
      // TRIPLET note (n.tup): an eighth-triplet, written as an eighth, wrapped \tuplet 3/2 { } in groups of 3.
      if(n.tup){ const gi=tripN%3; tripN++; const rf=resolved[i];
        const pit = n.rest ? 'r' : (Array.isArray(n.m)?'<'+n.m.map((m,j)=>sp(m,n,j)).join(' ')+'>' : sp(n.m,n));
        let tk = pit+'8'; if(!n.rest){ if(rf!=null&&!Array.isArray(n.m)) tk+='-'+rf; if(n.art) tk+=n.art; }
        if(gi===0) tk='\\tuplet 3/2 { '+tk; if(gi===2) tk=tk+' }';
        toks.push(tk); meta.push({index:i,kind:n.rest?'rest':'note',members:null}); return; }
      tripN=0;
      const durs = notate(pos, n.d, barUnits, ex.time);       // metre-correct note values (tied when >1)
      if(n.rest){ toks.push(durs.map(d=>'r'+durLy(d)).join(' ')); meta.push({index:i,kind:'rest',members:null}); return; }  // rests are laid consecutively, not tied
      const rf = resolved[i];                                 // null | number (single) | array (per chord member)
      const pitchPlain = Array.isArray(n.m) ? '<'+n.m.map((m,j)=>sp(m,n,j)).join(' ')+'>' : sp(n.m,n);
      let pitchFing = pitchPlain, fingStr = '';
      let memStrs = Array.isArray(n.m) ? n.m.map((m,j)=>sp(m,n,j)) : null;   // the exact per-member strings emitted inside < >
      if(Array.isArray(n.m) && Array.isArray(rf) && rf.some(x=>x!=null)){
        memStrs = n.m.map((m,j)=>sp(m,n,j)+(rf[j]?'-'+rf[j]:'')); pitchFing = '<'+memStrs.join(' ')+'>';
      } else if(!Array.isArray(n.m) && rf!=null){
        fingStr = '-'+rf;                                     // single note: one finger appended after the pitch
      }
      // per-member pitch-letter offsets within the token (the token begins with pitchFing at offset 0)
      let members=null;
      if(Array.isArray(n.m)){ members=[]; let off=1; n.m.forEach((m,j)=>{ const plain=sp(m,n,j); members.push({member:j, c0:off, c1:off+plain.length}); off += memStrs[j].length + 1; }); }
      const out = durs.map((d,k)=>{ let s=(k===0?pitchFing:pitchPlain)+durLy(d);
        if(k===0){ if(fingStr)s+=fingStr; if(n.art)s+=n.art; if(n.slur==='(')s+='('; }   // dynamics/hairpins go in the Dynamics context (centred between the staves), not on the note
        if(k===durs.length-1){ if(n.ferm)s+='\\fermata'; if(n.slur===')')s+=')'; }
        if(k<durs.length-1) s+=' ~';                          // tie into the next sub-note
        return s; }).join(' ') + (n.ti ? ' ~' : '');           // n.ti: tie this note into the NEXT note (a real suspension held over the beat/bar)
      toks.push(out); meta.push({index:i, kind:'note', members});
    });
    if(sink){ let col=0; toks.forEach((t,k)=>{ const mm=meta[k]; sink.push({index:mm.index, kind:mm.kind, c0:col, c1:col+t.length,
      members: mm.members ? mm.members.map(x=>({member:x.member, c0:col+x.c0, c1:col+x.c1})) : null }); col += t.length + 1; }); }
    return toks.join(' '); };
  const partial = ex.partial? `\\partial ${durLy(ex.partial)} ` : '';
  const name = withNumber? `\\set PianoStaff.instrumentName = \\markup \\bold \\large "${ex.n||''}"` : '';
  // The DYNAMICS line: a skip-rhythm carrying only the dynamics + hairpins, placed in its own Dynamics context
  // BETWEEN the two staves so it engraves centred (not glued under the top staff) and clear of the stems. The
  // default elastic spacing then opens the staff gap only where the dynamics actually need room.
  const dynSink = sink ? [] : null;
  // Dynamics + hairpins engrave as ONE centred line between the staves, but the user may author them on EITHER
  // hand. MERGE both hands by time position so adding a dynamic to one hand never hides the ones on the other
  // (Matthew's bug). Each merged marker keeps the REAL hand + note index so click-to-edit still points at its note.
  const _total = ex.rh.reduce((s,n)=>s+n.d,0) || ex.lh.reduce((s,n)=>s+n.d,0);
  const _evs = new Map();                                          // absolute start -> {dyn,hp,dHand,dIndex}
  for(const [hand,arr] of [['rh',ex.rh],['lh',ex.lh]]){ let t=0;
    for(let i=0;i<arr.length;i++){ const n=arr[i];
      if(n.dyn||n.hp){ const e=_evs.get(t)||{}; if(n.dyn&&!e.dyn){ e.dyn=n.dyn; e.dHand=hand; e.dIndex=i; } if(n.hp&&!e.hp){ e.hp=n.hp; if(e.dHand==null){ e.dHand=hand; e.dIndex=i; } } _evs.set(t,e); }
      t+=n.d; } }
  const _bounds=[...new Set([0,..._evs.keys()])].sort((a,b)=>a-b);
  const dynMerged=[];
  for(let k=0;k<_bounds.length;k++){ const st=_bounds[k], en=k+1<_bounds.length?_bounds[k+1]:_total;
    if(en-st<=1e-9) continue; const e=_evs.get(st);
    dynMerged.push({ d:en-st, dyn:e&&e.dyn, hp:e&&e.hp, _hand:e&&e.dHand, _index:e?e.dIndex:undefined }); }
  const dynLine = (tl,dsink) => { let acc = ex.partial ? (barUnits - ex.partial) : 0; const out=[], meta=[];
    tl.forEach((n)=>{ const pos=((acc%barUnits)+barUnits)%barUnits; acc+=n.d;
      notate(pos,n.d,barUnits,ex.time).forEach((d,k)=>{ let s='s'+durLy(d); if(k===0){ if(n.dyn)s+='\\'+n.dyn; if(n.hp)s+=n.hp; } out.push(s); if(k===0)meta.push({dHand:n._hand,index:n._index,has:!!(n.dyn||n.hp)}); else meta.push(null); }); });
    if(dsink){ let col=0; out.forEach((t,k)=>{ if(meta[k]&&meta[k].has) dsink.push({index:meta[k].index, dynHand:meta[k].dHand, kind:'dyn', c0:col, c1:col+t.length, members:null}); col+=t.length+1; }); }
    return out.join(' '); };
  const hasDyn = dynMerged.some(n=>n.dyn||n.hp);
  const dynVoiceStr = hasDyn ? dynLine(dynMerged, dynSink) : '';
  const dynCtx = hasDyn ? `\\new Dynamics { ${partial}${dynVoiceStr} }` : '';
  const rhSink = sink ? [] : null, lhSink = sink ? [] : null;
  const rhVoiceStr = voice(ex.rh,rhFg,'rh',rhSink);
  const lhVoiceStr = voice(ex.lh,lhFg,'lh',lhSink);
  if(sink){ sink.rh=rhSink; sink.lh=lhSink; sink.dyn=dynSink||[];
    sink.rhStr=rhVoiceStr; sink.lhStr=lhVoiceStr; sink.dynStr=dynVoiceStr; }
  return `\\score {
  \\new PianoStaff <<
    ${name}
    \\new Staff { \\set fingeringOrientations = #'(up) \\tempo "${ex.tempo}" \\key ${key} \\${mode} \\time ${ex.time} ${partial}${rhVoiceStr} \\bar "|." }
    ${dynCtx}
    \\new Staff { \\clef bass \\set fingeringOrientations = #'(down) \\override Fingering.direction = #DOWN \\override Fingering.staff-padding = #1.4 \\key ${key} \\${mode} \\time ${ex.time} ${partial}${lhVoiceStr} \\bar "|." }
  >>
}`;
}

// Build the full LilyPond document AND a note-map that ties each rendered notehead/rest/dynamic back to its
// data note. Returns { ly, notemap } where notemap[] = { hand:'rh'|'lh'|'dyn', index, kind, line, c0, c1, members }.
// line/c0/c1 match LilyPond's point-and-click textedit columns (1-based line, 0-based char columns).
export function lilyWithMap(ex, staffSize=20){
  const sink={};
  const score = toLily({...ex, n:ex.n||''}, true, sink);
  const ly = lilyDoc(score, staffSize);
  // char offset -> {line, col}: line is 1-based, col is the 0-based char offset within that line
  const lineStarts=[0]; for(let i=0;i<ly.length;i++){ if(ly[i]==='\n') lineStarts.push(i+1); }
  const lc = off => { let lo=0, hi=lineStarts.length-1; while(lo<hi){ const mid=(lo+hi+1)>>1; if(lineStarts[mid]<=off) lo=mid; else hi=mid-1; } return { line:lo+1, col:off-lineStarts[lo] }; };
  const notemap=[];
  const place = (hand, spans, voiceStr) => { if(!spans||!spans.length) return; const base=ly.indexOf(voiceStr); if(base<0) return;
    for(const s of spans){ const p=lc(base+s.c0), q=lc(base+s.c1);
      notemap.push({ hand, index:s.index, kind:s.kind, dynHand:s.dynHand, line:p.line, c0:p.col, c1:(q.line===p.line?q.col:p.col+ (s.c1-s.c0)),
        members: s.members ? s.members.map(m=>{ const a=lc(base+m.c0); return { member:m.member, c0:a.col, c1:a.col+(m.c1-m.c0) }; }) : null }); } };
  place('rh', sink.rh, sink.rhStr);
  place('lh', sink.lh, sink.lhStr);
  place('dyn', sink.dyn, sink.dynStr);   // each printed dynamic already carries its own dynHand (merged from both hands)
  return { ly, notemap };
}

// ---- editable text format ----
// token: PITCH[:DUR][marks]   PITCH: E4 | F#4 | Bb3 | C4+E4 (chord) | R (rest)
// marks: . staccato  _ tenuto  ^ accent  ( slur-start  ) slur-end
//        < cresc-start  > dim-start  ! hairpin-end  !> end+dim  {mp} dynamic
export function serializeHand(notes, flat, barUnits){
  let out=[], t=0;
  for(const n of notes){
    let tok;
    if(n.rest) tok='R';
    else { const nm=(m,j)=>{ const a=Array.isArray(n.alt)?n.alt[j]:n.alt; return midiToName(m, a==='#'?false:flat); }; tok = Array.isArray(n.m)? n.m.map(nm).join('+') : nm(n.m); }
    if(n.d!==1) tok+=':'+n.d;
    if(n.dyn) tok+='{'+n.dyn+'}';
    if(n.art) tok+=({'-.':'.', '--':'_', '->':'^'})[n.art]||'';
    if(n.hp) tok+=({'\\<':'<','\\>':'>','\\!':'!','\\!\\>':'!>'})[n.hp]||'';
    if(n.slur) tok+=n.slur;
    out.push(tok);
    t+=n.d; if(barUnits && Math.abs(t%barUnits)<1e-9) out.push('|');
  }
  return out.join(' ').replace(/\s*\|\s*$/,'');
}
export function parseHand(text){
  const toks=text.replace(/\|/g,' ').split(/\s+/).filter(Boolean), notes=[];
  for(const tok of toks){
    const n={};
    // pitch (read first so its digits/accidentals aren't mistaken for marks)
    const pm=/^(R|r|[A-Ga-g][#b]?-?\d(?:\+[A-Ga-g][#b]?-?\d)*)/.exec(tok);
    if(!pm) throw new Error('bad token: '+tok);
    const pitch=pm[1]; let rest=tok.slice(pm[0].length);
    // duration (consume the decimal so its '.' is not a staccato mark)
    let dur=1;
    if(rest[0]===':'){ const dm=/^:([0-9]*\.?[0-9]+)/.exec(rest); if(!dm) throw new Error('bad duration in: '+tok); dur=parseFloat(dm[1]); rest=rest.slice(dm[0].length); }
    n.d=dur;
    if(pitch==='R'||pitch==='r') n.rest=true;
    else { const ms=pitch.split('+').map(p=>nameToMidi(p)); if(ms.some(x=>x==null)) throw new Error('bad pitch: '+pitch); n.m=ms.length>1?ms:ms[0]; }
    // marks (what remains after pitch+duration)
    const dyn=/\{([a-z]+)\}/.exec(rest); if(dyn){ n.dyn=dyn[1]; rest=rest.replace(dyn[0],''); }
    if(rest.includes('!>')){ n.hp='\\!\\>'; }
    else if(rest.includes('!')) n.hp='\\!';
    else if(rest.includes('<')) n.hp='\\<';
    else if(rest.includes('>')) n.hp='\\>';
    if(rest.includes('.')) n.art='-.'; else if(rest.includes('_')) n.art='--'; else if(rest.includes('^')) n.art='->';
    if(rest.includes('(')) n.slur='('; else if(rest.includes(')')) n.slur=')';
    notes.push(n);
  }
  return notes;
}

export function lilyDoc(scores, staffSize=18){
  return `\\version "2.24.0"
\\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\\mm }
#(set-global-staff-size ${staffSize})
${[].concat(scores).join('\n\\markup \\vspace #1.5\n')}
`;
}
