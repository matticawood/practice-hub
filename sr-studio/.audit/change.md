## PREMISE-CHALLENGE
- What is a composer doing when they set a phrase's contour against its available range? Using the room they have. A small
  hand (a five-finger box, a fifth) is used WHOLE — the line spans valley to peak, all five fingers. A wide range needn't
  reach its extremes every piece — the line shapes WITHIN it, peaking a little below the top, starting/ending off the edges.
- Should the range-awareness of the contour exist at all? Yes — it is real: a composer genuinely fills a small hand more
  fully than a wide compass. What is WRONG is HOW it is applied: `narrowBox = (hi-lo)<=8` is a hard threshold that FLIPS the
  peak/valley fractions (peakF 1.0↔0.94, startF 0-0.12 ↔ 0.12-0.34, endF 0-0.14 ↔ 0.08-0.33) at a cutoff. A 9-semitone range
  behaves nothing like an 8-semitone one under it, though musically they are almost identical. That is the bimodal-box /
  bad-ruler antipattern the memory warns of.
- Alternatives:
  * Keep the threshold. REJECTED: it is exactly the flip-at-a-cutoff fault.
  * Remove range-awareness (fixed contour fractions). REJECTED: it is a genuine musical distinction (fill a small hand, shape
    within a wide one); dropping it loses real shaping.
  * CHOSEN: make the "how fully to use the range" a CONTINUOUS `fill` factor — ≈1 at a five-finger span, easing to ≈0 as the
    range widens — that interpolates the same peak/start/end fractions. Same endpoints as before, no cliff between them.

## COMPOSER-CHECK
- The decision: how far the contour reaches toward its range's extremes (peak, valley, start, end).
- How a composer reasons it: by how much room there is — a five-finger box is filled whole, a wide compass is shaped within;
  and this is a matter of DEGREE (a slightly wider range is shaped slightly less to its edges), not a switch.
- Refute it: is `fill` a proxy/threshold in disguise? No — it is a continuous function of the actual range `hi-lo` (fill =
  clamp((15-(hi-lo))/7,0,1)): a fifth → fill≈1 (reach the extremes), widening → fill eases to 0 (shape within). No cutoff
  flips the shape; the fractions move smoothly. The per-piece random spread (variety) is preserved and also scales.
- Verdict: EMERGENT — the contour's ambition falls out continuously from the available range, not a binary box.

## EMERGENCE
Derives from the actual pitch range `hi-lo`: a continuous `fill` (1 at a five-finger span, 0 at a wide compass) scales the
peak fraction (reach the top vs just below) and the start/end fractions (from the edges vs off them). Read from the material.

## PREFERENCE
Still a per-piece weighted spread (the random start/end within a fill-scaled band) — a small hand LEANS to spanning the box,
a wide range LEANS to shaping within, both with genuine variety; and the scaling is smooth, so no two near-equal ranges are
shaped categorically differently.
