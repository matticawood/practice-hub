// Conventionality audit — a battery of OBJECTIVE checks over generated pieces, generator-wide.
// The point (Matthew, 2026-08-07): stop relying on the eye. Each check scans EVERY piece and
// surfaces every instance of an issue class, so nothing depends on spotting it by ear. Each check
// must be VALIDATED (sample its flags, kill false positives) before it is trusted — a measure that
// over-flags is worse than no measure. Checks read the generator's OWN intent (_prog, _ct, _char,
// _scheme) where available, so we can compare what the generator MEANT against what the notes SOUND.

const LET = { c:0, d:2, e:4, f:5, g:7, a:9, b:11 };
export function tonicPC(ex){
  const l = LET[ex.key[0]] ?? 0;
  const acc = ex.key[1]==='f' ? -1 : ex.key[1]==='s' ? 1 : 0;
  return (((l+acc)%12)+12)%12;
}
const pc = m => (((m%12)+12)%12);
// timeline: absolute onset time (in quarter units) for each note of a hand
export function tl(hand){ let t=0, o=[]; for(const n of hand){ o.push({...n, t}); t+=n.d; } return o; }
export function barUnit(ex){ const [a,b]=ex.time.split('/').map(Number); return (a/b)*4; }
export function beatLen(ex){ const [top,bottom]=ex.time.split('/').map(Number); return (bottom===8&&top%3===0)?1.5:1; }
const pcsOf = n => Array.isArray(n.m) ? n.m.map(pc) : [pc(n.m)];

// ── CHECK A: minor leading-tone ────────────────────────────────────────────────────────────────
// A minor piece should raise ^7 to the leading tone under dominant harmony and at the final cadence
// (harmonic/melodic minor). A piece that NEVER raises ^7 anywhere is pure natural minor — modal, and
// (at these grades, for a tonal exercise) a gap: the dominant has no pull home. We measure two things:
//   1. degree7Events: places where ^7 (natural, degree = tonic+10) sounds under DOMINANT-function harmony
//      (the bar's chord is V/v, per _prog) — each such natural (un-raised) ^7 is a miss.
//   2. finalCadence: does the penultimate dominant (if any) carry a raised ^7 (leading tone) in either hand?
// Returns per-piece: {natural7UnderDom, raised7Total, cadenceHasLeadingTone, verdict}.
const DOMINANT_RN = new Set(['V','V7','v','V/V','viio','vii']);
// operativeChord(ex, t): the chord actually SOUNDING at time t, honouring a mid-bar change (_prog2/_changePos).
export function operativeChord(ex, t){
  const bU = ex._barU || barUnit(ex);
  const bar = Math.floor(t/bU + 1e-9);
  const prog = ex._prog||[], prog2 = ex._prog2||[], chg = ex._changePos||[];
  if(prog2[bar]!=null && (t - bar*bU) >= (chg[bar]-1e-9)) return prog2[bar];
  return prog[bar];
}
// CHECK A — minor leading-tone, measured with LOW false positives.
//   • cadenceHasLeadingTone: does the final perfect/authentic cadence (penultimate dominant -> final tonic) PRESENT the
//     leading tone (raised ^7) in either hand? This is the cleanest, highest-signal measure of a functioning minor.
//   • everRaises: does the piece raise ^7 anywhere (else it is pure natural minor — modal)?
//   • crossRelation: a TRUE fault — natural ^7 and raised ^7 sounding SIMULTANEOUSLY in different voices under one chord,
//     or a natural ^7 immediately following a raised ^7 in the same line (a chromatic contradiction, not the fine ^7-^7#-^1
//     ascent). Fleeting off-beat natural ^7s and melodic-minor descents are NOT flagged — they are idiomatic.
export function minorLeadingTone(ex){
  if(ex.mode!=='min') return null;
  const t = tonicPC(ex);
  const nat7 = (t+10)%12, lead = (t+11)%12;
  const prog = ex._prog || [];
  const bU = ex._barU || barUnit(ex);
  const nbars = prog.length || Math.ceil((tl(ex.rh).at(-1).t + tl(ex.rh).at(-1).d)/bU);
  let raisedTotal=0;
  for(const [,arr] of [['rh',ex.rh],['lh',ex.lh]]) for(const n of tl(arr)){ if(n.rest) continue;
    if(pcsOf(n).includes(lead)) raisedTotal++; }
  // final cadence leading tone: last bar (the resolution) or the dominant just before it
  let cadenceLead=false;
  for(const [,arr] of [['rh',ex.rh],['lh',ex.lh]]) for(const n of tl(arr)){ if(n.rest) continue;
    const bar=Math.floor(n.t/bU+1e-9); if(bar>=nbars-2 && pcsOf(n).includes(lead)) cadenceLead=true; }
  // simultaneous cross-relation: at any onset, one hand sounds nat7 while the other sounds the leading tone
  let crossSim=0;
  const RH=tl(ex.rh), LH=tl(ex.lh);
  const sound=(a,tt)=>{let c=null;for(const n of a){if(n.t<=tt+1e-9)c=n;else break;}return c;};
  const onsets=[...new Set([...RH,...LH].map(n=>+n.t.toFixed(6)))].sort((a,b)=>a-b);
  for(const tt of onsets){ const r=sound(RH,tt), l=sound(LH,tt); if(!r||!l||r.rest||l.rest) continue;
    const rp=pcsOf(r), lp=pcsOf(l);
    if((rp.includes(nat7)&&lp.includes(lead))||(rp.includes(lead)&&lp.includes(nat7))) crossSim++; }
  const isPerfectEnd = (ex._fc||'perfect')==='perfect';
  const verdict = (isPerfectEnd && !cadenceLead) ? 'MODAL CADENCE: perfect cadence has no leading tone'
                : (raisedTotal===0 ? 'flat: never raises ^7 anywhere' : 'ok');
  return { raisedTotal, cadenceHasLeadingTone: cadenceLead, crossSim, fc: ex._fc||'perfect', prog, verdict };
}

// chordPCs(roman, tonicPC, mode): the pitch-classes of a diatonic triad named by roman numeral, mirroring the
// generator's _triPCs (incl. the minor-dominant raised leading tone). Used to judge realization against intent.
const DEG_OF_ROMAN = { i:0,I:0, ii:1,'ii°':1, iii:2,III:2, iv:3,IV:3, v:4,V:4,V7:4, vi:5,VI:5, vii:6,'vii°':6,VII:6 };
const KEYSCALE = { maj:[0,2,4,5,7,9,11], min:[0,2,3,5,7,8,10] };
export function chordPCs(roman, tonicPC, mode){
  if(roman==null) return null;
  if(roman==='V/V'){ // secondary dominant of V: built on ^2 with a raised ^4 — supertonic, raised subdominant, dominant
    return [ (tonicPC+2)%12, (tonicPC+6)%12, (tonicPC+9)%12 ]; }
  const r = DEG_OF_ROMAN[roman]; if(r==null) return null;
  const sc = KEYSCALE[mode];
  const isDom = (roman==='V'||roman==='V7'||roman==='v'||roman==='V/V');
  const domMin = mode==='min' && (roman==='v'||roman==='V'||roman==='V7');
  const out=[];
  for(const dg of [r,(r+2)%7,(r+4)%7]){ let s=sc[dg]; if(domMin && dg===6) s+=1; out.push((((tonicPC+s)%12)+12)%12); }
  // The generator voices a dominant 7th on resolving dominants (the b7 above the root), so it is a real chord tone of any
  // dominant, never mud - include it for V/v/V7/V-of-V so the coherence check doesn't flag a sounded 7th.
  if(isDom) out.push((out[0]+10)%12);
  return out;
}
// ── CHECK B: harmony coherence (chord-span coverage) ─────────────────────────────────────────────
// The ex14 class ("the harmony sounds wrong / unclear") is, at root, a chord SPAN over which the operative chord is never
// actually stated — no note anywhere in its stretch is a chord tone, so the ear has no chord to hold and the sonority
// reads as mud. Measured per span (a whole bar, or a half-bar where a mid-bar change splits it), which is robust to WHERE
// in the span the chord lands: a chord articulated late (an anacrustic bass, a rest on the downbeat, a suspension) still
// counts as stated. Only a span with ZERO chord tones is flagged - unambiguous mud, not decoration or inversion. The
// final bar is excluded (its downbeat is the cadence's compressed V->I, which _prog labels as the tonic; the cadence has
// its own checks). Doubling (parallel 10ths) is out of scope - its lower line is a consonant shadow, not a functional part.
export function harmonyCoherence(ex){
  if(!ex._prog) return [];
  if(ex._dbl==='double') return [];                                // parallel-10ths doubling has no functional bass line — out of scope
  if(ex._anac && ex._anac!=='downbeat') return [];                 // a pickup offsets the barline grid unreliably vs the per-bar _prog index — out of scope (verified: the flags it produced were grid-misalignment, not real mud). Covers the standard downbeat-start textures where the fault lives.
  const t = tonicPC(ex), bU = ex._barU || barUnit(ex), bl = beatLen(ex);
  const anacOff = 0;
  const RH=tl(ex.rh), LH=tl(ex.lh);
  const chg=ex._changePos||[], prog2=ex._prog2||[];
  const nbars = ex._prog.length;
  // pitch-classes of every note whose ONSET falls in [a,b)
  const pcsIn=(a,b)=>{ const out=[]; for(const arr of [RH,LH]) for(const n of arr){ if(n.rest) continue; if(n.t>=a-1e-9 && n.t<b-1e-9) pcsOf(n).forEach(p=>out.push(p)); } return out; };
  const spans=[];
  for(let bar=0; bar<nbars-1; bar++){ const base=bar*bU+anacOff;
    if(chg[bar] && prog2[bar]!=null){ spans.push([base, base+chg[bar], ex._prog[bar], bar]); spans.push([base+chg[bar], base+bU, prog2[bar], bar]); }
    else spans.push([base, base+bU, ex._prog[bar], bar]);
  }
  const out=[];
  for(const [a,b,roman,bar] of spans){
    if(a<-1e-9) continue;
    const cs=chordPCs(roman,t,ex.mode); if(!cs) continue;
    const pcs=pcsIn(a,b); if(!pcs.length) continue;                 // nothing sounds in the span (a rest bar) - not a harmony fault
    if(pcs.some(p=>cs.includes(p))) continue;                       // the chord IS stated somewhere in its span - coherent
    out.push({ bar: bar+1, beat:+(((a-anacOff)%bU)/bl+1).toFixed(2), chord:roman,
               soundingPCs:[...new Set(pcs)], chordPCs:cs, note:'operative chord never stated across its span (mud)' });
  }
  return out;
}

// ── CHECK C: rhythm consistency (the ex12 one-off gesture) ───────────────────────────────────────
// Matthew's ex12: an eighth note clipped by an eighth rest that appears ONCE and never recurs, reading as a mistake. A
// CLIP = a note immediately followed by a rest WITHIN one beat (the note chopped short). The generator's own rule is that
// detachment should live in STACCATO marks, not explicit rests (comment at generator ~L968), so a lone clip is a leak. A
// rhythmic gesture stated once is inconsistent - it should recur (motivic) or not appear. Flags a melody that contains
// exactly ONE clipped beat (the lone, unmotivated clip). A full-beat rest (a phrase breath) is NOT a clip and not flagged.
export function rhythmConsistency(ex){
  const bl=beatLen(ex);
  const melArr = ex._swap==='swap'?ex.lh:ex.rh, accArr = ex._swap==='swap'?ex.rh:ex.lh;
  const mel=tl(melArr), acc=tl(accArr);
  // a caesura (both hands resting together) is a legitimate one-off lift, NOT a stray clip — only a MELODY-ONLY gap over a
  // SOUNDING accompaniment is the ex12 fault. So a clip counts only where the accompaniment sounds through the rest.
  const accSounds=(a,b2)=>{ for(const n of acc){ if(n.rest) continue; if(n.t < b2-1e-9 && n.t+n.d > a+1e-9) return true; } return false; };
  const byBeat={}; for(const n of mel){ const bi=Math.floor(n.t/bl+1e-9); (byBeat[bi]??=[]).push(n); }
  const clips=[];
  for(const arr of Object.values(byBeat)){
    for(let i=0;i+1<arr.length;i++){ if(!arr[i].rest && arr[i+1].rest){ const r=arr[i+1];
      if(accSounds(r.t, r.t+r.d)) clips.push({beat:Math.floor(r.t/bl+1e-9), t:r.t, cell:arr.map(x=>(x.rest?'r':'n')+x.d).join(',')});
      break; } }
  }
  if(clips.length!==1) return [];                                  // no melody-only clip, or a recurring (>=2) clip motif - both fine
  const c=clips[0]; const bU=ex._barU||barUnit(ex); const beatsPerBar=Math.round(bU/bl);
  return [{ bar: Math.floor(c.beat/beatsPerBar)+1, beat:(c.beat%beatsPerBar)+1, cell:c.cell,
            note:'lone melody-only clipped-note-rest over a sounding accompaniment that never recurs (rhythmic vocabulary inconsistent)' }];
}

// ── CHECK D: accent motivation ───────────────────────────────────────────────────────────────────
// Matthew's ex12 "random accent": an accent (art '->') on a note with no genuine reason to STAND OUT. A note earns an
// accent only as a real standout - a wide leap INTO it (>=4th), a syncopation/off-beat long note, a chromatic colour, an
// agogic long note emerging from quick ones, or the melodic peak. Anything else reads as a random bump. Independent guard
// (the generator already scores this, L~2765) so a regression - or an old saved piece - can't slip an unmotivated accent
// through. Flags an accent whose note has NONE of the standout reasons.
export function accentMotivation(ex){
  const bU=ex._barU||barUnit(ex), bl=beatLen(ex);
  const arr=ex._swap==='swap'?ex.lh:ex.rh;
  const T=tl(arr); const total=T.length;
  const hi=Math.max(...T.filter(n=>!n.rest&&!Array.isArray(n.m)).map(n=>n.m), -Infinity);
  const strong = ex.time==='4/4'?[0,2]:(bl===1.5?Array.from({length:Math.round(bU/1.5)},(_,k)=>k*1.5):[0]);
  const out=[];
  for(let k=0;k<total;k++){ const n=T[k]; if(n.art!=='->'||n.rest||Array.isArray(n.m)) continue;
    const pos=((n.t%bU)+bU)%bU;
    let p=k-1; while(p>=0&&(T[p].rest||Array.isArray(T[p].m)))p--; const prev=p>=0?T[p]:null;
    const leap = prev ? Math.abs(n.m-prev.m) : 0;
    const offbeat = Math.abs(pos%bl)>1e-6;
    const agogic = prev && prev.d<=0.5 && n.d>=2;
    const reasons = (leap>=5) || (offbeat && n.d>=1) || n.alt || agogic || (n.m===hi) || (!strong.some(s=>Math.abs(pos-s)<1e-6) && offbeat);
    if(!reasons) out.push({ bar:Math.floor(n.t/bU)+1, beat:+((pos/bl)+1).toFixed(2), pitch:n.m,
                            note:'accent on a note with no standout reason (leap/syncopation/off-beat-long/chromatic/agogic/peak) - reads as random' });
  }
  return out;
}

// ── CHECK E: dynamics coherence ────────────────────────────────────────────────────────────────
// "Dynamics need reasoning out better." A coherent dynamic scheme: every piece is marked; hairpins RESOLVE (a cresc
// reaches something louder, a dim something softer, and an opened hairpin is closed); and a big terraced jump (>2 levels
// with no hairpin) only happens as an ECHO at a phrase boundary (the restated consequent entering soft after a loud
// antecedent) - a deliberate device - never as an abrupt mid-phrase lurch. Flags: no dynamics at all; an unresolved or
// contradictory hairpin; a >2-level jump that is NOT at the phrase boundary.
const DLEVEL={pp:0,p:1,mp:2,mf:3,f:4,ff:5};
export function dynamicsCoherence(ex){
  const arr=ex._swap==='swap'?ex.lh:ex.rh, bU=ex._barU||barUnit(ex);
  const nbars=(ex._prog&&ex._prog.length)||Math.round((tl(arr).at(-1).t+tl(arr).at(-1).d)/bU);
  const half=Math.ceil(nbars/2);
  const marks=[]; for(const n of tl(arr)){ if(n.dyn||n.hp) marks.push({dyn:n.dyn,hp:n.hp,bar:Math.floor(n.t/bU+1e-9)}); }
  const out=[];
  if(!marks.some(mk=>mk.dyn)) { out.push({note:'no dynamics marked at all'}); return out; }
  let openHp=null, lastLv=null;
  for(const mk of marks){
    if(mk.dyn!=null){ const lv=DLEVEL[mk.dyn];
      if(openHp==='<' && lastLv!=null && lv<=lastLv) out.push({bar:mk.bar+1, note:'crescendo resolves to a not-louder dynamic'});
      if(openHp==='>' && lastLv!=null && lv>=lastLv) out.push({bar:mk.bar+1, note:'diminuendo resolves to a not-softer dynamic'});
      if(lastLv!=null && Math.abs(lv-lastLv)>2 && !openHp && mk.bar!==half && mk.bar!==0)
        out.push({bar:mk.bar+1, note:'abrupt terraced jump >2 dynamic levels mid-phrase (not a phrase-boundary echo)'});
      lastLv=lv; }
    if(mk.hp){ if(mk.hp.includes('!')) openHp=null; if(mk.hp.includes('<')) openHp='<'; else if(mk.hp.includes('>')) openHp='>'; }
  }
  if(openHp!=null) out.push({note:'hairpin opened but never closed/resolved'});
  return out;
}

// ── harness ──────────────────────────────────────────────────────────────────────────────────
export const CHECKS = { minorLeadingTone, harmonyCoherence, rhythmConsistency, accentMotivation, dynamicsCoherence };

// Run one check across a fresh generated batch per grade, printing a summary + sample flags.
export async function runBatch(grades=[2,3,4], perGrade=40){
  const { generate } = await import('./generator.mjs');
  const results={};
  for(const g of grades){
    const pieces=[];
    for(let i=0;i<perGrade;i++){ const ex=generate(g, g===2?1500:4000); if(ex) pieces.push(ex); }
    results[g]=pieces;
  }
  return results;
}
