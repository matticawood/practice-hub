// ============================================================================
// TWO-VOICE ENGINE  —  standalone. Nothing from the old generator touches this.
//
// The heart of the harmony model (sr-harmony-model-COMPLETE): a chord is what two
// notes make. So given the TUNE (a line), we write the COUNTER-LINE note-against-note
// so that (1) each vertical pair forms a chord that WORKS, (2) the counter-line is a
// good line in its own right — mostly stepwise, contrary to the tune where it can —
// and (3) the run of chords they form PROGRESSES toward the structural placements
// (the cadences). Harmony and its rhythm are the byproduct. No dice: every counter-note
// is CHOSEN by reasoning, scored, best wins; variety comes from the tune being different.
//
// Degrees are scale-degrees, 0 = tonic (0..6 within an octave, extendable below/above).
// This file reasons in degrees; pitch mapping happens at the edge.
// ============================================================================

// diatonic triads by scale-degree root (0=I .. 6=vii). A chord is a set of the three
// degrees. In minor we use the natural scale for membership and raise ^7 only at the
// dominant (handled where pitches are formed, not here).
const TRIAD = r => [r % 7, (r + 2) % 7, (r + 4) % 7];
// the diatonic triad a pair of degrees can belong to: any triad containing BOTH.
function chordsContaining(a, b) {
  const out = [];
  for (let r = 0; r < 7; r++) { const t = TRIAD(r); if (t.includes(((a%7)+7)%7) && t.includes(((b%7)+7)%7)) out.push(r); }
  return out;                                   // roots (0..6) of triads containing both notes
}

// interval class between two degrees (mod 7), folded to 0..3 so a 3rd and a 6th read alike.
const dgIv = (a, b) => { let d = (((a - b) % 7) + 7) % 7; return Math.min(d, 7 - d); };
// CONSONANCE IS JUDGED IN SEMITONES, not degrees — a degree-"5th" can be a perfect 5th (7,
// consonant) OR a diminished 5th / tritone (6, dissonant), and the degree test can't tell them
// apart (that was the tritone bug). Consonant intervals (mod 12): unison/8ve(0), m3(3)/M3(4),
// P4(5), P5(7), m6(8)/M6(9). Dissonant: m2(1)/M2(2), TRITONE(6), m7(10)/M7(11).
const SCALE = { maj: [0,2,4,5,7,9,11], min: [0,2,3,5,7,8,10] };
const semisOf = (deg, scale) => scale[((deg % 7) + 7) % 7] + 12 * Math.floor(deg / 7);
const CONSONANT = new Set([0, 3, 4, 5, 7, 8, 9]);
const isConsonant = (a, b, scale) => CONSONANT.has(Math.abs(semisOf(a, scale) - semisOf(b, scale)) % 12);

// ONE counter-note against one melody note. `intended` is the structural chord root we're
// aiming to form (or null = free to form an emergent chord). Returns the chosen counter
// degree (absolute, may be negative = below the tonic) with its reasoning score.
// prevCounter = the counter-line's previous degree; melDeg / prevMel = melody now / before.
// ONE counter-note against one melody note. `restrictChord` (a chord root 0..6, or null) is the
// difference between the two behaviours: when set (a HELD bar) the counter must stay WITHIN that one
// chord, so the harmony sits still and the line just plays around it; when null (a MOVING bar) the
// counter is free to form whatever chord it lands on, so the harmony turns over as it steps. Either
// way it must make a real chord with the tune (consonant), stay below it, and move like a line.
// `dir` = which side of the tune the counter sits: -1 below (the tune is on top, the counter is the
// bass) or +1 above (a SWAP piece — the tune is in the left hand, the counter accompanies over it).
// Everything else is identical: consonance, chord-forming, stepwise/contrary line. Only the root-
// grounding (avoiding a 6/4) applies when the counter is the actual BOTTOM voice, i.e. dir < 0.
function chooseCounter({ melDeg, prevMel, prevCounter, restrictChord, downbeat, dir = -1, scale, lo, hi }) {
  const md = ((melDeg % 7) + 7) % 7;
  const melMove = prevMel == null ? 0 : melDeg - prevMel;
  const rc = restrictChord == null ? null : ((restrictChord % 7) + 7) % 7;
  let best = null, bestScore = -Infinity;
  for (let c = lo; c <= hi; c++) {
    if (dir < 0 ? c >= melDeg : c <= melDeg) continue;            // counter stays on its side of the tune (no crossing)
    if (!isConsonant(melDeg, c, scale)) continue;                 // the two notes must make a real (consonant) chord
    const cd = ((c % 7) + 7) % 7;
    const forms = chordsContaining(md, cd);
    if (!forms.length) continue;                                  // both must be chord tones of some triad
    if (rc != null && !forms.includes(rc)) continue;              // HELD: stay inside the placed chord
    const iv = Math.abs(semisOf(melDeg, scale) - semisOf(c, scale)) % 12;
    // A musician avoids PARALLEL/DIRECT PERFECTS: don't arrive on a 5th or octave by moving the same
    // way as the tune — two voices collapsing into one. (Basic, not academic.)
    if ((iv === 0 || iv === 7) && prevCounter != null && melMove !== 0 && Math.sign(c - prevCounter) === Math.sign(melMove)) continue;
    let s = 0;
    if (rc != null) s += 2;                                       // held: forming the placed chord
    // GROUND THE BAR on the root — only when the counter IS the bass (dir<0): on a downbeat prefer the
    // chord's ROOT (no exposed 6/4). In a swap piece the melody is the bass, so this doesn't apply.
    const rootOfForm = rc != null ? rc : forms[0];
    if (dir < 0 && downbeat && cd === rootOfForm) s += 2.5;
    else if (dir < 0 && downbeat && cd === (rootOfForm + 4) % 7) s -= 2.5;
    if ([3,4,8,9].includes(iv)) s += 1.5;                         // 3rds & 6ths are richer than bare 5ths/octaves
    if (prevCounter != null) {
      const cMove = c - prevCounter, mv = Math.abs(cMove);
      s += mv === 1 ? 2 : mv === 2 ? 0.8 : mv === 0 ? 0.5 : -0.6 * (mv - 2);   // a stepwise line; holding is fine
      if (melMove !== 0 && Math.sign(cMove) === -Math.sign(melMove)) s += 2;   // contrary motion — the two voices stay independent
    }
    if (s > bestScore) { bestScore = s; best = c; }
  }
  return best;
}

// write the counter-line for a whole melody. `melody` = [{deg, dur}] (scale degrees, any
// octave). `structural` = [{atIndex, root}] the placed chords the line must form at those
// melody indices (the cadence pillars + opening); between them the line is free to prolong
// the last placement or walk through emergent chords. Returns [{deg,dur}] counter-line +
// the chord each pair forms, for inspection.
// Write the lower voice against the whole tune. Each melody note carries `hold` (this bar SITS on
// one chord) and `chord` (that bar's placed-chord root). A musician holds the harmony at the points
// of repose — the opening tonic, the cadences — where the ear wants the chord to land and settle,
// and lets it MOVE through the body of the phrase, where the interest is and where we were losing it
// to one-chord-per-bar. So held bars keep the counter inside the placed chord (it plays around it);
// moving bars set it free to form new chords as it steps against the tune.
// `melody` here is the sequence of counter SLOTS — one per note the LOWER voice will play, at ITS
// own (harmonic) rhythm, not per melody note. Each slot carries the tune-note sounding at that moment
// (`deg`), whether the bar is `hold`, its placed `chord`, and whether it's a `downbeat`.
export function counterLine({ melody, mode = 'maj', lo = -4, hi = 4, dir = -1 }) {
  const scale = SCALE[mode] || SCALE.maj;
  const onSide = (x, md) => dir < 0 ? x < md : x > md;         // the counter's side of the tune
  const out = [];
  let prevCounter = null, prevMel = null;
  for (let i = 0; i < melody.length; i++) {
    const { deg: melDeg, dur, hold, chord, downbeat } = melody[i];
    const restrictChord = hold ? chord : null;                 // held bar -> stay in the placed chord; moving bar -> free
    let c = chooseCounter({ melDeg, prevMel, prevCounter, restrictChord, downbeat, dir, scale, lo, hi });
    if (c == null) {
      // the tune is on a NON-CHORD (passing) tone here: the counter simply HOLDS its own chord tone and
      // lets the tune pass over it — the momentary dissonance is the tune's, off the beat, idiomatic.
      if (prevCounter != null && isConsonant(melDeg, prevCounter, scale)) c = prevCounter;
      else { let bc = null, bd = 1e9; for (let x = lo; x <= hi; x++) if (onSide(x, melDeg) && isConsonant(melDeg, x, scale)) { const d = Math.abs(x - (prevCounter ?? melDeg + 3 * dir)); if (d < bd) { bd = d; bc = x; } } c = bc != null ? bc : (prevCounter ?? melDeg + 3 * dir); }
    }
    const forms = chordsContaining(((melDeg % 7) + 7) % 7, ((c % 7) + 7) % 7);
    const cr = chord == null ? -1 : ((chord % 7) + 7) % 7;
    out.push({ deg: c, dur, chord: forms.includes(cr) ? cr : (forms[0] ?? null) });
    prevCounter = c; prevMel = melDeg;
  }
  return out;
}

// degree -> roman-ish label for inspection
export const ROMAN = { maj: ['I','ii','iii','IV','V','vi','vii°'], min: ['i','ii°','III','iv','V','VI','VII'] };

// exposed for the swap accompaniment (which sustains and only re-voices on harmonic need):
export { chooseCounter, isConsonant, chordsContaining };
export const scaleOf = mode => SCALE[mode] || SCALE.maj;
