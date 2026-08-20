# The Derived Rulebook

**THE GOAL (Matthew):** the generator should write like a COMPOSER — it embodies the complete, real rules of music, derived from logic and pinpoint-precise, and **grade is only a PARAMETER** that selects which features are active and how hard they get. The same engine must be able to write grade 2 through grade 8. Therefore:
- **Never cut or fake a real music rule because "this grade does not need it."** That hard-codes a grade-N tool and discards a rule a higher grade needs. Derive the rule complete and true; the grade parameter does the limiting, by omission NEVER.
- A "load-bearing constraint" (a restriction that, when removed, breaks output) is not a rule — it is a **real capability the engine has not built yet, faked by a restriction.** It goes on the build roadmap (build leap-recovery, not a leap cap; build the texture relationships, not homophony-only; build the secondary-dominant system, not V/V-only). Grade then parameterises the real capability.
- **Architecture:** keep the complete grade-agnostic music rules separate from the grade parameter table (which features / difficulty / ranges apply per grade). This rulebook is the music; grade is a lens over it.

---


For every decision the generator makes, the **complete** set of theoretical cans and can'ts, derived from music theory (metric, harmonic, voice-leading, melodic, notational), not from a heuristic or a probability. Each decision states: the governing principle, the exact boundary (allowed vs disallowed with the reason), and the contexts that keep an option allowed so nothing is over-ruled.

Division of labour: Matthew senses when something is off (a symptom); the rule is *derived* here from theory so it is exact and covers every context, including the ones a human cannot enumerate by ear.

Two axes on every decision (both must pass): **local legality** (theoretically correct here) and **global unity** (consistent with the piece's established vocabulary). See REASON-MAP.md for the governing law.

**META-METHOD (mandatory, applied to EVERY decision — I default to narrowing without it):**
1. **Encode the CAN'T, not the CAN.** Write each rule as a deny-list: state the provably-wrong condition, admit everything else. Generation menus = the COMPLETE valid set minus the forbidden, never a hand-picked subset. An allow-list narrows by construction (anything unlisted is excluded); a deny-list can only narrow by an added forbidden condition, which is visible and testable.
2. **Test the boundary from BOTH sides.** Leak test: does it admit anything provably wrong? Narrowing test: does it exclude any valid example it must admit? A rule is not done until both pass.
3. **Enumerate the COMPLETE usage** of a mark/decision from theory before coding — every recognised reason it is used — and treat any single-reason encoding as suspect.

**Each rule is tagged [LAW] or [CONVENTION].** [LAW] = a general voice-leading / notation / functional law (holds outside this idiom too). [CONVENTION] = a common-practice / pedagogical rule that is correct for ABRSM grade 2–4 tonal writing but is idiom-specific, so it must never be treated as inviolable in a context it does not govern. Sources: Piston *Harmony*; Riemann function theory; species-counterpoint voice-leading; Gould *Behind Bars* and Read *Music Notation* (notation/metre).
Tags so far — R1 [LAW], R2 [CONVENTION], R3 [LAW+unity]; H1 [CONVENTION], H2 [LAW-ranking], H3 [CONVENTION], H4 [LAW], H5 [LAW], H6 [LAW], H7 [CONVENTION].

---

## DECISION FAMILY: rest placement (silencing an onset)

### R1 — A rest may not hide a beat behind a finer-valued rest (metric legibility)
**Principle:** a metric accent must remain articulated; notation must show the beat.
- **Disallowed:** a rest whose value is *finer than the metric level of the position it sits on*, placed ON that beat, because it buries a strong position under a weak-valued rest (e.g. a semiquaver rest on a compound main beat, or on a crotchet beat in simple time). The notation asserts a weak event at a strong position.
- **Allowed:** a rest **of the beat's own level or coarser** on a beat (a quaver/crotchet rest on a crotchet beat; a quaver rest on a compound beat), and a fine rest **off** the beat within a texture whose grid is that fine.

### R2 — A rest's granularity must match an established grid (grid consistency + unity)
**Principle:** a displacement must land on a pulse the metre articulates AND the piece has established.
- **Disallowed:** a rest that pushes the following attack onto a subdivision finer than the piece's established grid (a semiquaver rest with no running-semiquaver texture; the sixteenth-rest orphan). It lands between the grid and reads as a stutter.
- **Allowed:** a rest at a granularity the piece is already articulating (semiquaver rests are fine inside a genuine semiquaver texture; quaver rests inside a quaver texture).

### R3 — Silencing a beat's onset is syncopation only if the weight is carried or the figure recurs
**Principle:** the ear must feel displaced weight, not a missing note.
- **Disallowed:** silencing a beat whose following note is contained inside its own beat and does not recur — a dropped note, not a syncopation.
- **Allowed:** the note entering off the beat **carries across the next strong beat** (sustained/tied over it), OR the off-beat figure is an **established recurring pattern**. Then it is genuine syncopation, in any metre including 6/8.

### R4 — Off-beat lift vs on-beat rest are different devices with different boundaries
- **Off-beat gap (pointillist):** silencing an OFF-beat note so on-beat notes stand as detached points. Allowed on any off-beat note while another voice keeps the pulse. Not syncopation.
- **On-beat rest (syncopation):** governed by R1–R3 above.

### Worked example (the failure that produced these)
A semiquaver rest on beat 4 (position 1.5, the second dotted-crotchet beat) of a 6/8 bar failed **R1** (finer than the beat it sat on → hid the beat), **R2** (no semiquaver grid established → foreign granularity), and **R3** (the following note was contained, no carry, no recurrence → a dropped note). Three independent theoretical faults, none of them "it felt like an orphan."

---

## DECISION FAMILY: harmony

### H1 — Functional succession; no retrogression
**Principle:** chords progress Tonic → Predominant → Dominant → Tonic. Functions: T = I, vi (iii); PD = ii, IV; D = V, vii°.
- **Disallowed:** a dominant-function chord falling back to a predominant (V → IV, V → ii). That is retrogression. The dominant **resolves** — to I, or deceptively to vi/VI.
- **Allowed:** T → anything; PD → D, or PD → PD only in the strengthening order (IV → ii, never ii → IV); D → I or vi.
- **Audit:** grade 3/4 `GRAMMAR` already enforced this; grade 2's flat `moves` list ignored the previous chord (a leak — V could go to ii/iii). **Fixed** in `moveChord`: `prev===V` restricts successors to I / vi(VI), all grades. Verified 0 retrogressions in 40 grade-2 progressions.

### H2 — Root-motion strength (preference, not a can't)
Descending fifth is the strongest tonal pull, then descending third, then ascending step; ascending fifth / descending step are weak. Used to choose among equally-legal successors, so it is a ranking, not an exclusion (nothing valid removed). In `moveChord`. Compliant.

### H3 — The tonic frames, it does not fill
First bar and last bar are I; inner bars move through non-tonic harmony; no immediate chord repeat (a two-bar HOLD for slower harmonic rhythm is a deliberate, allowed device). Compliant.

### H4 — Cadences
The antecedent closes with a half cadence (on V) or IAC; the piece closes with a perfect (V–I) or plagal (IV–I) cadence; the cadence is **approached** by a proper predominant/dominant, never a rootless drift. Choosing perfect vs plagal is freedom among valid closes. Compliant.

### H5 — Secondary dominant (grade 4, one moment)
A V/V tonicises the dominant and must **resolve to V**; the raised 4th lives in the accompaniment; the key is **reconfirmed** afterwards (the natural 4th restated at the close). Once per piece, major, non-swap. Compliant. (Boundary note: only V/V is used; V/ii, V/vi are a grade-appropriate narrowing, not an error.)

### H6 — Dominant seventh
A V7 is allowed only where the dominant **resolves to I** (the 7th needs its downward step to the 3rd of I). Gated to `V → I`. Compliant.

### H7 — Harmonic rhythm
Chords change on strong beats; a grade-4 **mid-bar** change is allowed at a defined weak position and the second chord must be functional (the next downbeat's chord arriving early, or a legal passing successor), with minor-mode leading-tone guards. Compliant.

## DECISION FAMILY: melody

### M1 — Chord tones on strong beats [CONVENTION]
The metric skeleton lands chord tones on the beats; non-chord tones fall on the weak positions between them. Compliant (the skeleton-and-fill engine).

### M2 — Non-chord tones by type, each prepared and resolved [LAW]
Every non-chord tone must **resolve by step to a chord tone**, and each type has its own approach:
- **Passing** — stepwise, fills a third, same direction in and out (weak, or accented then resolved).
- **Neighbour (auxiliary)** — step away and back to the same note (weak).
- **Suspension** — prepared (a consonance tied over), dissonant on the strong beat, resolves **down** by step.
- **Appoggiatura** — leap (usually up) to an accented dissonance, resolves by step (usually down).
- **Anticipation / escape tone** — weak.
Audit: engine handles passing, neighbour and prepared suspensions with correct resolution. **Narrowing noted:** the chord-tone-on-beat skeleton excludes the **appoggiatura** (an accented leapt-in dissonance). That is conservative and grade-appropriate (safe at G2–3) but is a real narrowing at G4 where appoggiaturas are idiomatic — flagged to revisit, not yet opened.

### M3 — No melodic augmented 2nd in minor [LAW]
A stepwise ♭6–♯7 (harmonic-minor gap) is forbidden; real writing avoids it with melodic-minor inflection. **Leak found and fixed** (added `melodicAug2nd` to the fault scoring; verified 0). Major has no such diatonic gap.

### M4 — Leaps: between chord tones, recovered by step, capped [LAW/CONVENTION]
A leap goes between chord tones and is **recovered by a step the opposite way** (so the line arcs, not zig-zags); leap size capped (~a 5th at these grades); no unresolved leap. Compliant.

### M5 — Contour is a shaped arc to a single climax [CONVENTION]
Arch / wave / rise / fall aimed at one high point; the shape choice is free among valid arcs. Compliant.

### M6 — No static line [CONVENTION]
Repeated notes are allowed but the line must not sit bar-after-bar on the same pitch. Compliant.

### M7 — Cadential melody note [LAW]
Lands on a stable degree: tonic at a perfect cadence, a dominant-chord tone (or ^2) at a half cadence. Compliant.

### M8 — Anacrusis [CONVENTION]
An upbeat leans into the downbeat by step or a small leap. Compliant.

### M9 — Range within the grade span [grade spec]
RH ~octave, within the grade's semitone span. Enforced by validate().

## DECISION FAMILY: rhythm and motif

### RH1 — Beat integrity [LAW, notation]
A sub-beat note may not cross a beat boundary; beams/values show the beat. Engine-enforced (validate: "rhythm crosses a beat"). Compliant.

### RH2 — Legal note values [LAW, notation]
Only readable durations (no un-notatable values). Engine-enforced (OKDUR). Compliant.

### RH3 — Show the middle of the bar [LAW, notation]
In simple time a note must not obscure the mid-bar division (in 4/4 a plain half-note on beat 2 hides beat 3 and must be tied). **Audit: no violation.** A note filling from a beat to the barline (the "quarter + dotted-half" pattern) is correct and is NOT this fault — I initially over-flagged it and corrected on inspection. Off-beat notes crossing the mid-bar are syncopation, not errors.

### RH4 — Compound grouping in threes [LAW, notation]
A compound beat (dotted crotchet) keeps its three-quaver grouping; never split to 0.75+0.75. Engine/compoundBar-enforced. Compliant.

### RH5 — Motivic unity: statement then development [CONVENTION]
A rhythmic motif is stated and then developed (recurs, varied) — not stamped identically every bar, not unrelated every bar. **The no-op that produced the seven-identical-bars march is fixed** (guaranteed-distinct contrast motif + real beat-level variation). Compliant.

### RH6 — Rhythmic complexity fits grade and tempo [CONVENTION/grade]
No frantic semiquaver stacking at a fast tempo (the density budget: `calmMel`, semiquaver cap). Compliant.

### RH7 — Rhythmic-vocabulary consistency [CONVENTION/unity]
Granularity stays consistent (a lone foreign value is an orphan — see R2). Largely carried by the motif recurrence. Compliant.

## DECISION FAMILY: interpretive layer (articulation, dynamics, phrasing)

### I-TEN — Tenuto [expressive; LAW of intent]
A tenuto is a gentle lean and needs a note with a **reason** to be leaned on: a suspension/appoggiatura, the phrase's **melodic apex**, or a cadential broadening, in an **expressive/singing character** only (a crisp/detached piece does not lean). On a beat, on a note long enough to hold. **Leak fixed:** it was placed on "the longest note of the second half" (mechanical, not a reason) by a coin-flip — read as arbitrary (Matthew). Now it marks a genuine melodic peak in an expressive character, or nothing. Verified 5/5 on real peaks, ~6% of pieces.

### I-ACC — Accent [LAW of intent] — DERIVED, compliant
Marks a note that genuinely stands out: a leap into it, true syncopation, a chromatic colour, an agogic long note, or the phrase peak; passing notes excluded; one per bar; accented characters only. **Verified:** 0 unjustified of 45 accents; max one per bar.

### I-STAC — Staccato [CONVENTION/unity + LAW playability] — DERIVED, compliant
Applied to a recurring rhythmic figure the same way each time (never a lone note), as a contiguous run; only on notes playably detached at the tempo (engine forbids staccato on a long note). **Verified:** 0 orphan staccatos.

### I-FERM — Fermata — compliant
On the final note/chord (a structural pause).

### I-DYN — Dynamics [CONVENTION] — DERIVED, compliant
Level per character; the phrase arc (grow to the most open/peak bar, ease at the cadence); hairpins over real spans; subito at a formal seam or the peak; **no mark that merely repeats the current level.** **Verified:** 0 redundant dynamics.

### I-SLUR — Phrase marks [CONVENTION] — DERIVED, compliant
A slur marks a real phrase/gesture (at least a 2-note legato pair / sigh on a resolving step), balanced, never across a staccato bar. **Verified:** 0 unbalanced, minimum span a real 2-note gesture.

## DECISION FAMILY: texture and hands

### TX1 — Voice-leading [LAW]
No parallel perfect fifths/octaves (outer voices or between LH chords), no 6/4 on a downbeat, no hand crossing. Scored in candidate selection. **Verified 0** across 150 pieces.

### TX2 — Accompaniment consistency [CONVENTION/unity]
Chosen for the character, kept consistent, varying only for a structural reason (thin at a cadence). Compliant.

### TX3 — Hands as roles [design] — NARROWING NOTED
Either hand may carry the melody (`swap`), so the "RH is always the tune" assumption is partly lifted. Still open: the hands do not TRADE material within a piece, and the assignment is a variety choice, not fully reasoned. A feature to add, not a leak.

## DECISION FAMILY: setup / form
- **S1** key/mode/metre/tempo/character — legitimate variety, spread for coverage; grade-legal enforced.
- **S2** form [CONVENTION] — a real period (antecedent HC/IAC, consequent perfect/plagal close; parallel or contrasting). Compliant.

## Narrowings — audited with the both-side test (deny-list method)
- **H6 dominant 7th → WIDENED.** Now V7 may resolve to I OR deceptively to vi (the 7th resolves to ^3, present in both). Both-side test passed: clean 100/100, 0 voice-leading faults.
- **M4 leap cap → KEPT (load-bearing, NOT a narrowing).** Widening the ~5th cap admitted 6th–octave leaps but the engine recovers only 5/44 → awkward jumps. The cap stays until the melodic engine can recover large leaps. (The both-side test caught this; `validate` did not.)
- **Still to test (may be load-bearing):** R3 recurring-syncopation branch · M2 appoggiatura · motif-development types (augmentation/inversion) · fermata over a rest / other section ends · tenuto portato & shorter notes.
- **Deliberate exclusions (documented, kept):** staccato lone note (orphan, per unity) · accent metric/marcato & >1 per bar (guards the "meaningless accent") · H1 V→I/vi only & H5 only V/V (grade idiom [CONVENTION]).
