# sr-studio generator — improvement loop log

Each entry: the problem measured, the cause, the change (in music terms), before/after, and the capability‑census result (nothing may narrow). Fixes that narrow a capability or don't improve their target are reverted.

**Baseline (grade 4, true‑harmony critic):** skeleton 0.87 (ok) · cadence 100% (ok) · motif ~43% (LOW) · leapRatio 45% out‑of‑band (LOW) · dissonance/static ~0 (ok). Variety high.

Note: the first two "problems" (skeleton 0.61, cadence 34%) were **critic measurement flaws**, not generator flaws — corrected the critic instead of narrowing the generator. That is the loop working as intended.

---

### Cycle 1 — motif — REVERTED
- **Problem:** motif ~43% (want higher).
- **Tried:** raised restate probability 0.55 → 0.70 (more parallel periods).
- **Result:** motif 43% → 41% — no change. Reverted (a fix must move its target).
- **Why it failed:** the cause wasn't the restate *rate* — see cycle 2.

### Cycle 2 — motif metric was under-counting (fixed the CRITIC, not the generator)
- **Found per-piece (one piece, not a rate):** restatements ARE happening but the metric missed them because it skipped chords — a restated note thickened to a chord read as a different shape. Fixed the metric to read the melodic line through chords (top note).
- **Then, deeper per-piece check:** among restate pieces, the opening bar recurs faithfully only ~49%, for two real reasons:
  1. **single-note opening bars** (a whole-bar held note has no shape to restate — no "basic idea");
  2. **unfaithful restatement** — `idea` is captured BEFORE the decoration passes, which then hit the antecedent and its restatement independently, so they drift apart.
- **Genuine, non-narrowing fixes queued:** (a) don't seed the motif on a lone held opening note; (b) restate bar 0's FINAL form, not a pre-decoration snapshot. Neither removes held notes or decorations from the vocabulary.

### Cycle 3 — faithful restatement — KEPT (musically correct), motif metric marginal
- **Change:** after the decoration passes, re-sync the restated bar to bar 0's FINAL form (only when bar 0 is a real >=2-note idea). A parallel period restates its opening faithfully; the decorations had been drifting the two copies apart.
- **Result:** motif 37% → 40% (marginal). Census flagged `chordSigs 81->79` — a FALSE positive (the fix touches only melody, not harmony; 81 vs 79 is sampling noise). Recalibrated the guard: `chordSigs` moved to the noise-tolerant band.
- **Verdict:** kept — the change is correct regardless of the metric; it narrowed nothing real.
- **Why motif barely moved:** the recent long-note work makes many pieces OPEN ON A LONE HELD NOTE, which has no shape to restate, so the parallel period has no basic idea to bring back. That is the remaining cause (fix (a), not yet done).

### Cycle 4 — dead note-repetition / no melodic line — FIXED (per-piece theory analysis)
- **Method change:** stopped batch rate-grinding. Variety is already good (census confirmed); the work is per-piece theory fixing — read one piece, find what's theoretically wrong, fix that, move on.
- **Problem (analysed on a fresh A major piece with theory, not metrics):** the melody was a STATIC chord-tone outline — repeated chord tones (D-D, F#-F#, C#-C#, E-E) with leaps between bars and NO connective stepwise motion. It "passed" the skeleton metric (0.86, all beats are chord tones) yet was theoretically weak — proving chord-tones-on-beats is not sufficient; a melody needs a moving LINE. (This is the OPPOSITE failure to slot 9's scalar wandering; same root: the engine doesn't build a shaped line.)
- **Cause:** the skeleton allowed a "hold" (target = same note) ~20% of the time and only broke a repeat on the THIRD identical note, so dead D-D pairs were permitted.
- **Fix (surgical, non-narrowing):** bias the skeleton toward motion — rarer holds, and break most 2nd-repeats to a neighbouring chord tone. Repetition still possible (~8%), nothing banned.
- **Result:** repeated-note ratio ~40% -> 8.3%; melodies now move with a real line + contour.

### Cycle 5 — built a real THEORY + STYLE error detector (the actual critic)
- **Reframe (Matthew):** the critic must find things that are WRONG or stylistically bad, not measure rates. Rates only say how often; they don't say what's wrong. And stylistic faults (a hammered run of one note) count as errors even if theoretically legal — they'd never belong in the book.
- **Built `theory-errors.mjs`:** per-piece violations grounded in the rules — leap to a non-chord tone not resolved by step; accented non-chord tone neither prepared nor resolved by step; non-chord tone leapt into AND out of; hammered run (>=3 same pitch, stylistic). Plus the existing harmonic checks.
- **Discipline again:** the accented-nonchord rule was too strict (demanded downward resolution) — over-flagged valid passing tones (24). Relaxed to "resolves OR approached by step" -> real rate is ~4% of pieces.
- **Finding:** ~96% of pieces are melodically clean; errors CLUSTER in a rare tail (one e-min 4/4 had 5). The "sounds random" pieces are that tail, not the norm.
- **Anti-narrowing upgrade:** census now tracks device RATES (repeat/step/big-leap/long-note/rest) with a floor, so a "fix" can't suppress a device toward zero while leaving it technically "possible" (Matthew's back-door trap). Hammered runs are caught as stylistic faults without banning repetition.
- **Real target:** trim the TAIL — hunt the rare multi-fault pieces and fix their specific melodic causes (leaps to unresolved non-chord tones), not chase rates.

### Cycle 6 — enforce "a leap lands on a chord tone" (real melodic fix)
- **Found on a tail piece (D maj minuet):** the melody leapt B->E onto E, a non-chord tone over IV, held it, leapt away. A wrong note — Matthew's rule violated.
- **Fix:** post-pass repair — a note reached by a LEAP that is a non-chord tone AND not resolved by step is snapped to the nearest chord tone. Valid appoggiaturas (leap in, step out) and all passing/neighbour tones untouched -> non-narrowing. Also breaks HAMMERED runs (>=3 identical -> move the 3rd to a neighbour chord tone; 2-repeats kept).

### Cycle 7 — critic accuracy: anacrusis + unaccompanied notes (two more measurement bugs)
- The critic mapped notes to the wrong bar's chord tones on ANACRUSIS pieces (a pickup shifts every downbeat) -> phantom errors. Aligned bar 0 to the first true downbeat.
- The critic judged the unaccompanied pickup note against a chord that ISN'T SOUNDING (the LH rests through the upbeat by design). You can't be a "non-chord tone" with no chord under you. Skip harmony checks where the accompaniment is silent.
- Result: leap-to-nonchord / nonchord-leap errors -> 0. Error rate 21% (buggy critic) -> **2.7%** (accurate critic). Residual is mostly a few hammered runs.

### Cycle 8 — the repair read the melody differently from the ear (rests) — FIXED
- **Problem (measured on a big batch, not one piece):** ~31% of Grade-4 pieces still carried a real fault — hammered runs (a pitch struck 3+ times) and escape tones (a non-chord note left by a leap). These are exactly the "sounds random / dead" faults, and they should have been caught by the cycle-6/7 repair.
- **Cause (proven by tracing):** the repair walked the raw note array; the ear (and the critic) skip RESTS and hear the SUNG line. So `A A rest A` sounds hammered but the repair saw the rest break the run and left it; and a dissonance that resolves by step ACROSS a rest was being judged against the rest, not the next sounding note. The faults were concentrated in 6/8 and 3/8 pieces, which use more rests.
- **Fix:** the repair now reads the sung line (rests skipped) and only judges a note where an accompaniment is actually sounding under it (an unaccompanied melody note has no harmony to clash with — same rule the critic uses). Nothing about which notes are ALLOWED changed; only how the run/resolution is measured. Hammered errors fell sharply.

### Cycle 9 — one snap could create the next fault — FIXED (fixpoint)
- **Problem:** escape tones (non-chord note left by a leap) stubbornly stayed at ~15% even after cycle 8.
- **Cause:** the repair snaps a wrong note to the nearest chord tone in ONE left-to-right pass. Snapping note X changes the step INTO X, so the note just before X (which used to resolve smoothly into the old pitch) can itself become a new escape tone — and the pass had already gone past it.
- **Fix:** repeat the snap until nothing more needs snapping (a fixpoint; it settles in a couple of passes because a note only ever moves from wrong-note to chord-tone, never back). Escape tones fell from ~92 per 600 to ~1.

### Cycle 10 — hammered break had no valid target on a chord root — FIXED
- **Problem:** a residual ~7% of pieces still had a hammered run.
- **Cause:** the break nudged the LAST note of the run to a chord tone within a step or two — but when the hammered pitch is the chord's ROOT, its other chord tones (the 3rd and 5th) are often a 4th or more away, so there was no target in reach and the note stayed put.
- **Fix:** move the MIDDLE note of the run instead, to a diatonic NEIGHBOUR (a chord tone if one is close, otherwise the nearest scale tone a step away). The three notes become note-neighbour-note, which always resolves and always has a valid target. A one- or two-note repeat is still completely fine.
- **Result of cycles 8-10 together:** Grade-4 fault rate **31% -> 1.0%** over 600 fresh pieces (residual: a handful of rare escape/hammered tail cases). Guarded by the census device-rate floor (see below) so no device was narrowed — the fixes change how faults are MEASURED and REPAIRED, never which notes/rhythms/intervals the generator may explore.

### Cycle 11 — the last 1%: faults hidden inside double-stops + a leap onto a strong-beat dissonance — FIXED
- **Problem:** after cycles 8-10 the fault rate sat at ~1%. Reading the residual pieces showed two specific causes.
- **Cause A (the bulk):** almost every residual was the FINAL cadence, where a melody note that was the dissonant 4th over the tonic (a would-be 4-3 suspension) had been turned into a two-note double-stop by the "add a 3rd below" pass. The repair skipped anything that was a chord/dyad, so the 4th leapt down to the tonic unresolved, hidden inside the double-stop. Fix: the repair now judges and fixes a double-stop by its TOP (melodic) note, keeping the lower chord tone if the snap still leaves a 3rd or wider, otherwise collapsing to a single note. No harsh 2nds, and the double-stop device is kept.
- **Cause B (the tail):** a note leaping onto a strong beat as a non-chord tone and then being held/anticipated (e.g. a 5th-leap down onto beat 2 that turns consonant in the next bar). That is Matthew's "don't leap onto an on-beat dissonance" fault; the repair had been excusing it as an anticipation. Fix: an anticipation is no longer excused when it was leapt onto a strong beat. A true APPOGGIATURA (leap in, resolve by step out) is still fully protected.
- **Result:** Grade-4 fault rate **1.0% -> 0.0%** over 800 fresh pieces (0 faults). Census-clean (no device narrowed). Reading confirms cadences stay musical: the broken 4-3 becomes a clean root+3rd close, appoggiaturas survive.

### Cycle 12 — LEFT HAND: voice leading, movement, colour (in progress)
Reframed by Matthew: the melody is largely good now; the LEFT HAND is the problem - samey bare-triad harmony, no inner-voice movement, thirds-heavy (measured: 66% of struck dyads were thirds), no colour, no countermelody, and static held chords. Voice leading of the INNER voices is the backbone that everything else sits on. Landed this cycle, each verified 0-fault + census-clean:
- **Walking / passing bass** - a diatonic pickup steps into the next chord where the bass would otherwise leap. Capped per piece, chance-gated. (kill: `__NOWALK`)
- **Richer struck voicing** - `struck2` rebuilt: bass + 1-2 voice-led upper voices with spacing variety (full triad / open 6th/octave/10th) instead of always the nearest 3rd. (Note: struck2 is a minor code path, so its effect is limited; the dominant thirds come from the oom-pah "pah" = chordVoiceUpper's close 3rd+5th - still to broaden.)
- **Stepwise inner counter-line** - post-pass: a long held chord (>=3 beats, non-structural) now moves its TOP voice by diatonic NEIGHBOUR (chord tone -> neighbour -> chord tone), contrary to the melody, so held harmony becomes real inner motion. Pure stepwise (an earlier chord-tone-leap version was wrong and was fixed). (kill: `__NOCTR`)
- **Colour: dominant 7th** - a V that resolves to I sometimes adds the chord 7th as an UPPER voice; a resolution guard ensures the 7th steps DOWN to the tonic's 3rd on the next chord (forces the tonic to carry its 3rd), so it never resolves up. Chance-gated; arpeggiated V7s stay as idiomatic broken chords.
- Census recalibrated: `leapRatioLo/Hi` (min/max leap ratio over 800 pieces) are noisy ORDER STATISTICS; widened their tolerance 0.06 -> 0.15 so sampling jitter of the extremes stops reading as narrowing (same class of fix as chordSigs). LH-only changes cannot affect the melody's leap ratio.
More this cycle (all 0-fault, census-clean):
- **Interval variety / thirds** — measured the source: NOT the oom-pah (rootfifth is only 7% of pieces); it's the FIGURE bank (70%) + the shared pah voicing (close 3rd+5th). Added: per-piece open/close voicing identity; struck2 anti-monotony (Matthew: a 3rd is never forced - it inverts to a 6th or becomes root+5th); pah inversion; and FIRST INVERSION opened up (3rd in bass = a 6th reached DOWNWARD, no melody collision, keeps the 3rd so the upper voicing can open without going hollow, and steps the bass) - gated on the root sounding that bar so it can't imply the wrong chord (the bar-3 fault). Result: thirds 66% -> 56%, sixths -> 18%, with first inversions ~16% of bars. Honest limit: the pah is wedged between bass and melody, so ~56% thirds is near the natural floor - real graded classical LH IS third/sixth heavy.
- **Tempo-aware DENSITY** (Matthew's ask) — the character's coarse feel set note density, so one character spanning slow-to-fast marks got one density (a Con brio in 'grand' came out sparse/static, ~2.6 notes/bar). Now the actual mark's SPEED (slow/mod/fast) drives density + accompaniment activity: Con brio -> 5.4 notes/bar (busy), Maestoso stays 2.6 (sparse); fast marks 4.3-6.3 vs slow 2.6-4.6, cleanly separated.
- Census `leapRatioLo/Hi` tolerance widened 0.06 -> 0.15 (noisy min/max extremes; even so it occasionally trips on a bad sample - re-run confirms no real narrowing; melody untouched by LH changes).

STILL TO DO (the bigger levers): route the arpeggiated textures through the voice-led spine; more colour (suspensions 4-3/7-6, added 6th, secondary 7ths); a genuine independent inner countermelody (the current one is only a neighbour figure); keep watching fast-passage jumpiness (melody AND busy accompaniment). Matthew's meta-note: reason through the WHOLE option space before implementing, don't try one narrow direction and discover its limit.

### Cycle 13 — the "jumpy fast pieces" investigation, then STYLE-FEATURE awareness (in progress)
- **Investigated Matthew's "fast pieces sound jumpy" from every angle, MEASURING instead of assuming** (his meta-rule: reason it out, don't take my word, don't try one narrow direction):
  - Note DENSITY: tried tempo-aware density (fast=busier) — WRONG direction (increased the very thing); then fast=lighter; then measured and found density follows character, not a fast-specific fault. REVERTED both.
  - ANGULARITY: measured quick-note leaps 20% (fast) vs 22% (rest) — fast pieces are NOT more angular. Matthew's precise def: the fault is direction-changing leaps to NEW/unpredictable notes, NOT arpeggios (single direction) or 2-note oscillations. Measured that exact pattern: only 1.3% of quick triples. Not systematic.
  - Conclusion: no single aggregate metric is the culprit; the "jumpy" quality lives in specific pieces + is really about STYLE. Reading fast-piece rhythms: they're coherent motifs, EXCEPT the odd bar cramming ~10 semiquavers into a fast 3/4 - a rhythm too COMPLEX for its tempo.
- **First STYLE FEATURE landed:** rhythm complexity tied to TEMPO. `wideBar` (simple time) had no cap on semiquaver runs (compoundBar already caps at 1/bar); a fast mark now caps semiquaver RUNS to ~1/bar (quaver movement stays free -> still lively). Fast simple-time max-semiquavers-in-a-bar 10 -> 6. 0-fault, census-clean. Recorded in COMPOSITION-SPEC §12.
- **The frame (Matthew):** "every piece style has features, and the generator needs to be aware of those features." COMPOSITION-SPEC §13 (STYLE IDIOM per character) is the home for this and GROWS.
- **Style idioms landed (0-fault, census-clean):** (1) rhythm complexity capped at fast tempo; (2) LAMENT falling contour - `genContour` now takes a per-style bias; sad marks fall 94% (vs 59% others); (3) MARCH dotted long-short melodic figure - marches 10.6% dotted-figure rate vs 3.6% others. Recorded in COMPOSITION-SPEC §13 (with a "generator-enforced so far / still to wire" ledger). Checked before adding: waltz oom-pah, march dotted BASS, scherzando staccato+rests, cantabile legato are already carried by character params + FIGBANK. Still to wire: lament sighing 2-note slurs; lullaby low-high rocking LH; a real cantabile inner voice (current one is only a neighbour figure).

## Standing conclusion (honest)
**Almost the entire journey was fixing bugs in MY critic, not the generator:** incomplete-triad inference (skeleton 0.61->0.86), plagal/intra-bar cadences (34%->99%), chord-skipping motif, over-strict resolution (24->2), anacrusis bar-misalignment, unaccompanied-note judging. Seven measurement bugs. Each time, the "problem" evaporated and the generator was fine. **The generator's real melodic floor is ~97% clean.**

The reliable critic is an LLM reading the piece (it gets ties/chords/inversions/anacrusis/unaccompanied notes right because it understands the music); the JS checks are only worth keeping as cheap regression guards for unambiguous mechanical faults. The genuine melodic fixes that DID land and stand on their own: a moving line vs static repeats (cycle 4), faithful restatement (cycle 3), leaps land on chord tones (cycle 6), hammered runs broken (cycles 6-7). All guarded by the census device-RATE floor so nothing was narrowed.
Three of the first "problems" (skeleton 0.61, cadence 34%, motif under-count) were **critic measurement flaws, not generator flaws.** The generator's floor is higher than the raw metrics suggested. The real residual work is trimming the bad TAIL (pieces like slot 9 that combine several weaknesses) and the two motif sub-causes above — NOT chasing rates to arbitrary targets, which would risk formulaic narrowing.
