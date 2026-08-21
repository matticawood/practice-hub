# Audit — fingering by SPAN + GESTURE: placement core (one hand) + gesture reasoner (travels)

## RENDERED
- g2fix_a/b/c.cropped.png — three GRADE 2 pieces (whole line fits one hand → placement core).
- g3mix.cropped.png — D major, GRADE 3: LH one position (placed), RH travels — span decides, not grade.
- tv1 (G3 C 2/4), tv2 (G3 F Alla marcia), tv4 (G4 Dm 6/8) — TRAVELLING hands, now fingered by the GESTURE reasoner.

## AUDIT

The three grade-2 pages, read as an editor. g2fix_a (G major, G-A-B-C-D position): RH prints ONE finger — "1" on the
opening G4 (thumb on the position's lowest note); the whole staccato line stays in that five-finger box and needs no
further mark. LH prints ONE "5" on the opening G3 (little finger on the lowest note). g2fix_b (F major, hand placed on
the DOMINANT position C-D-E-F-G, not the tonic — the composer put the chord roots under the hand): RH "1" on the opening
C4, LH "2" on its opening F3; both single, both correct for the placement, the lines hold the box. g2fix_c (G minor,
G-A-Bb-C-D): RH "1" on G4, LH "3" on its opening Bb3; the raised leading tone (F#) that appears at the cadence takes the
SAME finger as its natural ^7 base (the hand does not move to raise it) — no thumb-grab, no wobble, exactly how a player
plays it. Across 200 generated grade-2 pieces: ZERO same-pitch wobbles (the whole g2 fault class is gone by construction),
exactly 1.00 printed marks per hand (the opening placement), 0 invalid. Dynamics, slurs, staccato all coherent and
unaffected. The fingering now reads the way a player fingers a five-finger piece: told where the hand sits, each note the
finger on its degree.

## VERDICT
Fingering now branches on HAND SPAN, not grade — a player sees whether the line fits under one hand, not what grade it is.
Where a hand's line sits within one five-finger position (≤4 diatonic degrees, chromatics folding to their base), the hand
is placed and each finger is read off it (fingerFixedPosition: RH thumb on the lowest degree, LH little finger on the
lowest; a raised leading tone folds to its base finger); where it reaches beyond one hand it travels (the cost-DP, for now).
This removes the guess wherever the hand stays put, at EVERY grade, so the frame-wobble and leading-tone-on-thumb faults
cannot arise (one degree = one finger). The placement is the composer's ex._pos where it fixed one (the fixed grades), else
the natural placement on the notes. Verified: routing split by span — G2 300/300 hands placed (0 wobbles), G3 42 placed /
258 travelling, G4 44 / 256, all 0 wobbles in placed; 150/150 valid each at g2/g3/g4, 0 fingering crashes. g3mix confirms
a placed LH (one opening mark, held) and a travelling RH on the same page.

TRAVELLING hands now go to the GESTURE reasoner (fingerHand), not the cost-DP — a player fingers a travelling line by
gesture idiom (scale = conventional key fingering, thumb off black; arpeggio = chord shape; leap = reposition), carrying the
hand. Verified against the DP on 850 travelling hands: same-finger-across-a-leap (a real can't-play fault) 15→1; the real
scales the DP botched (F major 1-3-1…, Eb 4-3-4 wobble, a 2-2 step slide) now finger conventionally (1-2-3-4-1-2-3, thumb
off black); 22/22 canonical scale/arpeggio cases pass; 150/150 valid at every grade, 0 crashes; tv1/tv2/tv4 render with
sparse reposition marks at sensible points and the Dm cadential C# handled without a thumb-grab. HONEST residual: the
gesture reasoner shows more thumb-on-black-in-a-step than the DP (~419 FORCED = the black note is the position's lowest, an
editor plays those with the thumb; plus ~325 flagged avoidable, itself inflated by a window spanning sub-positions) and a
few more weak-finger jams (66 vs 24). Both trace to fingerHand's POSITIONAL sub-gesture core (its posFingerRun) — the one
part that isn't the clean placement logic. NEXT juncture: unify fingerHand's positional sub-gestures with the placement core
(same read-off-the-hand reasoning used for a whole-hand line), which removes the avoidable thumb-on-blacks and the jams
while keeping the correct scale/arpeggio idioms. Follow-up: ex._pos threaded live; a bank piece without it reconstructs the
frame from its notes (still one position, never the DP guess).
