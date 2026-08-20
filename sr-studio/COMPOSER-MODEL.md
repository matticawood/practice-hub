# The Composer Model — sr-studio generation architecture

The compositional model the generator implements. It reproduces a composer's **decision process**, so that
musical legitimacy holds **by construction** — not by leaning away from faults after the fact, and not by
generating faults and rejecting them. Written before the rewrite so the reasoning is pinned.

The spec is Matthew's three criteria, held at every step:

- **Written like a composer** — every note placed by the reasons a composer actually uses.
- **Preference-based** — among the coherent options, choose by weighted lean; nothing is forbidden except the
  grade canvas. A near-never move is scored so low it never wins but stays *reachable* (a composer *can* do
  anything; some things are just so far down the list they never happen).
- **Fully reasoned out** — no note is placed without a role; every tension resolves explicitly.

The one hard category is the **grade canvas** (five-finger position, note-value floor, range, metre): the
boundaries the composer writes *within*, not musical choices.

**Status legend** — every claim below is tagged so nothing gets ossified that shouldn't be:

- **[T] Theory** — solid, grounded, *definitional* music theory that cannot be otherwise (e.g. "a suspension
  resolves down" — that is *what a suspension is*; "a passing tone is stepwise" — likewise). Encoded as fact.
- **[P] Preference** — an idiom or tendency, not a law. Encoded as a **weighted lean**, heavily weighted where
  the idiom is strong, but always reachable (the composer *can* do otherwise; some things are just far down the
  list). Never a hard rule.
- **[C] Canvas** — a grade/notation boundary (the exam's definition of the grade). Hard, but not a musical
  choice — it's the frame the composing happens inside.

The rule of thumb Matthew set: if it's complete, immutable theory, state it as fact; **everything else follows
the three criteria and is heavily-weighted preference where the idiom is strong.**

---

## 1. The core inversion (why the old pipeline dead-ended)

**Old:** melody built first → harmony derived from the finished melody → bass fitted to that harmony. The three
voices end up reasoned against **different chords at the same instant**, so clashes (leap-clash, parallel
perfects, 6/4, beat-clash) are *produced*, then leaned-away or rejection-sampled out. That is not how a composer
writes, and it cannot be patched: you cannot lean your way out of a pipeline that reasons the voices against
different harmonies. Every per-voice lash-up hits a floor (~19% leap-clash) and stops.

**New:** the **harmony comes first** (a plan with its own rhythm); the **melody is generated as the ornamentation
of that harmony**; the **bass is a line through the same chords**. Melody and bass share one harmony, so a clash
is structurally impossible — there is no step at which a melody note is chosen without the harmony (and therefore
the bass) already under it. A composer hears both hands as they place each note; the machine must place each note
the same way.

---

## 2. The exhaustive role vocabulary

Every melodic note, relative to the harmony sounding **at its moment**, is exactly one of:

| Role | Definition |
|---|---|
| Chord tone (harmonic note) | a member of the chord in force — stable |
| Passing tone | stepwise, between two chord tones |
| Auxiliary / neighbour | steps away from a chord tone and back |
| Escape tone (échappée) | steps away, then leaps back |
| Appoggiatura | accented (on the stress), approached by leap or step, **resolves by step** |
| Suspension | held from a consonance, becomes the dissonance, **resolves down** |
| Retardation | as a suspension but **resolves up** |
| Anticipation | arrives early onto the next chord's tone |

There is **no eighth category** — a pitch against a harmony always has an interval, and that interval *is* a
role. So at any moment the loop has a finite, defined set of candidate roles to weigh, and **a note is only
placed once it has a coherent role.** This completeness is what makes the process buildable.

**[T]** the vocabulary is exhaustive and each role's *defining behaviour* is fixed (a passing tone is stepwise; a
suspension resolves down; an appoggiatura resolves by step). **[P]** *which* role a note takes at a given moment,
and which pitch realises it, is chosen by weighted preference (contour, motif, voice-leading), never a rule.

---

## 2b. The harmonic role vocabulary (the same reasoning, one level up)

Harmony is self-similar: the note-vs-chord logic reappears as chord-vs-progression, so the loop runs **one
reasoning pattern at both scales** — *"is this event structural, or a named embellishment of something structural,
and does it resolve the way that role requires?"* There are two axes.

**Axis 1 — Function (what a structural chord *does*).** **[T]** every functional chord reduces to a small finite
set of functions — **Tonic / Predominant / Dominant**, plus a **"departure/away"** role (vi, iii) that some
theories fold into T/PD and the code keeps separate. This is the functional grammar of common-practice tonal
harmony (the whole domain here). **[P]** the exact granularity (3 vs 4), and the function of an *ambiguous* chord
(vi as tonic-substitute vs departure), is a modelling/context choice — weighted, not fixed. **[P]** the syntax
*ordering* — T→PD→D→resolve, and "avoid retrogression (V→IV)" — is a **strong idiom (~90%)**, a heavy lean, NOT a
hard rule (V→IV, deceptive resolutions, and prolongations all happen). **[T]** that a dominant *tends to resolve*
(rather than drift nowhere) is near-definitional of dominant function — an extreme lean — but **[P]** *where* it
resolves (authentic to T, deceptive to vi, prolonged) is a choice.

**Axis 2 — Structural vs embellishing (the hierarchy — your melodic list, one level up).** **[T]** every chord is
either a **structural** chord (a functional pillar) or an **embellishment** of one, and the embellishment types
are the *same* roles applied to a chord — each with its **[T]** definitional resolution:

| Embellishing chord | Definitional behaviour [T] |
|---|---|
| Passing chord | connects two structural chords by bass step |
| Neighbour chord (pedal 6-4) | steps away from a structural chord and back |
| Cadential 6-4 | an accented dissonance over V that resolves to V |
| Arpeggiated 6-4 | one harmony prolonged by moving through its own tones |
| Suspension / retardation chord | a suspension that momentarily spells a chord, resolves |
| Anticipation chord | arrives early onto the next chord's tone |

**[P]** *whether*, *where*, and *how often* to embellish, and *which* embellishing type, is all weighted
preference. An embellishing chord adds **no function** — it decorates.

**Tonicisation (recursion) — a third layer, distinct from embellishment.** **[T]** you can momentarily elevate a
chord to *local tonic*, nesting a whole local T–(PD)–D–T aimed at it, via its **secondary dominant** (V/x). This
is *different from* embellishment: it adds a nested function, it does not merely decorate. **[T]** a secondary
dominant resolves to its target (definitional). **[P]** whether and where to tonicise is a weighted, deliberate
device — never automatic.

---

## 2c. The grade-gated harmonic palette (canvas)

The palette the two axes draw from is **[C]** bounded by grade — the exam's definition of the grade, so hard, but
not a musical choice:

- **Grades 2-3 — one diatonic functional space.** **[C]** No chromatic chords, therefore no secondary dominants,
  therefore **no true tonicisation** — because a genuine tonicisation needs the target's leading tone, which for
  nearly every diatonic target is the chromatic note that's disallowed. What *is* available diatonically:
  - Home T/PD/D + embellishing chords, all in-scale.
  - Diatonic emergent chords (the two lines walking their own in-scale chords between placements).
  - **[T]** the one genuine diatonic tonicisation: a minor key's move to its **relative major (III)** via the
    natural-minor **♭VII** — e.g. A minor G→C, where G major is diatonic and B really is C's leading tone. Major
    keys have no equivalent; their strong secondary tonicisations all need a chromatic leading tone.
  - Everything else that *looks* like tonicising a non-tonic (Dm→G, Em→Am) is only a **weak modal emphasis** — no
    leading-tone pull — not a true tonicisation.
- **Grade 4 — the recursion layer unlocks.** **[C]** secondary dominants are permitted, so any diatonic target
  can be genuinely tonicised (V/V, V/vi, …), bringing the chromatic leading tones.

**[P]** *within* whatever the grade permits, all of it — which function, which chord realises it, which
embellishment, whether to use the diatonic III-tonicisation or (at G4) a secondary dominant — is weighted
preference. The grade sets the box; the composing inside it is all leans.

---

## 3. The two rhythms are decoupled

- **Harmonic rhythm** — how fast the chords change — comes from the **plan / the piece's harmonic identity**.
- **Melodic texture / density** — how busy the line is — comes from **style / character**.

Neither dictates the other. A held note over four changing chords, running notes over one static chord, and a
chord-per-note are all normal. They overlay; the **only** coupling is local — *at each melodic note, the note
relates to whatever harmony sounds at that instant.* (Do **not** derive melodic density from harmonic rhythm —
they are independent axes.)

---

## 4. Felt-stress scaffolding (not the barline)

The structural (chord-tone) notes gravitate to the **felt stress**, not the notated strong beat. **Syncopation**
moves the stress off the beat — a note tied over the beat, a longer off-beat note, a dynamic accent off the beat —
so a syncopated note carries the chord-tone weight even when metrically weak, and can locally **invert** the
strong/weak weighting; the on-beat note it robbed can become the passing tone.

> **Rule:** the structural notes fall on the felt stresses, wherever the rhythm puts them; an emphasised note is a
> chord tone **unless** it is a prepared or accented dissonance (appoggiatura / suspension) that resolves.

"Strong beat = chord tone" is only the default and it shatters on syncopation, on the appoggiatura, and on the
held note below — which is exactly why the loop holds *reasons*, weighed by preference, not a rule.

---

## 5. Held notes spanning a chord change

A melody note that covers more than one chord must work against **every** chord it spans: a common tone all of
them share, or a suspension / pedal (dissonant against one, resolving). This is "the harmony moves under a still
line." Negotiation: if the held note is load-bearing (a pedal, a sustained peak), the **harmony** is chosen to
keep containing it; if the harmony is load-bearing (a cadence underneath), the **held note** must be a common
tone or resolve.

---

## 6. The negotiation — cheapest budget first

When the note the line wants is **roleless** (no coherent role against the harmony + bass), something gives.
Spend from the cheapest budget first; protect what is load-bearing:

1. **Bend the line** — nudge to the nearest note that *has* a role. Cheapest: the exact pitch of a free
   connecting gesture is disposable.
2. **Bend the harmony** — only if the note is load-bearing (the motif's target, the wanted peak/colour) *and* the
   harmony can legitimately move there **within the grade's palette (§2c)**: move the bass/chord so the note
   becomes a chord tone of a new, valid chord (the emergent chord; Matthew's C–G–Am–F). At grade 2-3 that new
   chord must be diatonic; only at grade 4 may it reach for a chromatic secondary dominant to catch the note.
3. **Bend the rhythm** — put the note where its role is legal (off-beat, where "passing" becomes available), or
   hold/delay it.

The high-cost budgets — the **harmonic plan** (the journey to the cadences) and the **motif / structural
importance** — are protected; free connectors are spent first.

---

## 7. The leap acid-test

A **leap forfeits the decoration roles** (passing / auxiliary / escape are stepwise; the accented dissonances are
step-resolved). So a leapt-to note has only two legitimate roles left: **a chord tone, or the seed of a new chord
the harmony moves to.** The composer's reasoning at a leap is iron: *"I'm leaping — I land on a real harmony:
either this note is in the chord I'm on, or I'm moving the chord to meet it."* There is no third option. This is
precisely the reasoning the old pipeline lacked — it let the line leap where its contour pointed and asked the
bass to cope afterward, which is the whole origin of leap-clash.

---

## 8. Emergence / reharmonisation — a deliberate device, not the default

Default is **constraint**: the melody is derived from the harmony, every note role-defined. The line only "makes
its own chords" (walking/emergent harmony) where the composer **chooses** to. The classic device: a returning
motif re-underpinned by a different chord — A–B–C–D over Am, then the same pitches over G, so the ear re-hears
which notes are structural (A/C vs B/D). The pitches stay; the chord moves; the metric/harmonic reading flips.
This is the leadership-flip / "two hands written together" layer that sits **on top of** the foundation — a
chosen colour, not the everyday mechanism.

---

## 9. Short horizon

A note's role depends on its **continuation** (a passing tone is only passing if it steps to a chord tone next).
So each note is chosen holding the next one or two in view — the **gesture / beat-group** as the unit, not an
isolated note. A truly note-at-a-time loop with no horizon cannot classify roles correctly.

---

## 10. The build (the generation loop)

1. **Frame the piece:** key, metre, character/style, form (phrase structure + cadence plan), and the **harmonic
   plan** — the functional journey (T → PD → D → T to the cadences) with a **harmonic rhythm** (its own rate of
   change), drawn from the **grade-gated palette (§2c)**. Motif seed. Melodic texture drawn from the style.
2. **Compose forward, phrase by phrase, moment by moment.** At each melodic onset `t`:
   - The **harmony in force at `t`** is known from the plan (it may be moving between placements), and is itself
     role-classified (§2b) — a structural functional chord, or a named embellishment prolonging/connecting one.
   - The **felt stress** of `t` is known from the metre + the style's syncopation.
   - **Choose the melody note by role:** on a felt stress → a chord tone (which one decided by contour, motif
     development, and voice-leading), unless a deliberate accented dissonance; off-stress → a decoration whose
     role is fixed by its approach and its continuation, connecting the structural chord tones.
   - The **bass / counter-line** takes a tone of the *same* harmony as its own line (stepwise, contrary where it
     can), so the outer vertical is always a coherent sonority.
   - If the wanted note is **roleless**, apply the cheapest-budget negotiation (§6).
   - Where the piece calls for it, allow the **emergent device** (§8): the line walks the harmony to a new chord,
     and the harmony moves with it.
3. The **structural chord tones anchor to the plan's placed chords**; the **surface** (decorations, emergent
   motion, syncopation) fills between them. Harmony is *what the two lines make*, decided as they are made.

Because every note is placed only once it has a role against the shared harmony, the cross-voice faults
(leap-clash, parallel perfects, 6/4, beat-clash) cannot be written in the first place. Rejection sampling drops to
a true rare backstop; the grade canvas is the only hard boundary; everything else is a weighted, reasoned
preference — the three criteria, made architectural.

---

## BUILD STATUS (`compose.mjs`)

The core is built and verified by construction (`verify-stage3.mjs` + probes). Measured over 300-400 pieces per
grade/mode, all as weighted preferences (no walls — the offending options stay scored-in the candidate pool):

- **Stage 1 — harmonic frame** (`harmonicPlan`): functional plan from the grade-gated palette, own harmonic rhythm,
  cadence goals, minor's raised-^7 dominant. Returns `{events, chords, cadences, pins}`.
- **Stage 2 — melody as ornamented harmony** (`composeMelody`): chord tone on every felt stress, role-classified
  decorations between. Now carries the **motif** (§ below).
- **Stage 3 — bass / counter-line** (`composeBass`): a line through the *same* chords; root by default, smooth,
  contrary-leaning, parallel-avoiding, grounded at open/cadence. **leap-clash / parallel-P / beat-clash / 6-4 all
  0.0%** at every grade+mode — the ~19% leap-clash floor of the old melody-first pipeline is gone by construction.
- **Stage 4a — motif**: one rhythmic germ (restated ~50% of bars, developed/contrasted the rest) + a melodic germ
  from bar 0, developed by sequence / inversion / fragmentation. Melodic-motif echo ~95%, pieces ~99% distinct —
  unity emergent, not forced.
- **Stage 4b — negotiation + emergence**: cheapest-budget line-bend (snap a roleless want to a chord tone); the
  **emergence device** = Matthew's own "same melody note, different chord" substitution, a minority ~35% of pieces
  (one recolouring each), function-preserving (IV↔ii, vi↔iii, tonic-substitute), and vertical-clean by construction
  (the note stays a chord tone of the reharmonised chord, which the bass then reads).
- **Stage 4c — grade-4 tonicisation**: a secondary dominant V/x as an absolute major triad a fifth above a diatonic
  target — chromatic third falls out of `chordPCs`, both hands read it, resolves 100%, chromatic 100%, ~35% of g4
  pieces, **zero** in grades 2-3.

**PENDING — Stage 5 (integration):** swap this core into the live pipeline (rendering, validation, fingering,
dynamics, articulation, per-grade ranges/metres/characters), then regenerate + verify the full battery against the
old generator. Until then `generator.mjs` stays live and untouched.
