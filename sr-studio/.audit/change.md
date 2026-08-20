## PREMISE-CHALLENGE
- What is a composer doing with a broken-chord / alberti accompaniment in 6/8? Rippling the chord in QUAVERS grouped in
  THREES — the compound beat is a dotted crotchet that divides into three quavers, so the murmur is three notes per beat (a
  flowing low-mid-high ripple), not two. That three-quaver ripple IS the 6/8 accompaniment feel.
- Should this be changed, or a different approach? The accompaniment currently subdivides the beat in TWO (`per = beatLen/2`
  = a dotted quaver, 0.75, in compound), giving a stiff dotted-quaver PAIR per beat — which reads as un-compound (a note-by-
  note look at a rendered 6/8 alberti caught this; validity did not). Case for leaving it: none — dotted-quaver pairs are not
  the 6/8 murmur; a composer writes the broken chord in threes. Case for a different approach: the subdivision must follow
  the beat's OWN division — a simple beat halves (two quavers), a compound beat thirds (three quavers). So the fix is to
  make the alberti subdivide by the beat's division (2 vs 3), derived from the beat being ternary, not a special compound
  pattern bolted on.
- Why this wins: it makes the murmur emerge from the beat's real division — the same alberti idea (a rippling broken chord
  under the tune), now with the beat divided the way the metre actually divides it. What it MISSES, honestly: (1) it fixes
  the ALBERTI here; the broken texture's occasional beatLen/2 thickening has the same flaw and is a SEPARATE next edit,
  verified separately; (2) the oom-pah (one dotted crotchet per beat) is plain but valid and not touched here; (3) it does
  not add compound-specific broken FIGURES beyond the three-quaver ripple.
- Verdict: EMERGENT — the number of notes per beat is the beat's own division (2 for a crotchet beat, 3 for a dotted-crotchet
  beat), read from the beat length; the ripple is the same broken-chord idea, not a stamped compound figure.

## COMPOSER-CHECK
- The decision: how many notes the alberti murmur plays per beat (the beat's own division) and hence the note length —
  a BY-CONSTRUCTION property of the metre (a crotchet beat divides in two, a dotted-crotchet beat in three), not a lean.
- How a composer actually reasons it: the murmur fills the beat with its subdivision — a crotchet beat splits into two
  quavers, a dotted-crotchet (compound) beat into three. So a compound alberti is a three-quaver ripple per beat (low-mid-
  high), each quaver = beatLen/3.
- Refute it: is "three per compound beat" a stamped pattern? No — 3 is the compound beat's own division (a dotted crotchet
  IS three quavers); the note length is beatLen/3, read from the beat. The pitch pattern is the same rising broken-chord
  ripple the alberti already builds from its chord tones. What it still does NOT do: the broken-texture thickening, and any
  richer compound figure (named, deferred).
- Verdict: EMERGENT — the subdivision count and note length come from the beat's division; nothing is a fixed compound cell.

## EMERGENCE
The alberti splits each beat into as many quavers as the beat divides into: two for a crotchet beat (beatLen/2), three for a
dotted-crotchet compound beat (beatLen/3). The note length and count are read from the beat length; the pitches are the
chord's own tones rippled low-mid-high, exactly as the simple-metre alberti builds them.

## PREFERENCE
Only the compound case changes (three quavers where the beat is a dotted crotchet); the simple-metre alberti (two quavers a
beat) is untouched. The pitch figure remains the chord-tone ripple, not a new pattern. Where a chord gives fewer than three
tones in range, it still ripples what it has (never a drone), as before.
