// ============================================================================
// HARMONIC PLAN  —  THE VERY BEGINNING of a piece, built BEFORE the melody.
//
// It hands over ONE thing: the PROGRESSION — the ordered sequence of chords and
// its functional shape (home -> departure -> tension -> cadence), with the cadence
// chords pinned to their structural bars. That is all that truly exists up front.
//
// It does NOT assign durations. A chord has no length of its own; it is simply the
// next thing in the progression, and it lasts as long as it lasts because of what is
// played over it. WHERE the harmony is heard to turn over emerges later, when the
// notes and the motif are laid onto this sequence (the two-way bend). The only pacing
// decided here is DENSITY — how many chords the phrase travels through — because a
// lyrical piece simply passes through fewer chords (so they naturally last longer) and
// a driving one through more (so it moves faster). Density, not duration.
//
// Held throughout (Matthew): the harmony is its OWN agent — it may colour within the
// home area (I -> vi -> iii) to turn over without being forced by any melody — and
// nothing is uniform: the count and the path differ every piece.
// ============================================================================

const FUNC = {
  maj: { T:['I','vi','iii'], PD:['ii','IV'], D:['V'] },
  min: { T:['i','VI','III'], PD:['iv','iio'], D:['V'] },
};
// permissible function-to-function motion: a real journey advances T -> PD -> D -> T
// and never backslides mid-phrase (D does not fall back to PD). Staying in the same
// function is allowed (a colour move within the area).
const NEXTF = { T:['T','PD','D'], PD:['PD','D'], D:['T'] };

const funcOf = (ch, mode) => { for(const f of ['T','PD','D']) if(FUNC[mode][f].includes(ch)) return f; return 'T'; };
const pick = (a, rnd) => a[Math.floor(rnd()*a.length)];

// DENSITY: chords per bar the phrase travels through, from character (motifPersist ~ drive).
// Lyrical passes through few (the harmony lingers); driving through many (it turns over).
// A per-piece value with spread, so no two share a pace. Grade caps the ceiling (a lower
// grade's harmony can't churn as fast).
function densityPerBar(motifPersist, grade, rnd) {
  const base = motifPersist <= 0.4 ? 0.7      // lyrical: often fewer chords than bars (holds across bars)
             : motifPersist >= 0.62 ? 1.9     // driving: several chords a bar
             : 1.2;                            // middle
  const jitter = (rnd() - 0.5) * 0.5;         // per-piece spread
  const ceil = grade <= 2 ? 1.8 : grade === 3 ? 2.6 : 3.4;
  return Math.max(0.5, Math.min(ceil, base + jitter));
}

// build the interior progression for ONE phrase: a functional journey from `open`
// (the chord it starts in) toward `arriveFunc` (the function of the cadence it leads to),
// travelling through `n` chords. The harmony advances its function as the phrase runs out,
// and may take same-function colour moves earlier (its own agency). Returns chord labels.
function journey({ open, arriveFunc, mode, n, rnd }) {
  const out = [];
  let prevCh = open, prevF = funcOf(open, mode);
  for (let i = 0; i < n; i++) {
    const remaining = n - i;                          // chords left to place (incl. this)
    const driveNow = remaining <= 2;                  // last couple advance toward the cadence
    let cands = NEXTF[prevF].flatMap(ff => FUNC[mode][ff].map(c => ({ c, f: ff })))
                            .filter(o => o.c !== prevCh);
    if (driveNow) {
      // steer toward the arriving function: PD if the cadence is dominant, straight on otherwise
      const want = arriveFunc === 'D' ? ['PD','D'] : ['PD','D','T'];
      const fwd = cands.filter(o => want.includes(o.f));
      if (fwd.length) cands = fwd;
    }
    const chosen = pick(cands.length ? cands : [{ c: prevCh, f: prevF }], rnd);
    out.push(chosen.c); prevCh = chosen.c; prevF = chosen.f;
  }
  return out;
}

// THE PLAN. Pins the functional cadences to their bars, then fills each phrase with a
// journey whose LENGTH (chord count) comes from density. Returns a flat progression:
// [{ chord, func, bar|null }] — `bar` set only on the pinned cadence chords; the interior
// chords carry no position and no duration. Positions and the rhythm of change are decided
// downstream, when the notes are conformed to this sequence.
export function harmonicPlan({ nbars, mode, half, midType, finalCad, motifPersist, grade, rnd = Math.random }) {
  const T = mode === 'maj' ? 'I' : 'i';
  const preTonic = finalCad === 'plagal' ? (mode === 'maj' ? 'IV' : 'iv') : 'V';
  const dens = densityPerBar(motifPersist, grade, rnd);

  const midBar = half - 1;
  const midChord = midType === 'HC' ? 'V'
                 : midType === 'DC' ? (mode === 'maj' ? 'vi' : 'VI')
                 : T;                                   // IAC / continuous resolve home
  const midFunc = funcOf(midChord, mode);

  const prog = [];
  // ---- opening pillar: home ----
  prog.push({ chord: T, func: 'T', bar: 0 });

  // ---- antecedent interior: from the opening to the mid-phrase cadence ----
  const antBars = midBar;                               // bars of travel before the cadence lands
  const antN = Math.max(0, Math.round(antBars * dens) - 1);   // -1: the opening already placed
  journey({ open: T, arriveFunc: midFunc, mode, n: antN, rnd })
    .forEach(c => prog.push({ chord: c, func: funcOf(c, mode), bar: null }));
  // the mid cadence is a pillar, pinned to its bar
  prog.push({ chord: midChord, func: midFunc, bar: midBar });

  // ---- consequent interior: from after the mid cadence to the penult ----
  const penultBar = nbars - 2, finalBar = nbars - 1;
  const consBars = penultBar - half;                    // bars of travel in the consequent body
  const consN = Math.max(0, Math.round(Math.max(0, consBars) * dens));
  if (consN > 0) {
    journey({ open: T, arriveFunc: 'PD', mode, n: consN, rnd })
      .forEach(c => prog.push({ chord: c, func: funcOf(c, mode), bar: null }));
  }
  // ---- closing pillars: the cadential pre-tonic, then home ----
  prog.push({ chord: preTonic, func: funcOf(preTonic, mode), bar: penultBar });
  prog.push({ chord: T, func: 'T', bar: finalBar });

  return { prog, density: dens };
}
