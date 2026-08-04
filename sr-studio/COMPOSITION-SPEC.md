# Sight-Reading Composition Spec — the decision-palette

**Goal:** an algorithm that knows the rules of tonal music, and at every point where there is a
genuine choice, *makes* one — an interesting choice, not the blandest — while staying inside the
grade's constraints. Formula = a broken algorithm that always grabs option #1 and tiles it. Good
music = holding the whole option-set and choosing *differently in different places, for musical
reasons* (repetition WITH variation).

This file is the single source of truth. Edit any line. The generator and all editing obey it.
Everything below is **weighted options with exceptions**, never binary must/must-not.

Sources: ABRSM syllabus (level dial, separate memory); craft from Iowa State OER, Baylor Piano
Basics, smbutterfield IBMT, artofcomposing, Berklee voice-leading, Puget Sound MT (research w8kbmft9k).

---

## 1. LEVEL (hard constraints per grade — the "no higher, no lower")
Use the locked ABRSM dial (keys, time, length, rhythm vocab, hand-position, dynamics). G2 = hands
together in a fixed 5-finger position, simple time, ≤2 accidentals, no semiquavers/chords. G3 = out
of position, semiquavers, 2-note chords, +3/8, ≤3 accidentals. G4 = +6/8 compound, anacrusis,
chromatic passing notes, fermata, tenuto; same ≤3 accidentals as G3.

## 2. CHARACTER (choose FIRST — it sets meter, tempo, texture, articulation)
Pick one per piece from the menu (Minuet, Waltz, March, Tango, Cantabile, Lament/Sadly, Adagio,
Scherzando, Giocoso, Leggiero, Gently, Lively, Lullaby, Lilting, Grazioso, …). Do not reuse a
character back-to-back. The character decides the accompaniment family (§5) and the rhythmic feel.

## 3. HARMONY — the functional grammar (choose the progression, then vary it)
Three functions: **Tonic** {I, vi}, **Pre-dominant** {ii, IV}, **Dominant** {V, vii°}. Flow
T → PD → D → T. Options at each chord (pick, don't default to I-IV-V):
- **I** → *anything* (most flexible). Interesting picks: I→vi, I→iii, I→IV6.
- **vi** → PD (ii, IV); vi often follows V as **deceptive** motion (V→vi) mid-phrase.
- **iii** → IV or vi (NOT ii).
- **ii / IV** (PD) → V (or vii°). ii6 is *more common* than root IV as the pre-dominant.
- **V** → I (perfect cadence) or **vi** (deceptive). 
- **IV** → I (plagal) or ii.
- **vii°** → I, usually as **vii°6**.
Idiomatic direction: vii°→V > V→vii°; IV→ii > ii→IV.
**Cadences (vary them across phrases):** perfect V–I (strong close), imperfect/half …–V (open,
ends the antecedent), plagal IV–I (gentle), deceptive V–vi (surprise, avoids closure).
**Chromatic palette:** diatonic by default; at G4 you may add ONE secondary dominant (V/V, V/vi) or
chromatic passing notes. Not more.

## 4. INVERSIONS & HARMONIC RHYTHM (this is where the bass sings)
- Use inversions so the **bass moves by step**, not root-to-root leaps. Canonical: I→V6→vi (bass
  1-7-1... stepwise), I→vi→I6, ii6 as PD, vii°6→I.
- **Harmonic rhythm must vary within the piece** — not exactly one chord per bar every bar. Hold a
  chord two bars sometimes; change mid-bar sometimes; move faster into a cadence.

## 5. TEXTURE / ACCOMPANIMENT (the left hand is a VOICE, and it VARIES)
Accompaniment families (choose by character): Alberti (low-high-mid-high — but "critically
overused", so don't tile it), waltz/oom-pah (bass on 1, chords on 2-3), broken chord
(bottom-mid-top-mid), block chords, **pedal tone** (held bass under changing chords), walking bass,
two-part counterpoint.
- These are **starting templates, not fixed patterns.** Vary by expanding register or changing
  rhythm. The LH has its OWN rhythm and shape: hold/pedal where the melody is busy, move into the
  melody's rests.
- **Do NOT tile one figure across all bars.** Change texture between the antecedent and consequent,
  or reserve a fuller texture for the cadence.
- V7 in LH: may omit the 5th; if the melody has the leading tone, omit it in the LH.

## 6. MELODY (chord tones + embellishment, shaped in phrases)
- Built from **chord tones**, connected/decorated by non-chord tones (§7). Mix **conjunct**
  (stepwise) and **disjunct** (leaps). Fill a 3rd-leap with a passing tone; approach and resolve
  larger leaps; don't embellish large leaps.
- **Shape:** give it contour — an **arch** (rise then fall) is the reliable default; place one clear
  climax (often ~2/3 through). Don't stay static; don't scale-up-scale-down mechanically.
- **Phrase structure = repetition WITH variation.** An 8-bar piece is typically **antecedent (4
  bars, ends open on a half cadence) + consequent (4 bars, varies the antecedent, closes on the
  tonic)**. The consequent RE-USES the antecedent's motif but changes its end (and maybe its peak).
  So *some* bars echo earlier ones (that's the motif) and *some* vary — never all-identical, never
  all-different. Sequences (repeat a figure a step higher/lower) and melodic inversion are the
  cheap, musical ways to reuse material.

## 7. NON-CHORD TONES — the on-beat-dissonance palette (choose by melodic direction)
On-beat dissonances that are **prepared and resolved are desirable**, not errors. Pick the NCT from
what the melody is doing:
- **Repeated note** → upper/lower **neighbour**.
- **Stepwise descent** → **suspension** (a chord tone sounded on the weak beat *before*, then TIED
  over into the strong beat where it becomes the dissonance — it does NOT re-attack on the beat —
  then resolves DOWN by step: 9-8, 7-6, 6-5, 4-3. Needs two voices + a tie, so **Grade 4 only**),
  escape tone, chromatic passing, anticipation.
- **Stepwise ascent** → **retardation** (resolves UP, 7-8), appoggiatura, chromatic passing,
  anticipation.
- **Leap of a 3rd** → **passing tone** (fill it).
- **Passing tone:** approached & left by step, SAME direction — may be accented (on-beat) or not.
- **Appoggiatura:** approached by LEAP, resolved by STEP (usually down), ON the beat — a good lean.
- **Anticipation / escape tone:** weak beat; anticipation works best at a phrase end (cadence).

## 8. VOICE-LEADING (keep it smooth)
- Minimise movement: keep common tones in the same voice; move the rest by step. No voice moves
  more than a 3rd between chords. Register leaps only during a chord's duration or at a phrase start.
- Double the root in root-position triads. In 7th chords keep the guide tones (3rd + 7th) and
  resolve the 7th down and the leading tone up.
- Avoid parallel 5ths/8ves between outer voices (a real one is a fault; hidden/other parallels are
  weighed, not banned).

## 9. THE VET (advisory, NOT binary — de-binarised)
The checker FLAGS, it does not forbid. On-beat dissonance is only a fault if it is **unprepared AND
unresolved** — i.e. NOT a suspension (a note **tied in from before the beat** that then steps down),
an appoggiatura (leapt to, steps out), or an accented passing tone (step in, step out). 6/4 on a
strong downbeat and a leap INTO an unprepared dissonance stay flagged. Everything else is a nudge for
judgement, not a wall.

## 10. GRADE-GATING — which craft elements are idiomatic at which grade
(CRITICAL — do not use a Grade 4 device in a Grade 2 piece.)
- **Grade 2** (hands together, fixed 5-finger, single note per hand, simple time, ≤2 accidentals):
  harmony is IMPLIED by two simple lines, not voiced as chords. Chords in the simplest terms
  (I, IV, V, vi, ii), mostly root position. NCTs: **passing and neighbour tones ONLY**. NO
  suspensions, NO appoggiaturas (need ties + independence), NO chromatics, NO secondary dominants,
  NO Alberti (out of position). Cadences: perfect + imperfect (plagal ok). Repetition-with-variation
  still applies.
- **Grade 3** (out of position, 2-note chords, semiquavers, +3/8, ≤3 accidentals): add first-inversion
  chords for a moving bass; simple broken-chord / oom-pah accompaniment; semiquaver passing figures;
  wider palette (ii6, vi, iii). Suspensions/appoggiaturas sparingly at most. Diatonic.
- **Grade 4** (+6/8 compound, anacrusis, chromatic passing notes, fermata, tenuto, ties): NOW unlock
  suspensions and appoggiaturas (ties + independence exist), ONE chromatic / secondary-dominant
  moment, richer inversions, two-part textures, compound-time rhythmic idioms.

## 11. FINGERING (sparse, ambiguity-driven — the pass we already worked out)
Mark a finger ONLY where the choice isn't self-evident: the first note of a phrase, a leap, or a
**position change** — the note where the hand actually re-organises (thumb tucks under ascending, or a
finger crosses over descending), NOT the note the thumb then falls onto. Trust a clear pattern (a
repeating figure, scale, chromatic run) after its opening. Never mark a note obvious within the
current hand position. Conventional fingers only: never finger a third as a thumb cross/under; no
jammed 5-4; reserve and economy. **Grade-gated:** G2 is a fixed 5-finger position → mark only the
opening finger of each hand; G3/G4 have real shifts → mark the shifts and leaps.

## 12. RHYTHM (idiomatic, varied, phrase-shaped — not one figure repeated)
Use the grade's rhythm vocabulary (§1). Build a **rhythmic motif** and treat it with
repetition-with-variation like the melody: the motif recurs (identity) and changes at the
phrase-end/cadence (interest) — never all-identical bars, never all-different. Longer notes at phrase
ends (breath), busier motion mid-phrase. The two hands are rhythmically **complementary** (one holds
while the other moves) far more than identical. No triplets below Grade 6; no syncopation as a
feature below Grade 5. Character sets the feel (§13). **Rhythm complexity is tied to TEMPO, not just character:** at a fast tempo the
bars fly by, so stacking several semiquaver beats in a bar turns frantic and un-idiomatic (a fast 3/4 with ten
semiquavers). A fast mark caps semiquaver RUNS to ~one per bar (quaver movement stays free, so it's still lively);
a moderate/slow tempo may carry more (semiquavers are playable and expressive at those speeds). Coherent single-
direction runs (an ascending or descending arpeggio/scale) and two-note oscillations read fine; the thing that
sounds "angular/jumpy" is direction-changing leaps to unpredictable NEW notes (up to one, down to another, up to a
third) — that specific pattern is the fault, not leaps or note-density in themselves. **Repeated-pitch rhythm:** a
repeated pitch wants an EVEN value (two quavers, two crotchets); a short/uneven repeat of the same pitch — a
semiquaver into a longer note of that pitch, adjacent (no rest between) — reads as a rhythmic stutter, because a
semiquaver is a connecting note that should MOVE, not repeat. The generator merges such adjacent semiquaver same-
pitch pairs into one note. Rest-separated repeats and equal-value repeats are fine and untouched.

## 13. STYLE IDIOM per character (each has its own conventions — grow this as we compose)
- **Minuet** (3/4, moderate, courtly): stately crotchet/quaver melody, 4-bar phrases, light LH
  (bass + occasional chord), often an upbeat.
- **Waltz** (3/4): oom-pah — bass on 1, chord on 2 & 3; lilting melody above.
- **March** (2/4 or 4/4): dotted rhythms, firm on-beat bass, accents, often an anacrusis.
- **Lullaby / Lilting** (6/8, G4): gentle rocking, LH sways low-high, sustained, soft.
- **Scherzando / Giocoso** (quick, light): staccato, off-beat accents, rests, playful leaps.
- **Cantabile / Espressivo** (singing): legato slurs, sustained accompaniment, an inner voice.
- **Lament / Sadly** (slow, minor): sighing two-note slurs, suspensions (G4), falling contour.
- *(add each character's conventions here as we write it.)*

**Generator-enforced so far** (the rest are carried by character params + the figure bank): rhythm complexity
capped at fast tempo (§12); MARCH melody biased to the dotted long-short figure; LAMENT (Sadly/Mesto/Lament) is now
a coherent style — minor key only (a sad mark never lands in major), a falling melodic contour, and sighing
two-note descending slurs instead of long legato phrases; LULLABY / lilting (6/8) forced to a rocking broken LH
(bass up to the top and settle back); a CANTABILE / held-chord INNER VOICE that traces a continuous stepwise
countermelody across bars (tracks where it left off, walks toward a chord-tone target chosen contrary to the tune,
through diatonic passing tones, staying between the bass and the melody) - real two-part writing, not a neighbour
wobble. **All §13 idioms flagged so far are now wired**; the file keeps growing as new style conventions surface.

---
**This file will never be "complete" — music is deeper than any list, and that's fine.** It GROWS.
When something is missing or wrong, it gets added HERE (gated to the right grade, as an option not a
law), so your corrections accumulate in one visible place instead of being lost in memory or
binarised into the generator.
