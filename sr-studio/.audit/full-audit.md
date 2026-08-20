# Audit loop — Cycle 26 (3/8 ENABLED and made good — it is required grade-4 content)

## RENDERED
- 3/8 scherzo: scratchpad/c27_2.cropped.png — A minor, 3/8, Scherzando, block (post monotony-fix).
- Also c27_1 (C major dance broken), c27_3 (Eb scherzo rootfifth); pre-fix c26_1..4 (all monotone).

## AUDIT
Matthew's correction: 3/8 is NOT low value — it is required grade-4 syllabus content ("in grade four these have to show
up"). I had made the same checkbox lapse as 6/8 (declaring required content optional because the current output was thin).
The thinness is a QUALITY problem to fix, not a reason to skip. So: enable 3/8 AND make it good.

STEP 1 — ENABLED: un-filtered 3/8, and added it to the fast characters whose feel it is (scherzo, dance, lively — a quick
one-in-a-bar). Now 100% valid, drawn ~19% of grade 4, across those three characters (no more all-singing fallback).

STEP 2 — the MONOTONY diagnosed and fixed. Measured: 86% of 3/8 pieces had <= 2 distinct bar-rhythms across the whole piece
(rendered examples: the same crotchet-quaver or [1,0.25,0.25] every bar, a bare rising scale). CAUSE: a 3/8 bar is ONE
dotted-crotchet beat, so sentence-form's "repeat the germ" makes IDENTICAL bars — in a one-beat metre a repeated germ has no
within-bar structure to read as unity. FIX (compose.mjs barCell): for nbeats == 1, lean the bars to VARYING the beat
(variant/fresh) rather than restating the germ, the germ still opening the idea; multi-beat metres keep their germ-repetition.
VERIFIED: monotone 86% -> 27%, avg distinct bar-rhythms 3.2, 4/4 unaffected (0% monotone, 6.0 distinct), 100% valid.

IN NOTATION (c27_2, scherzo 3/8): now VARIED bar-rhythms — held dotted crotchets, crotchet-quaver, three-quaver runs — with
a G# leading tone, a playful scherzo character over block chords. Reads as a real, varied one-in-a-bar scherzo, not a
mechanical scale. RIGHT. (LH is one chord/note per bar — structural to a one-beat bar, appropriate for a light fast metre.)

## VERDICT
Cycle 26: 3/8 is now ENABLED (required content, showing up with the right characters) and MADE GOOD (monotony 86% -> 27%,
reads idiomatically). The right outcome: make required content appear AND be good, not decline it. NOTE: compound is now
~40% of grade 4 (6/8 + 3/8) — both required, but watch whether it wants weighting toward simple. Remaining optional polish:
richer compound accompaniment; the residual 27% 3/8 monotony could be pushed lower.
