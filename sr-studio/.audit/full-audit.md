# Audit loop — Cycle 22 (FIX: compound accompaniment subdivision — alberti + broken now ripple in threes)

## RENDERED
- 6/8 alberti (post-fix): scratchpad/aud68b.cropped.png — A major, 6/8, Andante cantabile, singing, alberti.
- Also: alb68 (B minor gentle alberti), brk68 (D major singing broken) — both post-fix.

## AUDIT
Bar by bar, both hands (aud68b, A major 6/8 singing alberti; barU=3 = two dotted-crotchet beats).
RH (melody):
  b1: A3(crotchet, f4, pp, slur) G#3(quaver) G#3(quaver) A3(crotchet). Beat1 = [1,0.5] crotchet-quaver LILT, beat2 = [0.5,1]
     quaver-crotchet. A-G#-G#-A: G# is ^7 (diatonic in A major). A genuine compound lilt. RIGHT.
  b2: C#4(cr) D4(qv) E4(qv) D4(cr). [1,0.5][0.5,1]. RIGHT. b3: D4 E4 F#4 D4. b4: B3 C#4 D4 E4. b5: F#4 E4 E4(p) F#4.
  b6: G#4(TENUTO --) F#4 F#4 E4 — the peak G#4 leaned (tenuto), correct. b7: E4 D4 B3 C#4. b8: A3(dotted crotchet, pp,
     slur-end) rest — the tonic close, held then a compound breath. RIGHT. Melody rhythm is compound-clean (1, 0.5, 1.5 only).
LH (alberti — THE FIX):
  b1: A2 C#3 E3 | G#2 C#3 E3 — SIX quavers, THREE per beat, an ascending ripple (A-C#-E then G#-C#-E), beamed in threes.
     b2-b7 likewise (three quavers a beat). b8: A2+C#3 (dotted-crotchet dyad) + rest. Every beat is the flowing 6/8 murmur,
     NOT the old dotted-quaver pairs. Harmony: A major (I) / V (E-G#-B, G# the leading tone, sharp) — clear A major. RIGHT.
  Fingering: LH 5 on the low note per beat, thumb/2 on the upper ripple tones — playable. RIGHT.

THE FIX VERIFIED at scale: 6/8 alberti LH durations are now 0.5 (quavers), no 0.75; broken LH 0.5/1.5, no 0.75 (was 37%);
all grades 100% valid. In notation the LH reads as flowing quavers grouped in threes (aud68b, alb68, brk68).

## OPEN (found this cycle, named honestly, NOT chased): the MELODY decoration passes still emit some non-compound values —
65% of 6/8 pieces have a 2-quarter note (a crotchet-tied-quaver crossing the beat — renders as an acceptable SYNCOPATION,
e.g. tied across a barline) and some 0.75 dotted-quavers appear (a binary split leftover in the gap/decoration pass, not in
barRhythm which is compound-clean). This piece happened to be clean; others are not. Next: trace which melody decoration/
gap pass produces 0.75 / 2 in compound and make it subdivide the beat in three; confirm the 2-quarter syncopations are
intended, not artefacts. LOOK at the ones that have them.

## VERDICT
Cycle 22: the compound ACCOMPANIMENT defect (alberti + broken subdividing the beat in two → dotted-quaver pairs) is FIXED —
both now ripple in three quavers, verified at scale and in notation. Oom-pah left (plain dotted crotchets, valid). Remaining:
the melody decoration's occasional non-compound values (named above), to trace and fix next.
