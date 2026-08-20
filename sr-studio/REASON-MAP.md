# The Reason Map

Every place the generator currently makes a musical decision **by chance** instead of **by reason**.

**THE GOVERNING LAW (Matthew, exact):** every choice in a piece needs pinpoint reasoning that **admits every possibility that IS allowed in that context, and rules out every possibility that is NOT.** Nothing valid excluded (that is narrowing). Nothing invalid admitted (that is the wrong-sounding output). The freedom to choose lives inside that exact legal set, and the boundary is drawn by theory + the grade spec, never by taste or a bare probability. Every decision is audited against this two-sided test: does its logic let in all the allowed options, and keep out all the disallowed ones? A bug is either a leak (admits a disallowed option, e.g. the offbeat rest on a beat downbeat) or a narrowing (excludes an allowed option, e.g. a device switched off wholesale).

**TWO AXES on every decision (both must pass):**
1. **LOCAL legality** — is this choice theoretically correct *here* (harmony, voice-leading, metre, the syncopation carry-over rule, etc.)?
2. **GLOBAL consistency / UNITY** — is this choice consistent with the piece's own established vocabulary? Everything in a piece must belong to the whole (the principle of unity; unity and variety in balance; motivic economy). A feature that relates to nothing around it is an orphan and reads as wrong before it is even played. Concretely: (a) **rhythmic-vocabulary consistency** — no rest or note value at a granularity the piece has not established (a sixteenth rest with no sixteenths elsewhere is foreign); (b) **device consistency** — a device (a syncopation, a pointillist gap, a rest-gesture) must recur / be part of the piece's language, never appear exactly once; (c) **no orphan gestures** — no element that is the sole instance of its type, unprepared and unrepeated. Per-bar decisions with a probability are the classic source of orphans; a device must be decided at the PIECE level (in or out, and if in, recurring) not rolled per bar.

**Principle (Matthew):** music is rules. Every note, rest, accent, slur and dynamic is there for a reason, and composing is reverse-engineering those reasons. Randomness is the *absence* of a reason, so anywhere the generator rolls a die on a musical decision it puts something unjustified into the piece, which is why it can sound wrong. This maps every such point so each can be converted from "roll a die" to "apply the reason." None of this is about taste. The arbiter is tonal theory plus the Grade 4 specification, with diversity coming from the many pieces that are *all* rule-correct, not from dice.

**The engine today:** 43 `rnd()` + 62 `chance()` + 8 `Math.random()` = **113 die-rolls** driving musical content. Grouped below by category.

---

## 0. FOUNDATIONAL: hands are roles, not fixed jobs
The generator hardcodes **right hand = melody (moves per beat)** and **left hand = accompaniment (moves per bar)**, with a single random `swap` (498, 2098) as the only way the left hand ever carries the tune. That is a false constraint. There are two **voices** — a *melody voice* and an *accompaniment voice* (and they can share or trade material) — and **either voice can be in either hand**: the tune can be in the left, chords in the right, and a composer moves material between the hands for a reason (register, contrast, giving a hand a rest, a moment of imitation).

So everywhere below that says "melody" or "accompaniment," read it as a **voice/role**, not a hand. The **hand-to-role assignment is a compositional choice** (which hand carries the tune, when they trade, when both share the texture), chosen for a reason, not fixed and not a coin-flip. This reframes categories 2, 3, 5, 6, 7 (the melodic/interpretive layer applies to whichever hand holds the melody) and category 8 (accompaniment can be either hand), and it replaces the random `swap` in category 9.

---

## 1. HARMONY — "no random harmony"
Currently by chance:
- **Next chord in the progression**: `moveChord` picks `rnd()` from the set of *legal* moves (555, 570, 603). Legal is not the same as chosen-for-a-reason.
- **Pre-dominant** placement (570, 602), **secondary dominant** yes/no and where (596 `chance .40`), **7th on the dominant** (997 `chance .40`).
- **Final cadence type** (559: perfect/plagal by dice), **mid-cadence type / period form** (525, 531).
- **Mid-bar harmony change** yes/no and to what (602, 603).
- **Suspensions** (736) and **accented dissonance / the 2nd above a chord tone** (799) by dice.

The reason it should be: a **functional progression with a planned goal per phrase** (tonic prolongation -> pre-dominant -> dominant -> cadence). The specific chord at each point is chosen by its *function* and by *voice-leading* to its neighbours; cadences are chosen to articulate the form (half cadence to close the antecedent, perfect cadence to close the consequent). Secondary dominants, 7ths and suspensions appear where they have a functional/voice-leading reason (tonicise the next chord; prepare and resolve), never by probability.

## 2. MELODY / NOTES — "no random notes"
Currently by chance:
- **Contour shape** picked from arch/wave/rise/fall (367, 709).
- **Direction and size of nearly every melodic move**: `stepTo` (712), interval fills (758-761), "step toward the contour, or a 3rd, or hold" (824-830), repeated-note re-pick (830), voice motion (969, 1199).
- **Cadence melody note** (748), **non-chord tones** (759 auxiliary, 799 the 2nd above), **anacrusis note** (1895).

The reason it should be: the melody is a **line over the harmony**, shaped toward a climax, moving **by step by default**, leaping only between chord tones and **resolving each leap by step**; every non-chord tone a properly **prepared and resolved** passing note / neighbour / suspension / appoggiatura; and the **motif of bar 1 developed** (sequence, inversion, rhythmic variation) so the bars relate to each other. Each pitch is chosen by melodic function, not a coin flip.

## 3. RHYTHM — bar rhythm and note values
Currently by chance:
- **Per-bar beat cells** drawn by `rnd()` from feel pools (168, 169, 184, 410, 418, 424, 433, 440, 441).
- **Split/subdivide a long note** (775), **anacrusis value** (1892).

The reason it should be: rhythm serves the character and metre and, above all, the **motif** — a rhythmic idea stated then developed and varied across the phrase. That single change is what kills both failure modes at once: the seven-identical-bars stamping *and* the unrelated-bars jumble. Density is shaped by the phrase (drive to the cadence, breathe after), chosen by the motif/phrase plan, not per-bar dice.

## 4. RESTS — "no random rests"
Currently by chance:
- **Whether to insert a rest and where** (1415, 1452, 1480, 1486, 1497, 1832), softened by "intent" biases (`drop`, `melBreath`).

The reason it should be: a rest is an **intended silence with a function** — a breath at a phrase or gesture end, a deliberate staccato-with-rest idiom, a texture drop (one hand rests) — and it must be **coherent across both hands**. Placed by function, not probability.

## 5. ARTICULATION — "no random accents, staccato" (also tenuto, fermata)
Currently by chance:
- The character's `stac` / `accent` / `ferm` are **probabilities rolled per note** (character table, 66-103).
- `pickStaccatoBar` (449) picks a **random eligible bar** to staccato; accent placement (1522); fermata (1832, 1840).
- (The **left-hand figure** articulation is baked into FIGBANK and *is* reasoned — the accent is part of the idiom. The reasonless part is the right-hand/expressive layer.)

The reason it should be: articulation follows the character and is applied **consistently across a whole gesture** (a detached passage is staccato throughout; a cantabile is legato). An **accent marks a real structural or metric stress** (a downbeat that matters, a syncopation, the phrase peak), never a random note. A **tenuto/fermata marks a real expressive point** (a cadential lean, the final chord). Every mark is justified or it is absent.

## 6. DYNAMICS — "no random dynamics"
Currently by chance:
- **Opening dynamic** (1654), **scheme** (1692), **all placement and hairpins** (1698, 1718-1736), **random climax bar** (1723).

The reason it should be: dynamics **shape the phrase arc by structure** — set the level at each phrase start, grow toward the phrase climax, ease at the cadence; hairpins span real crescendo/diminuendo shapes (a rising line to the peak, a falling line to the close). Placed by the phrase shape, not dice.

## 7. PHRASE MARKS / SLURS — "no random phrase marks"
Currently by chance:
- **Whether/which slur set** (1751, 1776-1778), the **two-note "sigh"** (1772).

The reason it should be: a slur is a **real phrase or sub-phrase boundary** (the melodic gesture it groups) or a specific articulation figure (a sigh on a resolving appoggiatura). Placed at real gesture boundaries derived from the phrase structure, not by probability.

## 8. ACCOMPANIMENT TEXTURE / VOICING
Currently by chance:
- **Which figure** (675, 1227), **whether to use a figure** (676), **texture type** (684-685), **broken-chord shape** (693-694), **mid-piece texture change** (958), **pah density** (938) and **spacing** (943), **chord density** (1059), **bass scale-run** (1205).

The reason it should be: the accompaniment is chosen for the **character** and kept **consistent**, its voicing **voice-led** (smooth inner motion, correct doubling), thinning at cadences and where the melody needs space; any variation is for a structural reason, not a die.

## 9. PIECE SETUP / FORM
Currently by chance:
- **Key/mode** (486, 489), **metre** (491), **swap** (498), **character** (637), **tempo** (643); **period form / where the half cadence falls** (516, 522, 525, 531).

The reason it should be: key, metre and character are legitimate variety, but should be **spread deliberately across the book** for coverage and to guarantee no two pieces cluster, rather than independently rolled per piece. The **form** (period type, cadence placement) is a compositional choice that follows from the piece's plan.

---

## How we work from this
Convert category by category, harmony first (everything hangs off it), then melody, then rhythm/motif, then the interpretive layer (rests, articulation, dynamics, slurs), then accompaniment voicing. Each conversion replaces a die-roll with a rule taken from documented theory + the grade spec, so the arbiter is the rule, checked once, not a per-piece correction. Diversity is preserved because at each reasoned choice there are usually several valid options; we choose among *those*, never among junk.
