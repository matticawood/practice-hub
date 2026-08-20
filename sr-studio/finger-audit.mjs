// FINGERING AUDIT — every PHYSICAL contradiction in a fingered hand, so no illogical finger can hide. A fault here is
// not a preference (thumb-on-black in an arpeggio is fine, a wide reach is fine) — it is a move a hand CANNOT make:
// a legato step whose finger travels the wrong way (or slides one finger across two pitches), a skip played with one
// finger, a chord wider than the hand. Rests lift the hand, so a transition across a rest is always free.
//
// The rules (adjacent SOUNDING notes A→B in one hand, no rest between; fingers fA,fB shown or solver-derived):
//   OOB    finger outside 1..5.
//   STEP   |Δ| <= 2 semitones, different pitch: the finger must move WITH the pitch by one (asc→+1, desc→−1) OR cross
//          (ascending onto the thumb =1, descending onto 5). Same finger on a moving step = an impossible slide;
//          wrong direction / a skipped finger = a tangle.
//   SKIP   a 3rd..5th (3..7 semis): different fingers, and the finger moves WITH the pitch OR crosses (asc→1 / desc→5).
//          Same finger on a skip cannot be played.
//   LEAP   a 6th+ (>=8 semis): the hand repositions — free (no fault).
//   CHORD  the outer span must fit the hand (<= an octave for these grades); a member interval needs enough fingers.
import { fingerHandDP as fingerHand } from './fingering.mjs';   // the DP solver is now the authority (engine.mjs resolveFingering)

const isBlack = m => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
const LET = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const scaleOf = ex => { const t = ((LET[ex.key[0]] + (ex.key[1] === 'f' ? -1 : ex.key[1] === 's' ? 1 : 0)) % 12 + 12) % 12;
  return (ex.mode === 'min' ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]).map(x => (t + x) % 12); };

export function auditFingering(ex) {
  const faults = [];
  const scaleArr = scaleOf(ex);
  const scale = new Set(scaleArr);
  const chromatic = m => !scale.has(((m % 12) + 12) % 12);   // a non-scale tone (almost always the raised leading tone): an INFLECTION, not a hand move
  for (const [seqKey, hand] of [['rh', 'rh'], ['lh', 'lh']]) {
    const notes = ex[seqKey], base = fingerHand(notes, hand, scaleArr), fings = base.fings;   // base fingering (WITH consistency) = what the renderer shows
    // the refinger counterfactual must compare like-for-like: the PIN path skips the consistency preference, so its
    //   baseline must be the RAW optimum too (an empty pin map = truthy → consistency skipped, no notes pinned), not
    //   base.effort (which carries up to CONSIST of consistency inflation and would make every pin look "free"). [measure the real defect]
    const rawBase = fingerHand(notes, hand, scaleArr, true, new Map()).bv;   // RAW optimum TOTAL cost (no consistency, no pins)
    // build the sounding sequence with original index (to detect rests = a lifted hand between)
    const R = [];
    notes.forEach((n, i) => { if (n.rest) return; const arr = Array.isArray(n.m) ? n.m : [n.m];
      let f = fings[i];
      const outer = hand === 'rh' ? Math.max(...arr) : Math.min(...arr);
      const outerF = Array.isArray(f) ? (hand === 'rh' ? f[arr.indexOf(Math.max(...arr))] : f[arr.indexOf(Math.min(...arr))]) : f;
      R.push({ i, arr, chord: arr.length > 1, outer, f: outerF, allF: Array.isArray(f) ? f : [f] });
    });
    // per-note: OOB + chord span/grip + thumb/pinky-on-black
    // an OUTER finger on a black key is only a fault when it was AVOIDABLE. At a local EXTREME in that finger's own
    //   reaching direction (RH thumb=low / pinky=high; LH thumb=high / pinky=low), or at a phrase edge/after a rest, the
    //   outer finger MUST take the outer note whatever its colour — the bass note / phrase peak is dictated by the music,
    //   nothing else reaches past it (the chord-grip exception, generalised). Only a MID-run black (a passing note you
    //   could have re-timed the crossing to land on white) is the real fault. [reasoned, not literalised — data: 708/710
    //   flagged pinky-blacks were forced extremes]
    for (let ri = 0; ri < R.length; ri++) {
      const r = R[ri];
      for (const f of r.allF) if (f != null && (f < 1 || f > 5)) faults.push({ hand, type: 'oob', at: r.i, detail: `finger ${f}` });
      if (!r.chord && (r.f === 1 || r.f === 5) && isBlack(r.outer)) {
        const pv = R[ri - 1] && R[ri - 1].i === r.i - 1 && !R[ri - 1].chord ? R[ri - 1].outer : null;
        const nx = R[ri + 1] && R[ri + 1].i === r.i + 1 && !R[ri + 1].chord ? R[ri + 1].outer : null;
        const highSide = (hand === 'rh') === (r.f === 5);           // this finger reaches the HIGH side here (RH pinky / LH thumb)
        const forced = pv == null || nx == null                     // edge / rest-adjacent: hand is free, note is forced
          || (highSide ? (r.outer >= pv && r.outer >= nx) : (r.outer <= pv && r.outer <= nx));   // local extreme in the finger's direction
        if (!forced) faults.push({ hand, type: r.f === 1 ? 'thumb-on-black-key' : 'pinky-on-black-key', at: r.i, detail: `${r.f === 1 ? 'thumb' : 'little finger'} on a black key mid-run` });
      }
      if (r.chord) {
        const span = Math.max(...r.arr) - Math.min(...r.arr);
        if (span > 12) faults.push({ hand, type: 'chord-span', at: r.i, detail: `${span} semis` });
      }
    }
    // pairwise transitions (no rest between = adjacent original indices)
    for (let k = 1; k < R.length; k++) {
      const a = R[k - 1], b = R[k];
      if (b.i !== a.i + 1) continue;                 // a rest (or a note we skipped) lifts the hand → free
      if (a.chord || b.chord) continue;              // a CHORD is a grip placed as a unit — the hand LIFTS to/from it (oom-pah bass↔pah), so the linear step/skip direction rules don't apply; the chord's own playability is the span check
      if (a.f == null || b.f == null) continue;      // no mark shown on one side → nothing asserted
      const dp = b.outer - a.outer, semis = Math.abs(dp);
      if (semis === 0) continue;                     // repeated pitch: same finger is correct, different is a substitution (both fine)
      // a chromatic INFLECTION (a semitone where one note is off-scale — the raised leading tone) is played by the SAME
      //   finger without moving the hand: same finger is correct and the direction rules don't apply. Exempt it.
      if (semis <= 1 && (chromatic(a.outer) || chromatic(b.outer))) continue;
      const up = hand === 'rh' ? dp > 0 : dp < 0;    // moving toward the pinky (5) for THIS hand
      const df = b.f - a.f;                          // change in finger number
      const towardPinky = up ? df > 0 : df < 0;      // finger moved pinkyward
      // a legit CROSS: going PINKYWARD, the thumb passes UNDER — the new note takes the thumb (fB===1); going THUMBWARD, a
      //   LONG finger (3/4/5) crosses OVER the thumb — the previous note WAS the thumb (fA===1). Finger 2 over the thumb
      //   is too tight to be a real cross (Matthew: thumb→2 a step below is basically impossible), so it is NOT exempt.
      const cross = up ? b.f === 1 : (a.f === 1 && b.f >= 3);
      if (semis <= 2) {                              // STEP
        // sliding a finger OFF a black key onto its adjacent white neighbour is an idiomatic technique — not a slide fault.
        const slideOffBlack = isBlack(a.outer) && !isBlack(b.outer);
        // a hand REPOSITION at a TURNING POINT: the line reverses at b, and the OUTER finger pivots onto that local extreme
        //   (RH thumb at a valley / pinky at a peak; LH mirrored) — the hand lifts and re-anchors for the new direction, so
        //   the finger "skip" is a re-placement, not a slid step (the thumb pivots at the bottom of a descent-then-ascent).
        //   Idiomatic; not a tangle. [reposition, not a fault — same principle as the outer finger taking a black extreme]
        const bNext = (R[k + 1] && R[k + 1].i === b.i + 1 && !R[k + 1].chord) ? R[k + 1].outer : null;
        const reverses = bNext != null && Math.sign(bNext - b.outer) === -Math.sign(b.outer - a.outer);
        const loF = hand === 'rh' ? 1 : 5, hiF = hand === 'rh' ? 5 : 1;
        const pivot = reverses && ((b.outer < a.outer && b.f === loF) || (b.outer > a.outer && b.f === hiF));
        if (b.f === a.f && !slideOffBlack) faults.push({ hand, type: 'step-slide', at: b.i, detail: `${a.f}→${b.f} on a step` });
        else if (!cross && !pivot && (!towardPinky || Math.abs(df) !== 1)) faults.push({ hand, type: 'step-dir', at: b.i, detail: `${a.f}→${b.f} ${up ? 'asc' : 'desc'} ${semis}st` });
      } else if (semis <= 7) {                       // SKIP (3rd..5th)
        if (b.f === a.f) faults.push({ hand, type: 'skip-same', at: b.i, detail: `${a.f}→${b.f} on a ${semis}st skip` });
        else if (!cross && !towardPinky) faults.push({ hand, type: 'skip-dir', at: b.i, detail: `${a.f}→${b.f} ${up ? 'asc' : 'desc'} ${semis}st` });
      } else {                                        // LEAP (6th+): the hand repositions — but you LIFT and re-place, so
        if (b.f === a.f) faults.push({ hand, type: 'leap-same', at: b.i, detail: `${a.f}→${b.f} across a ${semis}st leap` });   // the SAME finger across a leap is a slide you can't make cleanly
      }
    }
    // ===== FINGERING SENSE (beyond legality — how an editor actually fingers) =====
    // (1) a RECURRING pitch inside a settled hand position keeps its finger. Re-fingering the same note a moment later,
    //     with no rest and no genuine reposition between (every note in the window stays within a 5th of it, so the hand
    //     plainly sat still), is an unnecessary change no editor writes. [idiom, not legality]
    for (let k = 0; k < R.length; k++) {
      if (R[k].chord || R[k].f == null) continue;
      let departed = false;
      for (let j = k + 1; j < R.length && j <= k + 6; j++) {
        if (R[j].i !== R[j - 1].i + 1) break;                 // a rest between → the hand lifted, a fresh finger is fine
        if (R[j].outer !== R[k].outer) departed = true;       // the line LEFT the note (so a later change is a re-finger, not a repeated-note substitution)
        if (R[j].chord || R[j].f == null || R[j].outer !== R[k].outer) continue;   // wait for the SAME pitch to recur
        let stayed = true; for (let x = k; x <= j; x++) if (Math.abs(R[x].outer - R[k].outer) > 7) { stayed = false; break; }
        // NECESSITY test — a refinger is a fault ONLY if keeping the earlier finger is globally FREE (the DP just broke a
        //   tie inconsistently). If forcing it costs real effort, the hand genuinely HAD to reposition (the 84% a pianist
        //   really moves for), so it is correct, not a fault. [reasoned like a pianist: was the hand-move needed?]
        if (departed && stayed && R[j].f !== R[k].f) {
          const alt = fingerHand(notes, hand, scaleArr, true, new Map([[R[j].i, R[k].f]]));
          // GRATUITOUS only if forcing the earlier finger costs less than the consistency budget the reasoner itself uses
          //   (CONSIST≈1.0 TOTAL). A per-move threshold (0.03·N) scaled with length and over-flagged justified repositions
          //   costing 1.0–1.5 (a changed melodic role / a reach) as "free" — they are not. Fixed-total = the real defect:
          //   a truly-free recurrence the consistency pass should have unified. [measure the real defect, not a tie]
          if (alt.bv - rawBase < 1.0) faults.push({ hand, type: 'refinger', at: R[j].i, detail: `${R[k].f}→${R[j].f} recurring pitch, unifying is free (gratuitous)` });
          break;
        }
      }
    }
    // (2) the THUMB tucked UNDER onto a BLACK key mid-scale — a scale crosses the thumb onto WHITE keys, never black.
    //     (A five-finger POSITION anchored on a black tonic is a leap/start, not a tuck-under, so it isn't flagged.)
    for (let k = 1; k < R.length; k++) {
      const a = R[k - 1], b = R[k];
      if (b.i !== a.i + 1 || b.chord || a.chord || b.f !== 1 || a.f == null || a.f <= 1 || !isBlack(b.outer)) continue;
      const pinkyward = hand === 'rh' ? b.outer > a.outer : b.outer < a.outer;   // the thumb passed UNDER (ascending toward the pinky)
      if (pinkyward && Math.abs(b.outer - a.outer) <= 2) faults.push({ hand, type: 'thumb-black', at: b.i, detail: 'thumb under onto a black key' });
    }
    // (3) the outer finger on the WRONG EXTREME: the low-outer finger (RH thumb / LH pinky) is never on a PEAK, the
    //     high-outer (RH pinky / LH thumb) never on a VALLEY. You EXTEND to the top (3→4→5); you do not put the thumb on
    //     the highest note, nor cross under to it when 4 was right there. [pianist rule — what the eye catches]
    const lowOuter = hand === 'rh' ? 1 : 5, highOuter = hand === 'rh' ? 5 : 1;
    for (let k = 1; k < R.length - 1; k++) { const r = R[k]; if (r.chord || r.f == null) continue;
      const a = R[k - 1].i === r.i - 1 ? R[k - 1] : null, b = R[k + 1].i === r.i + 1 ? R[k + 1] : null; if (!a || !b || a.chord || b.chord) continue;
      if (r.outer > a.outer && r.outer > b.outer && r.f === lowOuter) faults.push({ hand, type: 'peak-wrong-finger', at: r.i, detail: `finger ${r.f} on a peak (extend, don't cross to the thumb)` });
      if (r.outer < a.outer && r.outer < b.outer && r.f === highOuter) faults.push({ hand, type: 'valley-wrong-finger', at: r.i, detail: `finger ${r.f} on a valley` });
    }
  }
  return faults;
}

// CLI: tally fault types across a batch
if (import.meta.url === `file://${process.argv[1]}`) {
  const { generateCompose } = await import('./compose-adapter.mjs');
  for (const g of [2, 3, 4]) {
    const tally = {}; let pieces = 0, notes = 0, withFault = 0;
    for (let it = 0; it < 1500; it++) { const ex = generateCompose(g); if (!ex) continue; pieces++;
      notes += ex.rh.filter(n => !n.rest).length + ex.lh.filter(n => !n.rest).length;
      const F = auditFingering(ex); if (F.length) withFault++;
      for (const f of F) { const k = `${f.hand} ${f.type}`; tally[k] = (tally[k] || 0) + 1; } }
    const total = Object.values(tally).reduce((s, x) => s + x, 0);
    console.log(`GRADE ${g}: ${pieces} pieces, ${(100 * withFault / pieces).toFixed(0)}% have >=1 fault; ${(1000 * total / notes).toFixed(1)} faults/1000 notes`);
    Object.entries(tally).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`   ${String(n).padStart(5)}  ${k}`));
  }
}
