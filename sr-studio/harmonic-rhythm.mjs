// ============================================================================
// HARMONIC RHYTHM  —  the SETTLEMENT between two motifs.
//
// The progression (which chords) is already decided (harmonic-plan.mjs). This layer
// decides WHEN those chords are heard to turn over — and it does NOT dictate that from
// outside. It negotiates it between the piece's melodic rhythm and its own harmonic-
// rhythm identity, the way a composer does:
//
//   - under a LONG melody note, the harmony is invited to MOVE beneath it (reharmonise
//     the held tone through successive chords) — the harmony leading while the line is still;
//   - under QUICK notes, the harmony MAY change with them, chord per note, OR hold and let
//     them be figuration over one chord — a choice, never forced;
//   - it can land a change BELOW the beat;
//   - the cadence chords still arrive on their pinned bars.
//
// Neither side is the master. The melodic rhythm offers openings; the harmonic-rhythm
// identity (this piece's appetite for change) decides which to take. Output: a list of
// harmonic ONSETS [{ t, chord, func }] — the chord sounding FROM time t until the next.
// ============================================================================

import { harmonicPlan } from './harmonic-plan.mjs';

const pick = (a, rnd) => a[Math.floor(rnd()*a.length)];

// ---- MELODIC RHYTHM MOTIF (minimal, for the negotiation to bend against) -----------
// a per-piece rhythmic cell that fills a beat, developed lightly bar to bar. Real melody
// generation is richer; here we only need believable note-durations to negotiate with.
const BEATCELLS = {
  calm:   [[1],[1],[1],[2],[1.5,0.5]],                 // mostly beats and held notes
  mixed:  [[1],[0.5,0.5],[1],[0.5,0.5],[1.5,0.5],[2]], // a genuine mix
  busy:   [[0.5,0.5],[0.5,0.5],[0.25,0.25,0.5],[1],[0.5,0.25,0.25]], // quick notes
};
function melodyRhythm({ nbars, barU, beatLen, motif, rnd }) {
  const menu = BEATCELLS[motif];
  const bars = [];
  for (let b = 0; b < nbars; b++) {
    const durs = []; let t = 0;
    while (barU - t > 1e-9) {
      // fill a beat at a time; the LAST bar broadens (a held cadence note)
      if (b === nbars-1 && t >= barU - beatLen) { durs.push(barU - t); break; }
      let cell = pick(menu, rnd);
      const cs = cell.reduce((a,c)=>a+c,0);
      if (cs > barU - t) { durs.push(barU - t); break; }
      cell.forEach(d => durs.push(d)); t += cs;
    }
    bars.push(durs);
  }
  return bars;   // [[dur,dur,...] per bar]
}

// ---- HARMONIC-RHYTHM IDENTITY -----------------------------------------------------
// this piece's appetite for change (0..1) and how it reads the melody. Driven by
// character; a per-piece value with spread so no two pace alike.
function rhythmIdentity(motifPersist, rnd) {
  const appetite = Math.max(0.05, Math.min(0.95, motifPersist + (rnd()-0.5)*0.3));
  return {
    appetite,                                        // base eagerness to advance the harmony
    reharmHeld: 0.3 + appetite*0.5,                  // chance to MOVE under a long held note
  };
}

// what the melody is doing AT a beat time: does a note ONSET here, and is the note
// sounding across this beat a LONG one (held through)? Read from the per-bar rhythm.
function melAtBeat(rhythm, barU, beatLen, t) {
  const b = Math.floor(t/barU + 1e-9); if (b >= rhythm.length) return { onset:false, held:false };
  let x = b*barU;
  for (const d of rhythm[b]) {
    if (Math.abs(x - t) < 1e-9) return { onset:true, held: d >= beatLen*1.5 };   // a note starts on this beat
    if (t > x + 1e-9 && t < x + d - 1e-9) return { onset:false, held: d >= beatLen*1.5 }; // beat falls INSIDE a note (held across it)
    x += d;
  }
  return { onset:false, held:false };
}

// ---- THE NEGOTIATION (beat-quantised) ---------------------------------------------
// walk the piece BEAT BY BEAT. The harmony changes ON beats, preferring beats where the
// melody also has a note, and moves UNDER a held note by advancing on the NEXT beat inside
// it. Between changes, nothing harmonic happens — that gap is where the counter-melody
// will later step from one chord to the next. Sub-beat life is NOT here.
export function harmonicRhythm({ nbars, barU, beatLen, mode, half, midType, finalCad, motifPersist, grade, melMotif = 'mixed', rnd = Math.random }) {
  const { prog } = harmonicPlan({ nbars, mode, half, midType, finalCad, motifPersist, grade, rnd });
  const id = rhythmIdentity(motifPersist, rnd);
  const rhythm = melodyRhythm({ nbars, barU, beatLen, motif: melMotif, rnd });

  const onsets = [];
  let pi = 0;
  const emit = (t, p) => { if (!onsets.length || onsets[onsets.length-1].chord !== p.chord) onsets.push({ t:+t.toFixed(3), chord:p.chord, func:p.func }); };
  emit(0, prog[0]); pi = 1;
  let lastChangeT = 0;

  const nextPin = fromIdx => { for (let k=fromIdx;k<prog.length;k++) if (prog[k].bar!=null) return k; return prog.length-1; };
  const nbeats = Math.round(barU/beatLen);

  // walk every beat of the piece (skip beat 0, the opening is placed)
  for (let step = 1; step < nbars*nbeats; step++) {
    const t = step*beatLen;
    const b = Math.floor(t/barU + 1e-9);
    const onDown = Math.abs(t - b*barU) < 1e-9;

    // a pinned cadence lands on its bar's downbeat, always, exactly.
    if (prog[pi] && prog[pi].bar === b && onDown) { emit(b*barU, prog[pi]); pi++; lastChangeT = t; continue; }
    if (!(prog[pi] && prog[pi].bar == null)) continue;      // nothing interior to place right now

    // pacing: how many interior chords still owed before the next pin, over the beats left
    const pinK = nextPin(pi);
    const beatsToPin = Math.max(1, Math.round((prog[pinK].bar*barU - t)/beatLen));
    const chordsToSpend = pinK - pi;
    const pressure = Math.min(1, chordsToSpend/beatsToPin);

    const mel = melAtBeat(rhythm, barU, beatLen, t);
    const sinceLast = t - lastChangeT;

    // a MINIMUM gap so a driving piece changes OFTEN but not on literally every beat
    // (appetite raises how short the gap may get; pressure can override to make the pin).
    const minGap = beatLen * (id.appetite >= 0.6 ? 1 : id.appetite >= 0.4 ? 2 : 3);
    if (sinceLast + 1e-9 < minGap && pressure < 0.999) continue;

    // WHERE the harmony wants to turn over:
    //  - a fresh melody note on this beat is the natural place to change WITH the line;
    //  - a beat that falls INSIDE a held note is the place to move UNDER it (harmony leads);
    //  - otherwise a plainer beat, taken more readily as appetite/pressure rise.
    let want = mel.onset ? id.appetite*0.9 + 0.1
             : mel.held  ? id.reharmHeld
             :             id.appetite*0.6;
    want = Math.max(want, pressure);
    if (rnd() < want) { emit(t, prog[pi]); pi++; lastChangeT = t; }
  }
  // land any remaining chords (final pins) exactly on their bars
  while (pi < prog.length) { const p = prog[pi]; emit(p.bar!=null ? p.bar*barU : (nbars-1)*barU, p); pi++; }

  return { onsets, prog, identity: id, rhythm };
}
