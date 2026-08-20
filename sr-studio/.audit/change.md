## PREMISE-CHALLENGE
- What is a composer doing when a phrase breathes at a cadence in 6/8? Lifting the line so the last note ends ON a beat and
  a rest of a whole beat (a dotted-crotchet rest) follows — the breath is a clean beat, not a note hanging over into the
  next beat. The breath is measured in BEATS, and the compound beat is a dotted crotchet (1.5), not a crotchet.
- Should the breath change, or a different approach? The breath currently carves the rest in QUARTER units (want = 1 or 0.5)
  regardless of metre, so in 6/8 a whole-bar phrase-end note (3) gets carved by 1 -> a 2-quarter note that ends mid-beat-2
  (at a simple beat-3 position) plus a 1-quarter rest — a hanging, off-beat phrase ending (seen in a rendered piece: the
  note holds over the beat by a quaver then rests). Case for leaving it: none — a compound breath should land on the beat.
  Approach: carve a whole BEAT (beatLen) in compound so the shortened note still ends on a beat and the rest is a full
  dotted crotchet; the simple-metre carve (a crotchet or quaver lift) is correct and unchanged.
- Why this wins: the breath length becomes the metre's own beat (a crotchet in simple, a dotted crotchet in compound), so
  the note ends on a beat and the rest is beat-aligned, in both metres. What it MISSES, honestly: (1) it fixes the BREATH's
  2-quarter carve, AND the ANACRUSIS pickup (traced: 100% of the stray 0.75 dotted-quavers come from the pickup splitting a
  beat in half, p/2) — same compound-subdivision principle, fixed to a rising three-quaver run (or crotchet+quaver) in
  compound; (2) it drops the compound "half-beat clip" for a detached line here (a
  compound half-beat is a quaver, an off-beat lift handled by the motivic-air clip, not the phrase breath).
- Verdict: EMERGENT — the carve length is the metre's beat (beatLen), read from the metre; the note ends on a beat by
  construction. Nothing is a fixed compound value stamped on.

## COMPOSER-CHECK
- The decision: how much rest a phrase-end breath carves off the last note — a whole beat, in the metre's own beat length.
- How a composer actually reasons it: a phrase breathes a beat; the note ends on a beat and a beat's rest follows. In
  compound the beat is a dotted crotchet, so the carve is 1.5, not 1 — otherwise the note ends off the beat.
- Refute it: is "carve beatLen in compound" a stamped constant? No — beatLen IS the metre's beat (the value the whole core
  is parameterised by); carving one beat keeps the note beat-aligned by construction. The simple-metre carve (crotchet or
  quaver lift, character-dependent) is untouched. What it still does NOT do: the decoration pass's 0.75 (separate); a
  sub-beat compound clip (a quaver breath) if ever wanted.
- Verdict: EMERGENT — the carve is one of the metre's own beats; it falls out of beatLen.

## EMERGENCE
The breath carves a rest of one beat = beatLen (a crotchet in simple, a dotted crotchet in compound). The note already must
end on a beat (checked against beatLen), so after carving a whole beat it still ends on a beat and the rest is a whole beat.
The amount is read from the metre's beat, not a fixed duration.

## PREFERENCE
Only the compound case changes (carve a dotted-crotchet beat); the simple-metre breath (a crotchet or quaver lift by
character) is unchanged. The breath still fires only where the character breathes (breathLean) and only on a note that
ends on a beat and is longer than a beat; elsewhere no carve.
