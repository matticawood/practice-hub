# Build Status — the grade-agnostic composer engine

Resume from here. This is the single source of "what is done / what remains / how to do the rest" so the work never has to be reverse-engineered. Companion files: **RULES.md** (the complete music rulebook, every rule tagged LAW/CONVENTION and audited both sides) and **grade-params.mjs** (the grade parameter table).

## The vision
The generator embodies the complete, real rules of music (grade-agnostic, pinpoint), and **grade is only a parameter** selecting which features are active and how hard. Same engine writes grade 1..8. Never cut/fake a real rule "because this grade does not need it" (that hard-codes a grade-N tool). A restriction that breaks output when removed is a **real capability not built yet, faked by the restriction** — it goes on the roadmap below; grade then parameterises the real capability.

## Architecture
- **Rules** live in `generator.mjs` (+ documented in RULES.md), grade-agnostic.
- **Parameters** live in `grade-params.mjs` (`gradeParams(g)` folds cumulative 1..g). Every rule reads its grade-variable limit from here.
- **Grade** is the lens: the generator reads `gradeParams(grade)` and never hard-codes `grade===N`.

## STATUS

### DONE (derived, audited both sides, verified against output)
- Rest placement (R1-R4), Harmony (H1-H7, incl. V7→vi widened), Melody (M1-M9, incl. minor aug-2nd fixed), Rhythm/motif (RH1-RH7, motif no-op fixed), Interpretive (tenuto/accent/staccato/dynamics/slur/fermata, tenuto+fermata widened), Texture voice-leading (TX1). See RULES.md.
- Grade parameter table built (`grade-params.mjs`), grades 2-4 values validated against current output.

### IN PROGRESS — rewiring the generator to READ from grade-params (grade-agnostic)
Replace scattered `grade===N` inline conditions with reads from `gradeParams(grade)`, testing each change leaves grades 2-4 output UNCHANGED. `buildCandidate` now computes `const gp = gradeParams(grade)` at its top (generator.mjs ~487). Progress:
- [x] expression flags (tenuto, fermata) ← `gp.expression.tenuto/fermata` (verified: 0 at G2-3, present G4; clean held)
- [x] chromatic passing-note gate ← `gp.chromatic.budget>0` (verified: device stays G4-only)
- [x] hand position `wide` ← `!gp.range.fixedPosition` (verified clean, position unchanged)
- [x] bar count `nbars` ← `gp.bars[time]` (verified 50/50 correct per grade)
- [x] minor availability `isMin` ← `gp.keys.modes.includes('min')` (verified minor still appears)
- [x] accent ← `gp.expression.accent` (SYLLABUS: accents from grade 1; table + code corrected; output unchanged, verified)
- [x] syncopation (displace) ← `gp.rhythmDevices.syncopation` (SYLLABUS: grade 5+, NOT grade 4; removed from G4, verified)

### grade-params.mjs is now TRANSCRIBED from the OFFICIAL ABRSM spec (Qualification Specification p.16, "Sight-reading parameters"), Matthew supplied the table. Authoritative. Includes Initial + grades 1-8.
Key facts (cumulative): Initial 4/4,2/4 C maj/D min, hands SEPARATE 5-finger. G1 +3/4, +G,F/A, any 5-finger, dotted rhythms, slurs, ACCENTS, mf/mp, cresc/dim. G2 +D/E,G min, PLAYING TOGETHER, tied notes, pp. G3 +3/8, +A,Bb,Eb/B, OUTSIDE 5-finger, 2-note chords, semiquavers. G4 +6/8, anacrusis, chromatic, fermata, TENUTO. G5 +E,Ab/F#,C, syncopation, rit-at-end, ff. G6 +9/8,5/8,5/4, +C#,F, TRIPLETS, clef changes, pedal. G7 +7/8,7/4, tempo changes, 8va, una corda. G8 +12/8, +B,Db, 3-part chords, ornaments, accel.
- [x] Generator was making TRIPLETS at grade 4 (a syllabus violation — triplets are grade 6). FIXED: t3 FIGBANK figures gated by `gp.noteValues.triplets`; verified 0 triplets at G3-4.
- Remaining generator↔syllabus items to align (rewiring): key SETS (generator's KEYS/KEYS3 vs the exact per-grade key lists now in the table) · hands separate<G2 (generator always plays together — fine for G2+, matters if we ever generate Initial/G1) · note-value floors per grade from `gp.noteValues.min`.
- [ ] `times` (metre list) ← `gp.timeSignatures` (note: current code weights 6/8 x2; using gp drops that weighting — minor distribution change. also in generate() line ~2181)
- [ ] `keyset`/KEYS3 ← `gp.keys.maxAccidentals` (needs keysets bucketed by accidental count)
- [ ] mid-bar harmonic change (line ~612 `grade===4`) — needs a param (harmony.midBarChange)
- [ ] displace/syncopation (line ~1540 `grade>=4`) ← `gp.rhythmDevices.syncopation` (FIRST fix table: G3 currently says syncopation:true but code is G4 — reconcile with Matthew)
- [ ] dynamics `f` ceiling (line ~1714 `grade>2`) ← `gp.expression.dynamics`
- [ ] chord size ← `gp.chordMax` (engine.validate already enforces; align generator)
- [ ] suspension chance (line ~764 `grade===4?.30:grade===3?.12`) ← a param
Method: one condition at a time, `node`-test clean-rate + that the gated feature still only appears at the right grades. Watch: `n.alt` is used BOTH for the chromatic device AND for minor leading-tone spelling — do not conflate them in tests.

### ROADMAP — real capabilities the current restrictions FAKE (each grade-parameterised)
Each entry: the real RULE, the BUILD approach, the TEST (both sides), the PARAM it unlocks.

1. **Leap-recovery** (unlocks `leapCeiling`).
   Rule [LAW]: a leap goes between chord tones and is recovered by a step in the opposite direction; larger leaps need stronger recovery. Build: after any skeleton leap > a 3rd, force the next skeleton note to step back toward the leap's origin (not just cap size). Test: narrowing — 6th/octave leaps appear at high grades; leak — every leap > a 5th is followed by an opposite step (the check that failed the naive cap widening). Param: `leapCeiling` per grade (currently the 5th cap at line ~869 is the fake).

2. **Two-hand texture relationships** (unlocks `texture`).
   [x] **#5 fault fixed** (coordination WITHIN homophony): a detached/gapped accompaniment + a pointillist melody now share the quaver granularity (`calmMel` extended: `detachedAcc && restMoves has offbeat/displace`).
   [x] **SWAP right-hand accompaniment rebuilt** (Matthew: I put a bass Alberti in the RH, and then "six whole-bar patterns" is not vocabulary). Now there is an **RHBANK** (33 real RH-accompaniment figures across metres/feels: repeated/dotted/half-bar/sustained chords, afterbeats, broken arpeggios, murmur, struck+lift), and a swap piece draws a PRIMARY figure + varies among compatible neighbours across bars (~1 in 3), all VOICE-LED (prevSwapTop), never a bass Alberti. Verified clean 80/80. **GROW THIS BANK** — more figures = more diverse; then fragment-level combination + countermelodies.
   Register TODO: swap LH melody can climb above middle C (G4) — pull it down so the tune centres lower with the accompaniment above.

**MAJOR G5+ CAPABILITY — the VOICES MODEL (Matthew).** Higher grades move from homophony to PART-WRITING: multiple independent voices, INNER MELODIES, countermelodies, and counterpoint (up to imitation). Syllabus backs it: 4-part chords (2/hand) at G5, 3-part in either hand at G8. Architecture: generalise "melody + accompaniment" into N voice-led voices where voice-count + independence are GRADE PARAMETERS (2/homophonic low; 4/contrapuntal high). The countermelody flagged as missing from RHBANK is the on-ramp (the first inner voice). This subsumes the texture-relationships roadmap item above.

### Material growth — MELODY (in progress; Matthew: melody is the thinnest bank)
- [x] **Contours** grown 4→10 shapes (arch/archlate/archearly/wave/rise/fall/valley/terraced/double/plateau/gapfill) in `genContour`. Clean 120/120. NOTE: the skeleton follows the contour loosely, so the visible payoff is modest — the bigger lever is the foreground material below.
- [x] **Melodic FIGURES** — a run of 2+ connective slots is now realised as a real figure (scale RUN, TURN, NEIGHBOUR group, or ARPEGGIATED flourish) in `figureFill` inside buildBar, instead of independent passing notes. Verified clean 99-100/100, visibly figured (fig3).
- [x] **Motivic gesture recurrence** — each piece FAVOURS one figure type (`figBias`), so its gestures recur like a motif (a run-piece, a turn-piece), not scattered.
- [ ] **Deeper motif development** — harmony-coherent pitch SEQUENCE (idea repeated at another degree with the harmony), inversion, fragmentation. Needs harmonic coordination (a sequence must move with the progression), so left as the careful next step, not the quick figure work above.
- [ ] **Cadential melodic figures** — varied ways to land a cadence.
Then grow: RHBANK (+countermelody), FIGBANK gaps (contrary-motion/pedal bass, more dance idioms), QFEEL rhythm cells.

**KEY LESSON (Matthew):** I over-invested in RULES and under-invested in MATERIAL. The rules need a rich vocabulary of real figures/fragments to act on, and that material must be GROWN (not reduced to a few patterns). Applies to every bank: FIGBANK (LH), RHBANK (RH), QFEEL/rhythm cells, contours. When something feels samey, the fix is usually MORE real material, not another rule.
   Rule: the two hands form ONE coherent whole. Relationships: homophony · doubling (8ve/3rd/6th) · homorhythm · complementary rhythm (one hand moves in the other's rests) · dialogue/call-response · countermelody · counterpoint/imitation · pedal. Plus coordinated ARTICULATION (shared, or clean legato-vs-detached contrast, never a third unrelated detachment) and MOTION (contrary/parallel/oblique). Build: choose a relationship per piece from `gp.texture`; compose the second hand AWARE of the first (its rests, pulse, articulation). Test: narrowing — each grade's texture set all appear; leak — no clashing double-detachment (the #5 fault), no parallel 5ths/8ves. Currently FAKED by homophony-only.

3. **Non-chord-tone completion** (unlocks `nonChordTones`).
   Rule [LAW]: each NCT type prepared+resolved — passing, neighbour, suspension (have), + appoggiatura (leap to accented dissonance, resolve by step down), anticipation, escape. Build: allow an on-beat leapt-in dissonance that resolves by step; relax the chord-tone-on-beat skeleton for it. Test: leak — every appoggiatura resolves by step; narrowing — appoggiaturas appear at G5+. Currently FAKED by chord-tone-on-beat skeleton (M2 note).

4. **Secondary-dominant / applied-chord system** (unlocks `harmony.secondary`).
   Rule: any diatonic chord can be tonicised by its own V(7); it resolves to its target; key reconfirmed. Build: generalise the V/V logic to V/x for x in the grade's `secondary` list. Test: leak — every applied chord resolves to its target with correct spelling; narrowing — V/ii, V/vi etc. appear at G5+. Currently FAKED by V/V-only (H5).

5. **Motivic development beyond re-subdivision** (richer RH3/RH5).
   Rule: a motif develops by augmentation, diminution, inversion, retrograde, fragmentation, sequence, rhythmic displacement — not only beat re-subdivision. Build: add these transforms to `varyRhythm`/the motif engine. Test: narrowing — the development types appear; leak — the development stays recognisably the motif and grade-legal.

### GRADE-PARAM VALUES — needs Matthew's verification (see grade-params.mjs tags)
[P] public/syllabus (Matthew knows precisely): minor+quavers at G1 vs G2 · key range per grade · note values per grade · grades 5-8 values. [I] inferred (my derivation): leapCeiling, nonChordTones, texture set, chromatic budget, cadence types.
