// Harmony checks distilled from Matthew's ear during the Grade 2 revision pass.
// These are NOT in engine.mjs's validator, so generated candidates are not yet
// screened against them: see the counts in the revision notes.

// Parallel perfect 5ths/8ves BETWEEN consecutive struck left-hand chords (the fault the outer-voice
// check misses, because both voices live inside the LH). Only consecutive 2-note LH chords count — a
// single-note walking bass or an Alberti figure isn't two sustained voices. Both notes must move the
// same direction into a repeated perfect interval.
export function lhParallels(ex){
  const ch=ex.lh.filter(n=>!n.rest && Array.isArray(n.m) && n.m.length===2);
  const out=[]; let t=0, pos=[]; { let tt=0; for(const n of ex.lh){ if(!n.rest && Array.isArray(n.m) && n.m.length===2) pos.push({lo:Math.min(...n.m),hi:Math.max(...n.m),t:tt}); tt+=n.d; } }
  const perfect=s=>s===7||s===0;
  for(let i=1;i<pos.length;i++){
    const a=pos[i-1], b=pos[i];
    const ia=(((a.hi-a.lo)%12)+12)%12, ib=(((b.hi-b.lo)%12)+12)%12;
    const lm=b.lo-a.lo, hm=b.hi-a.hi;
    if(perfect(ib) && ib===ia && lm!==0 && hm!==0 && Math.sign(lm)===Math.sign(hm))
      out.push({ note:'parallel '+(ib===7?'fifths':'octaves')+' between LH chords', interval: ib===7?'P5':'P8' });
  }
  return out;
}

// Flags clashes that are LEAPT into (fault) vs approached by step (motivated passing note).
export function leapClashes(ex){
  const tl = s => { let t=0, o=[]; for(const n of s){ o.push({...n,t}); t+=n.d; } return o; };
  const RH = tl(ex.rh), LH = tl(ex.lh);
  const hi = n => Array.isArray(n.m) ? Math.max(...n.m) : n.m;
  const lo = n => Array.isArray(n.m) ? Math.min(...n.m) : n.m;
  const sound = (a,t) => { let c=null; for(const n of a){ if(n.t<=t+1e-9) c=n; else break; } return c; };
  const prevOf = (a,n) => { const i=a.indexOf(n); return i>0 ? a[i-1] : null; };
  const onsets = [...new Set([...RH,...LH].map(n=>n.t))].sort((a,b)=>a-b);
  const [top,bottom]=ex.time.split('/').map(Number);
  const barU=(top/bottom)*4, beatLen=(bottom===8&&top%3===0)?1.5:1;
  const out=[];
  for(const t of onsets){
    const rn=sound(RH,t), ln=sound(LH,t);
    if(!rn||!ln||rn.rest||ln.rest) continue;
    const s=((hi(rn)-lo(ln))%12+12)%12;
    if(![1,2,11].includes(s)) continue;
    // Only an ON-BEAT dissonance is a real fault when leapt into; off-beat figuration
    // dissonances (broken chords, Alberti) are idiomatic. (Refined on Grade 4 #5.)
    if(Math.abs(t % beatLen) > 1e-9) continue;
    const approach = (arr,n,pitch) => { const p=prevOf(arr,n); if(!p||p.rest) return null; return Math.abs(pitch(n)-pitch(p)); };
    const rMove = rn.t===t ? approach(RH,rn,hi) : null;   // only if this note just started
    const lMove = ln.t===t ? approach(LH,ln,lo) : null;
    const leapt = (rMove!=null && rMove>2) || (lMove!=null && lMove>2);
    out.push({ bar: Math.floor(t/barU)+1, beat: +((t%barU)+1).toFixed(2),
               interval: ['','m2','M2/9th','','','','','','','','','M7'][s],
               rhApproach: rMove==null?'held':(rMove<=2?'step':'LEAP '+rMove),
               lhApproach: lMove==null?'held':(lMove<=2?'step':'LEAP '+lMove),
               verdict: leapt ? 'FAULT (leapt into)' : 'ok (stepwise)' });
  }
  return out;
}

// A weak SECOND-INVERSION (6/4) on a downbeat: the chord's FIFTH in the bass. CHORD-AWARE - a bare melody-vs-bass 4th is
// NOT enough: with the 3rd in the bass (a first inversion, 6/3) the same 4th interval is perfectly good voicing, and with
// the root in the bass the melodic 4th is just a non-chord tone (an 11th/suspension). Only when the BASS is the chord's
// FIFTH is it a 6/4. So the flag needs the chord: use _prog + key when present (generated pieces); without them, fall
// back to the old interval-only test. (Matthew: the interval-only rule cut out valid first inversions - don't narrow.)
const _LET6={c:0,d:2,e:4,f:5,g:7,a:9,b:11};
const _ROOTDEG6={I:0,i:0,ii:1,'ii°':1,iii:2,III:2,IV:3,iv:3,V:4,v:4,vi:5,VI:5,vii:6,'vii°':6,VII:6};
export function sixFours(ex){
  const tl = s => { let t=0,o=[]; for(const n of s){o.push({...n,t});t+=n.d;} return o; };
  const RH=tl(ex.rh), LH=tl(ex.lh);
  const hi=n=>Array.isArray(n.m)?Math.max(...n.m):n.m, lo=n=>Array.isArray(n.m)?Math.min(...n.m):n.m;
  const sound=(a,t)=>{let c=null;for(const n of a){if(n.t<=t+1e-9)c=n;else break;}return c;};
  const barU=(t=>{const[a,b]=t.split('/').map(Number);return (a/b)*4;})(ex.time);
  const prog=ex._prog||null;
  const tpc = ex.key ? (((_LET6[ex.key[0]]??0)+(ex.key[1]==='f'?-1:ex.key[1]==='s'?1:0))%12+12)%12 : null;
  const scale = ex.mode==='min'?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];
  const out=[];
  const nbars = prog ? prog.length : Math.round((RH.at(-1).t+RH.at(-1).d)/barU);
  for(let bar=0; bar*barU < RH.at(-1).t+RH.at(-1).d; bar++){
    const t=bar*barU, rn=sound(RH,t), ln=sound(LH,t);
    if(!rn||!ln||rn.rest||ln.rest) continue;
    const s=((hi(rn)-lo(ln))%12+12)%12;
    if(s!==5) continue;
    if(prog && tpc!=null && prog[bar]!=null && _ROOTDEG6[prog[bar]]!=null){
      const rootPC=(tpc+scale[_ROOTDEG6[prog[bar]]])%12, bassPC=((lo(ln)%12)+12)%12;
      if(bassPC !== (rootPC+7)%12) continue;         // bass is the 3rd (6/3) or root, not the 5th -> not a 6/4 at all
    }
    // A 6/4 is IDIOMATIC as a passing / cadential / pedal chord - the bass is a stepwise or STATIC (held/repeated) tone.
    // It only sounds WEAK when it is EXPOSED (the bass LEAPS onto the 5th, arpeggiating a bare second inversion) or when
    // it is the FINAL chord (the piece should close in root position, not on an unstable 6/4). So flag only those.
    // "leapt onto the 5th" is a property of the BASS LINE, so measure it from the previous BASS note, not the immediately
    // previous LH note (which in an oom-pah/broken texture is the prior bar's high "pah" chord - comparing to that mis-reads
    // a pedal/repeated bass as a leap). Walk back past any higher upper-voice notes to the previous bass-register attack.
    const lnIdx=LH.indexOf(ln), dbBass=lo(ln);
    let prevBass=null; for(let k=lnIdx-1;k>=0;k--){ const p=LH[k]; if(!p.rest && lo(p)<=dbBass+2){ prevBass=p; break; } }
    const leaptIn = prevBass && Math.abs(dbBass-lo(prevBass))>2;   // not a step or a held/repeated pedal
    const lastBar = bar===nbars-1;
    if(!lastBar && !leaptIn) continue;               // stepwise/pedal/cadential 6/4 = fine
    out.push({bar:bar+1, note: lastBar?'weak 6/4 as the final chord (close in root position)':'exposed 6/4 (5th leapt into the bass)'});
  }
  return out;
}

// Consonance on the beat. Dissonance (2nd, 4th, tritone, 7th) belongs off the beat,
// as a passing note; on a beat it is exposed and sounds like a mistake.
const CONSONANT = new Set([0,3,4,7,8,9]);          // unison, 3rds, 5th, 6ths, octave
const NAME = {1:'m2',2:'M2/9th',5:'P4',6:'tritone',10:'m7',11:'M7'};
// REASONED OUT + RETIRED (2026-08-07, Matthew): this flagged EVERY on-beat melody-vs-bass non-consonance context-free
// (P4, tritone, m7, 9th), which are all LEGITIMATE tonal harmony - a cadential/passing 6-4, a dominant 7th in the tune, a
// dominant tritone, a 9th chord, a resolving suspension. It is not an actual rule; it condemned good music and forced the
// book bland. The ONLY genuinely-bad outer interval is the SEMITONE rub, which `beatClash` already catches (all voices,
// resolution-aware). So this is redundant AND over-narrow: it now returns nothing. Kept exported so callers don't break;
// the harmony standard is carried by beatClash + leapClashes + sixFours + parallelPerfects + lhParallels + melodicAug2nd.
export function beatDissonance(ex){ return []; }

// On-beat SEMITONE clash between ANY right-hand voice and ANY left-hand voice — not just the outer voices that
// beatDissonance compares. A chromatic melody note landing a semitone against an inner accompaniment voice
// (Matthew's Ab-vs-G) sounds like a mistake but is invisible to an outer-voice-only check.
export function beatClash(ex){
  const tl=s=>{let t=0,o=[];for(const n of s){o.push({...n,t});t+=n.d;}return o;};
  const RH=tl(ex.rh), LH=tl(ex.lh);
  const pcs=n=>Array.isArray(n.m)?n.m:[n.m];
  const sound=(a,t)=>{let c=null;for(const n of a){if(n.t<=t+1e-9)c=n;else break;}return c;};
  const [top,bottom]=ex.time.split('/').map(Number);
  const barU=(top/bottom)*4, beatLen=(bottom===8&&top%3===0)?1.5:1;
  const total=RH.at(-1).t+RH.at(-1).d;
  const out=[];
  for(let t=0;t<total-1e-9;t+=beatLen){
    const rn=sound(RH,t), ln=sound(LH,t);
    if(!rn||!ln||rn.rest||ln.rest) continue;
    const nxt=RH[RH.indexOf(rn)+1], lnxt=LH[LH.indexOf(ln)+1];
    for(const r of pcs(rn)){ for(const l of pcs(ln)){ const ic=((r-l)%12+12)%12, s=Math.min(ic,12-ic);
      if(s!==1) continue;
      // A semitone dissonance is FINE when EITHER clashing voice RESOLVES BY STEP, in EITHER direction: the RIGHT-hand
      // voice steps down (a suspension/upper appoggiatura dropping) or up (a retardation/lower appoggiatura), OR the
      // BASS steps to clear it (the bass moves on and the rub is gone). Only flag a clash where NEITHER voice resolves -
      // it just SITS or both LEAP away (Matthew's Ab, which repeats then leaps down a 3rd to F).
      const step=(cur,nx)=> nx && !nx.rest && (Array.isArray(nx.m)?nx.m:[nx.m]).some(m => m===cur-1||m===cur-2||m===cur+1||m===cur+2);
      if(!step(r,nxt) && !step(l,lnxt)){ out.push({bar:Math.floor(t/barU)+1, beat:+((t%barU)/beatLen+1).toFixed(2), note:'unresolved semitone clash between the hands'}); break; }
    } }
  }
  return out;
}

// Parallel perfect 5ths / 8ves between the OUTER voices (LH bass vs RH melody). Two perfect intervals
// of the SAME size, reached with both voices moving the SAME direction, sound cheap (Matthew's bar-2
// catch: C-G then D-A, both climbing a step). This is pinpointed on purpose: parallel 3rds/6ths are
// fine and untouched, and CONTRARY or OBLIQUE motion into a 5th is fine too — only same-direction
// motion that PRESERVES a perfect 5th or octave is flagged. Checked at the beat, so off-beat
// figuration (broken chords, Alberti) is not caught.
export function parallelPerfects(ex){
  const tl=s=>{let t=0,o=[];for(const n of s){o.push({...n,t});t+=n.d;}return o;};
  const RH=tl(ex.rh), LH=tl(ex.lh);
  const hi=n=>Array.isArray(n.m)?Math.max(...n.m):n.m, lo=n=>Array.isArray(n.m)?Math.min(...n.m):n.m;
  const sound=(a,t)=>{let c=null;for(const n of a){if(n.t<=t+1e-9)c=n;else break;}return c;};
  const [top,bottom]=ex.time.split('/').map(Number);
  const barU=(top/bottom)*4;
  const perfect=s=>s===7||s===0;                         // P5 or P8/unison
  const pc=m=>(((m%12)+12)%12);
  const ct=ex._ct||null;                                  // per-bar chord-tone PCs (present on generated pieces)
  // ONSET-BASED (meter-agnostic) so it sees the "pah"/off-beat sonorities a per-beat grid skips in 3/8 & 6/8,
  // where most outer-voice parallels hide. Only STRUCTURAL parallels are faults: two independent voices FUSE
  // only when both ends are real chord-tone attacks (when chord data is known) and none of the four notes is
  // shorter than an eighth. A parallel that involves a short ornamental or a non-chord passing tone reads as
  // figuration, not a second voice, so it stays legal (Matthew's rule: kill the problem, not the possibility).
  const times=[...new Set([...RH,...LH].map(n=>+n.t.toFixed(6)))].sort((a,b)=>a-b);
  const out=[]; let prev=null;
  for(const t of times){
    const rn=sound(RH,t), ln=sound(LH,t);
    if(!rn||!ln||rn.rest||ln.rest){ prev=null; continue; }
    const cur={top:hi(rn), bot:lo(ln), md:rn.d, bd:ln.d, bar:Math.floor(t/barU+1e-9)};
    const ic=(((cur.top-cur.bot)%12)+12)%12;
    if(prev && perfect(ic)){
      const picPrev=(((prev.top-prev.bot)%12)+12)%12;
      const topMove=cur.top-prev.top, botMove=cur.bot-prev.bot;
      if(ic===picPrev && topMove!==0 && botMove!==0 && Math.sign(topMove)===Math.sign(botMove)){
        const allLong = Math.min(cur.md,cur.bd,prev.md,prev.bd) >= 0.5-1e-9;   // no fleeting ornamental note involved
        const allChord = !ct ? true : [[cur.top,cur.bar],[cur.bot,cur.bar],[prev.top,prev.bar],[prev.bot,prev.bar]]
                                        .every(([m,b])=> (ct[b]||[]).includes(pc(m)));   // both ends are real voices
        if(allLong && allChord){
          out.push({ bar:cur.bar+1, beat:+((t%barU)+1).toFixed(2),
                     interval: ic===7?'P5':'P8', note:'parallel '+(ic===7?'fifths':'octaves')+' (outer voices, similar motion)' });
        }
      }
    }
    prev=cur;
  }
  return out;
}

// Hand crossing / collision: the top LH note should stay below the bottom RH note at
// every onset. Purely a spacing fault (harmony can be perfect), so the interval checks
// miss it — this is what catches a broken chord rising into a descending melody.
export function handCrossing(ex){
  const tl=s=>{let t=0,o=[];for(const n of s){o.push({...n,t});t+=n.d;}return o;};
  const RH=tl(ex.rh), LH=tl(ex.lh);
  const rTop=n=>Array.isArray(n.m)?Math.max(...n.m):n.m, lTop=n=>Array.isArray(n.m)?Math.max(...n.m):n.m, rLo=n=>Array.isArray(n.m)?Math.min(...n.m):n.m;
  const sound=(a,t)=>{let c=null;for(const n of a){if(n.t<=t+1e-9)c=n;else break;}return c;};
  const barU=(t=>{const[a,b]=t.split('/').map(Number);return (a/b)*4;})(ex.time);
  const out=[];
  [...new Set([...RH,...LH].map(n=>n.t))].sort((a,b)=>a-b).forEach(t=>{
    const r=sound(RH,t), l=sound(LH,t); if(!r||!l||r.rest||l.rest) return;
    if(lTop(l) >= rLo(r)) out.push({ t, bar:Math.floor(t/barU)+1,
      note: lTop(l)===rLo(r)?'hands on the same note':'LH above RH (crossing)' });
  });
  return out;
}

// Melodic augmented 2nd in MINOR: a stepwise move between the flat 6th and the raised 7th (leading tone),
// the harmonic-minor gap. A voice-leading fault [LAW] — real writing avoids it with melodic-minor inflection
// (raise ^6 ascending, or lower ^7 descending). Detected key-relatively in either hand's single-note line.
// (No such diatonic gap exists in major, so major returns none.)
export function melodicAug2nd(ex){
  if(ex.mode!=='min') return [];
  const LET={c:0,d:2,e:4,f:5,g:7,a:9,b:11};
  const t=(((LET[ex.key[0]]??0)+(ex.key[1]==='f'?-1:ex.key[1]==='s'?1:0))%12+12)%12;
  const b6=(t+8)%12, lt=(t+11)%12, pc=m=>((m%12)+12)%12;
  const out=[];
  for(const hand of [ex.rh, ex.lh]){
    let prev=null;
    for(const n of hand){
      if(n.rest || Array.isArray(n.m)){ prev=null; continue; }   // only a single-note melodic step
      if(prev!=null && Math.abs(n.m-prev)===3){ const a=pc(prev), b=pc(n.m);
        if((a===b6&&b===lt)||(a===lt&&b===b6)) out.push({ note:'melodic augmented 2nd (b6-#7) in minor' }); }
      prev=n.m;
    }
  }
  return out;
}
