# sr-studio framework audit

Auditing the live generation system against the three principles:

1. **Preference, not definites** - every musical choice a weighted lean; nothing forbidden or forced, only made more or less likely. The only hard limits allowed are the ones intrinsic to the grade.
2. **Thinking like a composer** - choices reasoned from the musical moment, not from mechanical proxies (bar index, string labels) or dice.
3. **Fully reasoned out** - the mechanism actually captures the musical idea, no stand-in proxies, no dead weight.

Live path only (the `_`-prefixed files and `.OLD` are dead). Env default: `vhDerive` on, two-voice rebuild on.

---

## Verdict at a glance

| Subsystem | Preference | Composer-thinking | Fully reasoned | One line |
|---|---|---|---|---|
| A. Accompaniment chooser (`accompaniment.mjs`: `chooseNote`, `beatHarmony`) | Yes (2 minor definites) | Yes | Yes | The model. What everything else should look like. |
| B. Harmony derivation (`vhDerive`, `moveChord`) | Mostly - scored, but hard structural pins + 2 hard bans | Yes | Mostly | Reasoned weights, but the pillars are forced not leaned. |
| C. Melody engine (`genContour`, `barRhythm`, `buildBar`, post-passes) | No - dice + clamps + overwrites | Partly - heavy position-proxies | Partly | A different, older paradigm. |
| D. Downstream pass stack (~8 passes editing the accompaniment) | No - post-hoc overwrites, not leans | Mixed | No | Compositional choices stamped on after the fact. |
| E. Curation (`generate()` score loop, `gen-batch`, `harmony-checks`) | N/A - sanctioned reject-and-reroll | N/A | Yes | Clean. Screens a finite book; never narrows generation. |
| F. Dead weight (in-generator LH renderer, NOVHARM passes) | - | - | No | A whole second accompaniment engine computed then discarded. |

**Headline:** only subsystem A is fully on the framework you rebuilt around. B is close. C, D, F are not - they are the parts that predate the rebuild or grew around it.

---

## A. Accompaniment chooser - the model

`chooseNote` and `beatHarmony` are pure weighted preference: every clause is `s += ...`, the best-scoring candidate wins, nothing is forbidden and nothing is drawn from a die. `beatHarmony` reharmonises the tune into a moving progression by leaning (change-pull, functional-pull, anti-retrogression, cadence-settle); `chooseNote` places each note by leaning (stepwise, contrary, continue-the-line, grounding, stay-on-your-side, final-bar settle). This is the reference implementation of all three principles.

**Two genuine definites remain, both in pool construction:**
- **Chord-tones-only pool.** `tonesInBox` collects only triad tones, so the accompaniment structurally cannot play a passing or neighbour non-chord tone. A composer's inner voice does. Hard restriction, not a lean.
- **Consonance as a filter.** `chooseNote` L112 and `support` L80 do `.filter(isConsonant)` (falling back to all tones only if none pass), so an accented dissonance (a suspension/appoggiatura in the accompaniment) is off the table. Falls back rather than crashing, but it is a filter, not a preference.

Neither bites often at grade 2-3, but both are the kind of definite the framework says should be a strong lean instead.

---

## B. Harmony derivation - scored, but the pillars are forced

`vhDerive`'s scoring (lines 267-312) is all leans - contrary bass, root-in-bass, functional continuation, recolour-under-a-held-note. Good. But around it sit hard constraints:

- **Structural pins** (963-987): bar 0 forced to I, the final bar forced to I, the pre-cadence bar forced to V, etc. These are the cadential pillars. Musically near-definitional, but they are hard overwrites, where the framework would make even these very strong leans (the way `chooseNote`'s cadence grounding is a lean, not a pin).
- **Bass leap ban** (271): `if (ad > 4) continue` - a bass motion over a 5th is removed outright, not disfavoured.
- **Dominant-resolution force** (924): V may resolve only to I or vi; the successor set is replaced. A strong tonal tendency, but encoded as a rule.
- **Grade filter** (925) and various split bans (1039, 1046, 1055, 1059) - hard `continue`s in the grammar.

Verdict: reasoned and mostly preference-shaped, but it still contains the "definite" pattern in exactly the places (cadence, dominant) where tonal habit is strongest. Whether those should become leans is the same philosophical call as the accompaniment's consonance filter.

---

## C. Melody engine - a different paradigm

This is the big divergence. Where the accompaniment reasons, the melody:

- **Rolls dice.** Genuine `chance()`/`rnd()` decide musical content: compound bar becomes a whole-bar hold `chance(0.12)`, syncopation `chance(0.08)`, every simple-time beat subdivision `rnd(qpool)`, the whole-bar partition `rnd(macro)`, the contour shape `rnd(w)`, the cadence figure `rnd(melPool)`. The accompaniment has zero dice; the melody is built on them. (Weighted draws are not *definites* - they are the opposite - but they are not *reasoned from the moment* either.)
- **Clamps hard.** Pitches folded into the window, beat-to-beat leaps capped to a 5th (even at wide grades, where an octave is legal - that cap looks like taste beyond the grade), static notes force-stepped. Most clamping is just the five-finger window (the sanctioned grade restriction); the wide-grade leap cap is the exception worth a look.
- **Overwrites in post-passes.** After the line exists, a stack of passes splice over it: raise ^6/^7, replace a bar with a tonal sequence, insert an appoggiatura, force the opening onto a tonic tone, force the cadence tone.
- **Proxies for musical meaning.** `b===0` = "the theme," bar-index arithmetic = "phrase function," contour-max = "the climax," a `character.id` string = "this is a march." Structural position and duration stand in for musical role throughout - the same class of shortcut as my "arrived = first tonic touch."

None of this is *wrong* music - it produces tunes you have approved. But it is not the preference-and-reasoning framework. It is draw-clamp-fixup-by-position.

---

## D. Downstream pass stack - choices stamped on after the fact

The live accompaniment is generated by preference (`accompany()`), and then edited by roughly eight post-hoc passes before it is final. Two kinds:

**Playability / grade repairs** (arguably sanctioned - they enforce the grade or the physics of two hands):
- `_clampChord` (chordMax), capability fold to the five-finger box, reach cap to an octave, hand-collision repair by octave shift, grade hand-range clamp.

**Compositional impositions** (these are the framework problem - they are musical choices applied as overwrites, not emerging from the reasoner):
- **Two-hand doubling** - replaces the whole accompaniment with parallel tenths off the melody.
- **Antiphonal echo** - overwrites an antecedent-cadence bar with an echo of the melody.
- **Motivic answer** - overwrites the answer bar with the transposed opening motif.
- **Inner counter-line / walking bass** (wide grades) - overwrites held chords with a moving line.
- **Hand-coordination breath**, **bass-arrival guard**, **moving-bar repeat breaker** - smaller edits.

The principle you have applied everywhere else says these should be *intentions handed to the chooser* (a bias it leans into where the music affords it), not stamps applied over its output. As-is, the final accompaniment is often not what the reasoner chose.

---

## E. Curation - clean

The `generate()` acceptance loop, `gen-batch` screens, and `harmony-checks` are all reject-and-reroll on finished candidates. None mutates or narrows the generator's vocabulary; there are no dice in the curation layer (variety is a deterministic least-used histogram). The fault-check constants are music-theory interval classes, not arbitrary. In the fallback loops only diversity relaxes; quality screens always apply. This is exactly the "screen a finite hand-picked book" boundary you sanctioned. No action needed.

---

## F. Dead weight

Under the default env, the entire in-generator LH renderer (roughly lines 2083-2706) plus several LH passes are **computed and then discarded** - the two-voice rebuild does `lh.length = 0` and repopulates from `accompany()`. A second whole accompaniment engine runs every generation and its output is thrown away. Separately, the `NOVHARM`-gated passes (anti-static pedal, four harmonic clamps) are off by default. This is not a music problem, but it is a "fully reasoned out" problem: two engines coexist, one is dead, and the discarded one still has its own hard rules that could mislead future edits. Worth removing.

---

## Recommendations, ranked

1. **Decide the melody question (C).** This is the largest gap between the two halves of the system. Either consciously accept the melody engine as-is (it works, you have said it is how you want it), or plan to bring it onto the preference-and-reasoning model. It cannot quietly be called "the same framework" today. This is your call, not a bug.
2. **Turn the compositional downstream passes into intentions (D).** Echo, tenths-doubling, motivic answer, inner counter-line should be biases the accompaniment chooser leans into, not overwrites applied after. Same "emerge from intention, do not stamp" principle you insisted on for figures.
3. **Soften the harmony pillars and bans (B)** if you want purity: the cadence/opening pins and the bass-leap / dominant-resolution bans become very strong leans rather than hard pins. (Caveat: these are the most defensible definites - they are near-definitional to tonal writing. Legitimate to leave them.)
4. **Relax the accompaniment's two definites (A):** let non-chord and dissonant tones into the pool as strongly-disfavoured options rather than filtering them out, if you want the accompaniment to be able to breathe a passing tone or a suspension.
5. **Remove the dead second engine (F).** If the `NOTWOVOICE` path is truly dead, delete the discarded in-generator LH renderer so the system has one accompaniment engine, not two.

## The honest tension

Several "definites" (tonic at the cadence, consonance on the beat, the five-finger span, V wanting to resolve) are so close to definitional of tonal music at these grades that forcing them is defensible. Your own framework has an answer for this: they should be *preferences so strong they never do otherwise*, not walls. The purest reading makes them leans; the pragmatic reading pins them and moves on. Points 3 and 4 are where you choose which reading you want. Points 1, 2 and 5 are not close calls - they are places the system is genuinely on a different footing from the framework.
