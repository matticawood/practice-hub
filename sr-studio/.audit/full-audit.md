# Audit loop — Cycle 20 (BUILD: compound time 6/8 — the port had dropped it)

## RENDERED
- 6/8 barcarolle: scratchpad/c68_1..4.cropped.png (singing), c68b2 (gentle, A major).
- 6/8 jig: scratchpad/c68b1.cropped.png (dance, G major, Allegretto).

## AUDIT
Matthew corrected two things: 16-bar forms are NOT a gap (grades 2-4 have set bar counts, already done), and compound time
is REQUIRED grade-4 content that I wrongly called "unbuilt / optional". Tested it instead of asserting: enabling 6/8 gave
0% valid, and the reason was concrete — the melody-rhythm generator produced simple-beat rhythm (notes at 0,1,2) instead of
compound (0, 1.5), so the validator rejected "rhythm crosses a beat". The OLD generator had full 6/8; the composer-model
port dropped it.

BUILT (through the gate, verified): the beat length is computed from the metre (dotted crotchet 1.5 for 6/8); barRhythm /
drawBeat / beatSegs made beat-length-aware (compound subdivisions summing to 1.5; beat cuts at multiples of 1.5); the
phrase-end broaden fills barU quarter-units (was returning a 2-quarter note in a 3-quarter bar — the cascade culprit);
6/8 added to the compound-lilt characters (singing/flowing/gentle barcarolle, lively/dance jig); 3/8 deferred.

VERIFIED at scale: 6/8 0% -> 100% valid; all grades 100% valid; 6/8 ~26% of grade 4 across 5 characters. VERIFIED in
notation: c68b1 (dance) is a lively jig (running quavers/semis beamed in threes, staccato, mf); c68b2 (gentle) is a soft
barcarolle (legato quavers, p) — genuinely different characters, both correct 6/8 (dotted-crotchet beats, three-quaver
beaming, oom-pah/broken LH grouped correctly).

## VERDICT
Cycle 20: compound time (6/8) BUILT and working at grade 4 — the real thing the port dropped. Diagnosed by testing/looking,
not asserting. Remaining refinements (named): 3/8 coverage, compound-specific melodic figures, compound frequency tuning.
