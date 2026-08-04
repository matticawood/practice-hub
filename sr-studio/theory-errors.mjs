// THEORY-ERROR DETECTOR — per-piece list of concrete theoretical VIOLATIONS (not rates). The goal of the loop is
// to drive these to ZERO across a large batch: things that are simply WRONG, or that should be IMPOSSIBLE. Uses
// the true chord tones exposed by the generator (ex._ct per bar); needs the melody hand (ex._mel).
// Grounded in Matthew's rules: leaps land on chord tones; a leap to a non-chord tone (appoggiatura) is allowed
// ONLY over an unambiguous chord and MUST resolve by step; stepwise motion is free to pass/neighbour; tendency
// tones (a 7th, an accented dissonance) must resolve by step; no repeated/hammered non-chord tone.
const PCS = m => ((m%12)+12)%12;
const barUnitsOf = ex => { const [n,d]=ex.time.split('/').map(Number); return n*(4/d); };
const beatLenOf = ex => (ex.time==='6/8'||ex.time==='3/8')?1.5:1;
function strongSet(ex){ if(ex.time==='4/4') return [0,2]; if(ex.time==='6/8') return [0,1.5];
  const bu=barUnitsOf(ex),bl=beatLenOf(ex),o=[]; for(let p=0;p<bu-1e-9;p+=bl)o.push(p); return o; }

// melodic line: one entry per sounding melody note (chord -> its top note), with bar + position-in-bar + whether tied in.
// Accounts for an ANACRUSIS: a pickup prepended to the melody shifts every downbeat later by `pickup`, so align bar 0
// to the first true downbeat (else notes map to the wrong bar's chord tones and phantom errors appear).
function melLine(ex){ const bu=barUnitsOf(ex); const mel=ex[ex._mel||'rh']||ex.rh; const nbars=ex._ct?ex._ct.length:99;
  const total=mel.reduce((s,n)=>s+n.d,0); const pickup=Math.max(0, total - nbars*bu);
  const out=[]; let t=0;
  // accompaniment sounding-spans, so an UNACCOMPANIED melody note (e.g. the anacrusis pickup, where the LH rests)
  // is never judged against a chord it can't clash with.
  const acc=(ex._mel==='lh')?ex.rh:ex.lh; const spans=[]; { let a=0; for(const n of acc){ if(!n.rest) spans.push([a,a+n.d]); a+=n.d; } }
  const accompanied = time => spans.some(([s,e])=>time>=s-1e-9 && time<e-1e-9);
  for(const n of mel){ const tt=t-pickup; const bi=Math.max(0, Math.min(nbars-1, Math.floor(tt/bu+1e-9))); const pos=+(tt-bi*bu).toFixed(3);
    if(!n.rest) out.push({ m: Array.isArray(n.m)?Math.max(...n.m):n.m, bar:bi, pos, tie:!!n.ti, dur:n.d, acc:accompanied(t) });
    t+=n.d; }
  return out; }

export function theoryErrors(ex){
  if(!ex._ct) return [];                              // needs true harmony; only measure freshly-generated pieces
  const errs=[]; const ct=ex._ct.map(a=>new Set(a)); const strong=strongSet(ex);
  const line=melLine(ex);
  const isCT = n => ct[n.bar] && ct[n.bar].has(PCS(n.m));
  const onStrong = n => strong.some(s=>Math.abs(n.pos-s)<1e-9);
  const add=(type,n,desc)=>errs.push({type, bar:n.bar+1, desc});
  for(let i=0;i<line.length;i++){
    const a=line[i], prev=line[i-1], next=line[i+1];
    const leapIn = prev ? Math.abs(a.m-prev.m)>2 : false;
    const stepOut = next ? Math.abs(next.m-a.m)<=2 : false;
    const nonCT = a.acc && !isCT(a);           // only a "non-chord tone" if a chord is actually sounding under it
    // 1. LEAP TO A NON-CHORD TONE that is not resolved by step (his rule: leaps confirm the chord; an appoggiatura
    //    must resolve by step). A leap landing on a non-chord tone and then leaping away is a raw wrong note.
    if(nonCT && leapIn && !stepOut) add('leap-to-nonchord-unresolved', a, `bar ${a.bar+1}: leapt to non-chord tone, not resolved by step`);
    // 2. ACCENTED (strong-beat) NON-CHORD TONE that is neither a prepared suspension (tied in) nor resolved down by
    //    step — an unprepared dissonance on the beat (this is slot 9's hammered B over C).
    if(nonCT && onStrong(a) && !a.tie){ const resolvesByStep = next && Math.abs(a.m-next.m)<=2 && Math.abs(a.m-next.m)>=1;
      const approachedByStep = prev && Math.abs(a.m-prev.m)<=2;
      // wrong only if it neither resolves by step (passing/neighbour/appoggiatura) NOR is a step-approached suspension-like tone
      if(!resolvesByStep && !approachedByStep) add('accented-nonchord-unresolved', a, `bar ${a.bar+1}: accented non-chord tone, not prepared and not resolved by step`); }
    // 3. HAMMERED NOTE (STYLISTIC) — >=3 of the SAME pitch in a row. A single/double repeat is a fine device; a
    //    series sounds terrible and would never belong in the book, even though it breaks no theory RULE. Style is
    //    a problem too. (Worse still on a non-chord tone, but a hammered chord tone is also unacceptable.)
    if(i>=2 && line[i-1].m===a.m && line[i-2].m===a.m) add(nonCT?'hammered-nonchord':'hammered-note', a, `bar ${a.bar+1}: same pitch repeated 3x in a row (hammered)${nonCT?' AND against the harmony':''}`);
    // 3b. NON-CHORD TONE LEFT BY A LEAP (an escape tone / unresolved dissonance) — a non-chord tone must resolve by
    //     step; if the next note leaps away (and it isn't an anticipation into a chord tone), it dangles unresolved.
    if(nonCT){ const nx = next ? next.m : null; const iv = nx!=null?Math.abs(nx-a.m):99;
      const anticip = iv===0 && next && isCT(next);
      if(iv>2 && !anticip) add('nonchord-left-by-leap', a, `bar ${a.bar+1}: non-chord tone left by a leap (not resolved by step)`); }
    // 4. NON-CHORD TONE APPROACHED AND LEFT BY LEAP (an escape/free tone with no stepwise anchor) — not passing/neighbour.
    if(nonCT && leapIn && next && Math.abs(next.m-a.m)>2) add('nonchord-leap-both-sides', a, `bar ${a.bar+1}: non-chord tone leapt into and out of (no stepwise resolution)`);
  }
  return errs;
}
