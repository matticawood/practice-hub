# Composer audit of the live generator — every decision reasoned against the three criteria

GOAL (Matthew) — TWO DIRECTIONS, both required:
  (1) NOTHING is there without reason. Every mechanism must exist because a composer would reason it into being; no binary
      cut where a composer would weigh, no proxy optimised in place of a musical function. (Sections 1-5 below.)
  (2) NOTHING a composer WOULD do is MISSING. Where the machine omits something a composer attends to, it must be added.
      This half is generative and must be read from what the actual rendered pieces LACK, never from a theory checklist.
      (Section MISSING below — in progress, anchored to observed output.)

LIVE surface only: compose.mjs, compose-adapter.mjs, grade-params.mjs, fingering.mjs (+ engine.mjs notation/validation, no
composition decisions). Dead files (accompaniment, two-voice, harmonic-plan, harmonic-rhythm, harmony-checks, variety) excluded.

CLASSIFICATION of each flagged decision:
- GRAMMAR = a legitimate hard constraint (grade canvas, playability/physics, or a definitional music-theory truth). Keep.
- LEAN-OK = already a weighted preference (a character propensity realised as a weighted draw). Keep.
- FAULT = a binary cut or a bare coin-flip standing in for something a composer would reason from the material. Fix.

================================================================================
## SECTION 1 — Harmonic core (compose.mjs, the journey / tonicisation / cadence)   [read in full, lines 180-309]

- L200 `if (d===pd || d===0 || d===4) return false` (journeyStep excludes just-heard chord, tonic, dominant mid-journey).
  VERDICT: **GRAMMAR.** The journey IS the pre-cadential span; a composer reserves I and V for the structural points (a
  mid-phrase I sounds like a premature cadence, a mid-phrase V pre-empts the approach), and immediate chord-repeat is handled
  by the HOLD/pace mechanism, not by re-picking. This is real harmonic grammar, not an over-cut. Keep.
- L201 `isLast ? c.fn==='PD' : (PD||AWAY)` (the last free slot must be a pre-dominant).
  VERDICT: **GRAMMAR.** Pre-dominant before the cadential dominant is textbook approach. Keep.
- L240 `if (free.length>=3 && rnd() < seqBias)` (sequence the free slots vs walk them).
  VERDICT: **LEAN-OK, with a reservation.** seqBias is a character propensity (a weighted draw, not bare). Reservation: it is
  ALL-sequential-or-all-walk from one flip; a composer sequences a SEGMENT when the material invites it. Low priority; note it.
- L250 `if (isLast || rnd() < pace(t))` (harmony moves or holds at this slot).
  VERDICT: **LEAN-OK.** pace = character moveBias × drama tension, a weighted per-slot lean; this is exactly how variable
  harmonic rhythm is produced. Keep.
- L268-269, L273 tonicisation site eligibility (skip tonic/dim targets, no stacked dominants, must add a chromatic tone).
  VERDICT: **GRAMMAR.** Definitional to what a secondary dominant is. Keep.
- L282 `pick({take:appetite,...})` (whether the piece takes a secondary dominant); site chosen by musical value at L283.
  VERDICT: **LEAN-OK.** WHERE is reasoned (V/V strongest, else nearest the climax); WHETHER is the character's chromatic
  appetite as a weighted draw. Keep.
- L296 `rnd() < cadWeight` (cadential 6/4 on the final cadence).
  VERDICT: **LEAN-OK.** cadWeight = character formality, a weighted draw. Keep.
- L226 `halfBar = (nbeats%2===0) ? ... : null` (triple metre holds one chord a bar; duple gets a mid-bar slot).
  VERDICT: **GRAMMAR (mild reservation).** One-chord-a-bar in 3/4 is the waltz/minuet idiom. Reservation: a composer DOES
  sometimes change harmony mid-bar in 3/4 (a cadential 6/4 already does, handled separately). Low priority.

SECTION 1 conclusion: the harmonic journey is, on honest reading, sound composer-grammar and weighted leans. No true binary-cut
FAULT here. (This matters: the "less coherent" music was my reverted sustained change + the fingering, not the progression.)

================================================================================
## SECTION 2 — Orchestration & character wiring (compose-adapter.mjs)

THEME the sweep surfaced: character identity is turned into behaviour through `feel`/`artic` category ternary chains
(cadWeight L142, chromColour L148, climaxLate/seqBias L153, gap L191, runReady L195, gracefulCad L196, answer L234). These
produce weighted VALUES (leans), so they are not cuts — but they are COARSE: three feel-buckets, and they mostly ignore the
character's other continuous traits. Reasoned judgment per item pending the middle/late compose.mjs inventories, but provisional:
- The ones that yield a weighted lean-value (cadWeight, chromColour, climaxLate, seqBias, runReady, answer, gap): **LEAN-OK**
  but coarse. A composer would let these follow from the character's continuous traits, not a 3-way switch. Candidate refinement,
  not a cut.
- L196 `gracefulCad: chr.feel !== 'crisp'` — a hard BOOLEAN the cadence resolution reads. Borderline; a lean would be truer.
- L153 `harmonicRhythmBars: rnd([1,1,2] | [1,2])` — a FLAT uniform pick. **FAULT candidate** (bare dice, ignores moveBias) —
  BUT must first confirm it is still consumed (the journey now sets harmonic rhythm via pace at L250; this field may be vestigial).
- L207 `texture = rnd(texPool)` — uniform pick, BUT the character's tex LIST repeats its preferred texture (e.g. grand
  ['block','rootfifth','block'] = block 2/3), so repetition IS the weighting. **LEAN-OK** (weighting by list multiplicity).
- L381 `if (rnd() < 0.5)` pickup shape (two-quaver rise vs single crotchet). **FAULT (small):** a bare 50/50 with no musical
  reason; a composer's upbeat shape follows the melody's opening gesture (leap wants a single push, a step wants the run).
- L317 `rnd() < chr.accent*0.7`, L335 `rnd() < lean`, L373 `rnd() >= ANAC[chr]` — **LEAN-OK** (weighted by a character trait).
- articulate staccato eligibility (L279 canStac 0.14s, L291 stacDurMax, L296-300 exclusions): **GRAMMAR** (tempo playability +
  definitional — you cannot staccato a note too long/slow, and a dotted note or a note before a rest is already detached).
- L178 hand-placement `rc < bestRoot-1 ? 0 : ...` (five-finger LH placement zeroes hands that cover too few chord roots).
  VERDICT: needs its own look — this is the grade-2 hand-placement that the fingering thread implicates. Hold for Section on hand.

SECTION 2 conclusion: mostly leans and grammar; genuine small FAULTS = the bare pickup coin-flip (L381) and possibly the
vestigial harmonicRhythmBars dice (L153, confirm usage). The feel-ternary coarseness is a refinement question, not a cut.

================================================================================
================================================================================
## SECTION 3 — Melody & rhythm (compose.mjs 400-850)

- L396 grade note-value floor filter. **GRAMMAR** (a grade may not use faster notes than its canvas allows).
- L448 redraw germ until >=2 events; L453-454 redraw if the germ is a flat run of equal values. **LEAN-OK but a smell.** A
  motif must have a shape, which is true; but re-rolling until it does is rejection sampling, not construction. Better: build
  the germ with a shape. Low priority (bounded, and the property it forces is real).
- L463 `rnd() < 0.5` choose develop-method (diminish a long note vs re-voice a beat). **FAULT (small).** How a composer
  develops follows the material: a bar with a long note invites diminution, a busy bar invites re-voicing. A bare coin
  between the two is not composer-thinking. Fix: pick the method from what the germ IS.
- L465 `rnd() < 0.6` subdivide one diminished crotchet; L468 redraw a beat until it differs. **LEAN-OK** (variety, bounded).
- L482 phrase-end/final broaden to a fixed cell. **GRAMMAR** (a cadence broadens; the germ/variant/fresh choice around it is
  a weighted pick).
- L513 held-note straddling a chord change holds if common to both chords, else splits. **GRAMMAR** (suspension/common-tone
  theory).
- L582 strong melody notes must be chord tones. **GRAMMAR** — this is the harmony-first core (clashes impossible by
  construction). Keep absolutely.
- L584-588 suspension offered only where it resolves; once taken, forced to its stepwise resolution. **GRAMMAR** (theory).
- **L550-551, L611 narrowBox (`hi-lo<=8`).** A hard range-width threshold that switches the contour peak/valley fractions AND
  gates whether the parallel-octave/fifth-with-the-bass penalty exists at all. **FAULT (medium).** Two problems: (a) a
  binary range-width cutoff flipping contour shape is the "bad ruler / bimodal box" the memory warns of; (b) worse, the
  parallel-with-bass avoidance should be UNCONDITIONAL — a composer avoids parallel octaves/fifths with the bass in EVERY
  piece, not only when the melody's range happens to be narrow. Fix: apply the parallel penalty always; let contour shaping
  scale continuously with range, not switch on a threshold.
- L647 melody picks the single highest-scoring candidate (deterministic argmax over the rich `score()` leans). **FAULT
  (medium).** The leans are computed like a composer weighs, then collapsed to the one local maximum — so the melody is
  deterministic given state and takes the locally-optimal note every time. A composer varies among near-equal good notes
  (for line, for interest, to avoid a predictable contour). Fix: weighted-sample among candidates near the top, not hard-max.
  (This is a plausible contributor to melodies feeling generic.)
- L678-680 passing/neighbour roles offered by interval size; L684 register filter; L685 `delete choices[a]` (a decoration
  must move). **GRAMMAR/LEAN-OK** (a passing/neighbour tone is defined by moving; register is the hand).
- L702 last note forced to tonic; L710/721-723 cadence penult pulled to a chord tone / the leading tone. **GRAMMAR**
  (resolution; the leading tone confirms the key).
- L707 gracefulCad reshape (character flag + leap>=5). **LEAN-OK** (a smooth character resolves the cadence by step; a real
  character trait, though the `>=5` is a hard edge — minor).
- L739-758 minor ^6/^7 spelling (harmonic-by-chord vs melodic-by-direction). **GRAMMAR** (this is the correct discrete
  harmonic/melodic-minor logic; a spelling is inherently a two-way theory choice).
- L787-802 playability nudges (protect strong/chord/climax/cadence notes; keep the nudged note stepwise, contour-preserving).
  **GRAMMAR** (protects the structural line; a nudge that is not a step is not a decoration).
- L819 `rnd() < gap` motivic-air (decided once per piece by the character's gap). **LEAN-OK.**
- L824-825 which weak crotchets clip; L848 breath length by legato vs detached. **GRAMMAR/LEAN-OK** (metric + articulation
  idiom; the final breathe/hold is a weighted pick).

SECTION 3 conclusion: the melody's harmonic construction and cadence theory are sound GRAMMAR. Genuine FAULTS: **narrowBox**
(range-width binary that also disables parallel-avoidance) and **deterministic argmax** (no variety among near-equal notes);
small: the develop-method coin (L463).

================================================================================
## SECTION 4 — Bass, texture, voice-leading (compose.mjs 850-1628)

- L855 breathe/hold weighted pick; L867 shortFrac>=0.5 button-vs-ring ending. **LEAN-OK / minor threshold.**
- L928-947 structural-bass DP: root/third leans, planned-inversion force (cadential 6/4), bass leading-tone rises.
  **GRAMMAR/LEAN-OK** (the DP weighs; the leading-tone-rises and inversion pins are theory).
- **L1014 strong-beat foundation filter — drops the fifth from the bass on a strong beat (root/third only).** **GRAMMAR** —
  this is "state the foundation, never a bare-fifth 6/4," a composer principle. Keep.
- L1069 walk-a-bar weighted dice; L1082 broken-bass prefers non-fifth foundation; L1125 walk direction flips at a range edge.
  **LEAN-OK / GRAMMAR** (foundation principle; stay in range).
- L1148-1152 walking-bass anti-verbatim redraw (avoid byte-identical bars). **LEAN-OK** (variety; bounded).
- L1159-1167, L1182-1183 bass passing tones avoid a cross-relation with the raised tune / avoid parallels with the tune.
  **GRAMMAR** (voice-leading theory).
- L1209/1215 animate a held chord only if held >=3 beats, inner voice moves <=5 and off the previous pitch. **GRAMMAR/
  LEAN-OK** (only a genuinely static chord needs animating).
- L1243-1260 respondToBreaths: a three-way WEIGHTED pick (continue/yield/answer) with gates (needs register room, a real
  beat-long breath, never the closing breath). **LEAN-OK** (weighted; the gates are structural truth).
- L1300-1334 reharmoniseStaticSpans: recolour a static held span only if the tune is static and every strong note stays
  consonant under the new chord. **GRAMMAR** (consonance-preserving; theory).
- L1350, L1418-1422 two-note voicing: the upper tone is a 3rd/6th (never a bare 5th/8ve); an inversion states the root above;
  the below-voicing is never the fifth (no 6/4). **GRAMMAR** (voicing states the chord).
- L1447-1452 grade-2 block/march tread (foundation on strong beats, outline up between); L1483-1493 oom-pah placement
  priority (root-stating-third > first inversion > ... ); L1475-1478 pah is the third, count by chordMax. **GRAMMAR** (texture
  idioms that state the harmony; the oom "priority cascade" IS the reasoning — state the foundation first).
- L1384-1390 breatheLH: never lift the final bar, only cadence/sub-phrase-end bars breathe, don't bare an unresolved leading
  tone, then a weighted lift. **GRAMMAR + LEAN-OK.**
- L1541-1586 resolveOuterParallels and L1590-1627 fixLHParallels: bounded re-voicing that breaks parallel octaves/fifths
  between the outer voices, escaping to a chord tone that is not the fifth and not another parallel, never re-articulating a
  drone. **GRAMMAR** (parallels are a hard prohibition; this is legitimate voice-leading repair). NOTE: these are post-hoc
  repairs; the harmony-first core is supposed to prevent most clashes by construction, so these should be catching residue,
  not doing primary work — worth confirming they fire rarely, not as a crutch.

SECTION 4 conclusion: the bass/texture/voice-leading is sound GRAMMAR (foundation-stating, parallel-avoiding, consonance-
preserving) and weighted leans. No new binary-cut FAULT of the melody/fingering kind. One thing to VERIFY (not a fault yet):
that the post-hoc parallel repairs fire rarely.

================================================================================
## SECTION 5 — Fingering (fingering.mjs, the LIVE fingerHandDP)

THE CORE FAULT (matches what Matthew caught in g2s_1):
- The reasoner has a SOFT, purely-local "hold the position" cost (AW=2.4 per unit of frame movement, L189) that the global
  optimiser can outweigh with a small local saving. So it SHIFTS the hand even when the whole phrase fits one position. There
  is NO term that says "this run of notes fits under one hand, so it stays in one hand." **FAULT (the big one).** The composer
  truth (Matthew): a hand does not move unless a note falls outside it. Fix: staying is the DEFAULT — partition the line into
  the minimal runs that each fit one hand-span, finger each run in one frame, and only allow a shift where a note genuinely
  lies outside the current hand. Read from the note span, NOT the grade.
- The consistency pass (L250-267) that would repair a resulting split-finger contradiction (the "D5=4 then D5=1" you saw) is
  escapable three ways: it only compares pitches within 8 note-indices (L257), only adopts a unification costing <=1.0 extra
  (L260), and a rest cancels it (L258). So contradictions survive in a long legato phrase. **FAULT** (secondary to the above;
  fixing the default-stay would largely remove the contradictions at the source).
- L40 a chord is collapsed to its outer note before the DP sees it, so an LH grip is fingered as a single line and the stack
  can get fingerings that cannot coexist. **FAULT** (the LH "two fingers that can't coexist" you caught).
- Hard cost near-walls: L130 +40 unfittable chord outer-finger, L203 return 20 white-to-black slide, L217/221 +12 thumb-under.
  **GRAMMAR-ish** (physical awkwardness/impossibility; strong penalties, defensible — a genuinely forced case can still pay).
- A/B/C confirmed: (A) grade / five-finger is NOT an input — correct, per Matthew it should be read from the note span, not
  the grade; (B) the only position-hold is the soft AW cost; (C) mid-phrase repositions are allowed because AW is local and
  cheap and the consistency repair is bounded.

SECTION 5 conclusion: the real, concrete FAULT cluster is here. The fix is the composer default: the hand stays in one
position across every note that fits it, and shifts only when the music leaves the hand — computed from the note span.

================================================================================
## BOTTOM LINE — the genuine faults (everything else is sound grammar or weighted leans)

Ranked by musical impact:
1. **Fingering does not stay in one hand position when the music fits one** (fingering.mjs). The default must be stay; a shift
   must be forced by a note outside the hand. Also: finger a chord as a grip, not an outer note; and the anti-contradiction
   pass then becomes unnecessary. THE priority.
2. **narrowBox** (compose.mjs 550-551, 611): a binary range-width threshold that switches contour AND disables parallel-with-
   bass avoidance except in narrow-range pieces. Make parallel-avoidance unconditional; make contour continuous, not switched.
3. **Deterministic argmax melody selection** (compose.mjs 647): weigh like a composer, then take the one local max — no variety
   among near-equal notes. Weighted-sample near the top instead.
4. Small bare coin-flips that should read the material: develop-method (compose.mjs 463), pickup shape (compose-adapter 381).
5. To VERIFY, not yet faults: the feel-ternary coarseness (adapter — leans, but 3-bucket), the possibly-vestigial
   harmonicRhythmBars dice (adapter 153), and that the post-hoc parallel repairs fire only rarely.

What is NOT a fault (checked, honestly): the harmonic journey, the harmony-first melody construction, the cadence theory, the
minor ^6/^7 spelling, the foundation-stating bass, the voicing, and the parallel-avoidance are sound composer-grammar or
proper weighted leans. The machine's harmonic thinking is largely right; the concrete faults are the fingering default and
the two melody-layer items above.

================================================================================
## MISSING — what a composer does that the machine does NOT (direction 2; anchored to observed output, in progress)

- **The melodic MOTIF does not organise the line (VERIFIED in code + heard in output).** A pitch motif exists: bar 0's
  strong-note intervals become `germ`, developed with an inversion (compose.mjs:655-661). BUT it enters selection as a single
  `+1.4` bonus that applies only when a candidate pitch EXACTLY equals the motif's predicted note (compose.mjs:596, 636), one
  lean among stronger contour and voice-leading leans, which argmax (L647) then collapses. So the motif drives the line only
  when it is already locally optimal, and vanishes otherwise. THIS is the mechanism behind "assembled, not composed" that the
  rendered pieces show (rev_0 undulates each bar a similar figure; g2s_1 circles without an idea; gentle2 formulaic). A
  composer's line IS the motif and its development; here the motif is a tiebreaker. What should be ADDED: the motif (and its
  transformations — sequence, inversion, fragmentation, augmentation) as a PRIMARY voice in the melody-vs-harmony negotiation,
  strong enough to shape the contour, not a minor bonus. This is the single biggest "missing" thing and it unifies with the
  argmax fault (#3) and the deterministic-melody problem.
- **Phrase DIRECTION / goal (candidate, from the same pieces).** Related: a composer's phrase drives to a point (a climax, a
  cadential goal). Several observed melodies undulate without an arc. There IS a contour/climax mechanism (contourAt, a placed
  climax); whether it produces an audible GOAL or just a gentle bump needs a focused look across more pieces before I assert it.

- **The DECEPTIVE cadence is built but NEVER used (VERIFIED in code).** The harmony engine fully handles a deceptive cadence
  (type 'DC', V->AWAY/submediant: compose.mjs:141,155, and the deceptive dominant resolution is in the function grammar at
  compose.mjs:114). But `formFor` (compose-adapter.mjs:70-79) only ever emits HC+PAC (period), IAC+PAC (binary), or a lone PAC
  (sentence / grade 2). It NEVER emits 'DC'. So no generated piece ever writes a V-vi surprise, though the device is sitting
  ready. A composer uses it to colour an antecedent or to interrupt and extend a phrase before the true close. What should be
  ADDED: let a period/binary take a deceptive cadence at an internal arrival (grade-appropriate: V-vi is teachable at 3-4),
  as a weighted option in formFor, so the built device is actually reached for. (Half cadences DO appear, in periods at 8+
  bars; grade-2's single-PAC short form is defensible.)

STILL TO EXAMINE (not yet asserted — the "missing" pass is incomplete; must be read from rendered output, piece by piece):
- The BASS as a genuine counter-melody: does it have its own singable shape, or mostly a root-per-bar with fills?
- Antecedent/consequent CONTRAST in a period: does the consequent answer the antecedent, or just repeat it a step away?
- Harmonic VARIETY at grade 2: is it perpetually I-vi-V-I / I-IV-V-I, or does the palette breathe?
- Register/hand INTEREST: do pieces sit in one narrow band, or use the instrument?
Each of these must be checked against real renders, not assumed. The MISSING half is genuinely unfinished.
