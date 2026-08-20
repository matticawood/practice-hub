# PORT ROADMAP — old machine (generator.mjs + accompaniment.mjs + checks + grade-params) → new machine (compose.mjs)

Method (Matthew): go through every line of the old machine; keep only what is (1) genuinely reasoned, (2) preference-based, (3) how a composer thinks; file it by category; port it to the right place in the harmony-first machine. Full per-line catalogues in `scratchpad/port-catalog/{A..F}.md`. The old note-generation ORDER (melody-first → derive harmony) is SKIP; the DOMAIN reasoning ports.

Legend: **[core]** biggest levers · src = old line refs · → target in compose.mjs.

## 1. VOICE-LEADING / BASS + INNER VOICES  **[core — replaces my hand-tuned bass]**
- **`chooseNote` preference-scorer** (accompaniment.mjs 98-197). Every note by summed weights, nothing forbidden; sub-leans: contrary-motion (4b), keep-going/no-bounce (4c), NCT only as stepwise off-beat (4d), consonance-with-tune (4e), **held-bass span-lookahead** so a held bass fits the tune's LATER on-beat notes (4f), **bass grounds root not 6/4** (4g), cadence/opening/final grounding (4h-4k), 3rd/6th richer than bare 5th (4m), **parallel-perfect suppressed at source −8, still in pool** (4n), stay-your-side duration-aware (4o). → the new `structuralBassLine`/`bassSkeleton` chooser; supersedes my penalty-knob thrash. 6/4 + parallels avoided BY CONSTRUCTION here.
- **beat-by-beat voice-leader** (generator 2540-2584): contrary bass, root/3rd grounded, 5th only as smooth passing step, **spell the change with a tone the previous chord lacked** (2564).
- **`chordVoiceUpper` / `struck2` / `heldVoice`** (generator 2401-2521): least-motion inner voices, **guide-tone(7th)>3rd>5th priority, never drop the 3rd for a root-double**, no crossing, mud guards (low close intervals), anti-monotony 3rd→6th→5th inversional variety.
- **INNER COUNTER-LINE** (generator 2839-2896): animate a held chord — walk the top voice as a continuous inner line across bars (`innerPrev`), contrary to melody, diatonic passing between consonant endpoints, under the tune. → fixes "bass static".
- **WALKING/PASSING BASS pickup** (2898-2936): step a diatonic pickup into a leapt bass arrival, using existing rhythmic space, budget ~nbars/3.
- **V7→I 7th resolves down** (2816-2837); **harmonic-minor raise ^7 only on dominant bars** (3972-3988); **aug-2nd resolver** (3989-4005).
- utilities: `tonesInBox`, `semisOf`, `support` (accompaniment 65-83).

## 2. HARMONIC GRAMMAR + PROGRESSION  **[core — richer harmony off the I-IV-V rut]**
- **GRAMMAR successor table + moveChord** (generator 879-934): weighted successors biased AWAY from bare I-IV-V (I→vi/ii, IV→ii), dominant-must-resolve (H1, no retrogression), root-motion strength (desc5>desc3>ascStep), travel-toward-unvisited `_spread`, admit-within-1.05 for variety, least-used-transition tie-break. DATA: GRAMMAR, ROOTDEG/rootMotion, FUNC_NEXT/FORD (accompaniment 20-63). → replace the thin grammar in `harmonicPlan`.
- **ONE chord vocabulary all grades; grade decides VOICING not membership** (870-876). CHm/CH/CH_EXTRA = DATA.
- **harmonic rhythm as character property** (980-985): hold period crisp=2/smooth=4/other=3, holds include I and V. **midBarChord per grade** (grade-params `harmony.midBarChord` none/cadential/enrich).
- **bar-split reasoning** (996-1062): split only for functional work (static bar needs motion / pre-cadence intensifies); **never split the pre-cadential V** (1030); ground downbeat, change on weak beat (2586-2612).
- **secondary dominant V/V once-per-piece** (1005-1029) + **confirm-return-home (natural 4th over V→I)** (1063-1074); minor split only to LT-free chords (1055).
- **grade-2 cadential predominant, ii-vs-IV by voice-leading** (1076-1108).

## 3. CADENCE / FORM  **[fixes what I keep re-breaking]**
- **period: HC-midpoint, PAC-close** (837-844); **parallel restate FORCES HC** (845-847); mid-cadence pool gated only by harmonic support (848-861); interrupted/DC gate (851-966).
- **final cadence perfect-vs-plagal lean** (935-955): least-used, gentle→plagal, minor→authentic (~15% modal LT-free kept).
- **progression bar-role assembly** (957-986): approach the mid-cadence, penult=preTonic, final=I.
- **opening grounding: state the key in ONE voice, don't force the bass** (3953-3971).
- **melody LEADS INTO the cadence by step from a step above** (1720-1725); **anticipation** at final cadence (C-cat 1903-1925); minor authentic-close LT in the melody (1693-1719) with `ltReach` grade gate.
- phrase-function labels open/apex/drive/flow/cadence (1410-1421) — the backbone I lacked.

## 4. MELODY / ORNAMENT  **[the melodic character I'm missing]**
- **melody = chord-tone skeleton + NCT connectors** (1343-1371) — already the new model; port `connect()` NCT logic.
- **figureFill: gaps → real figures (run/turn/neighbour/arp) from character figBias, always move, fold at edges** (1619-1657); resolving turn for flat regions (1635-1641); arc/fold for long spans (1642-1656).
- **germ capture from bar 0 + tonal SEQUENCE / INVERSION(range) / FRAGMENTATION(head) / AUGMENTATION(apex)** (1676-1685, 1809-1844, 1449-1552), gated on real harmonic opportunity + strongest root motion.
- **anti-repetition done RIGHT** (1777-1808): a repeat is legal only if germ / harmony-recolours / apex-cadence-settle; else nudge to a neighbour. NO count-wall.
- **three-minors leading-tone pass** (1727-1776): raise ^7 on dominant OR ascending-to-tonic-not-dwelt, natural when lingered/descending, cadence overrides linger, ^6 raised only in the ^5-^6-^7-^8 climb. PORT WHOLESALE.
- **suspension / appoggiatura(leap-in,step-out,one-per-piece at peak) / anticipation / échappée** (1845-1949), grade-gated via `nonChordTones`.
- opening on a tonic-chord tone (1518-1531); doubled-thirds gated by legato articulation (1950-1974).
- rhythmic motifs A/B + varyRhythm develop-don't-copy (1372-1448); calmMel busy-acc→simple-melody (1217-1228).

## 5. ACCOMPANIMENT TEXTURE  **[intentions, not stamped patterns]**
- **texture-as-INTENTION** (accompaniment 252-335): held/pedal/broken/oompah/walk/counter/double/answer/echo/tenth; a texture is a bias that **thins to a sustain** where the material doesn't support it (`runFigure` 232-250) — antidote to stamped arpeggios.
- **phrase-level texture planning, contrast the previous phrase, hold a dress across a phrase** (`phraseWeights` 363-388, `accompany` 397-452).
- **`answer` (imitation, quote the motif whole-or-not-at-all)** (282-305); **`tenth` (parallel 10ths, break to tonic at cadence)** (321-334); `double` don't-collapse-a-step (268-281).
- texture from character.tex (generator 1110-1216); compound must flow (1201); alberti/broken/bassline read PER-BEAT harmony (2627-2680); swap RH = voice-led chords (1208-1245).

## 6. DYNAMICS  **[fixes formulaic dynamics]**
- **energy(bar) intensity curve = melodic height + hand-spread openness + harmonic tension (HTEN)** (3239-3258); dynamics follow it (a falling line can crescendo when harmony is the reason).
- **entailment-gated shape schemes** (peaks/arc/terraced/subito/echo/sparse): a shape is eligible only if the piece entails it (3268-3286); shapePhrase hairpins into the open bar (3259-3267); arcNeed sensitivity from character.hair (never a veto); contradiction/redundant guards.
- grade-scaled DL ladder + clampToDL (3214-3217, canvas). opening dyn from character band.

## 7. ARTICULATION
- **staccato = recurring detachable figure, identical each appearance, only where playable at tempo** (`staccatable(d,bpm)`) (3357-3387); phrase slurs on conjunct singing phrases, never straddle the seam (3402-3417); lament sighing 2-note slurs on stressed descents (3389-3401); **accents by emphasis-scoring rubric (syncopation/chromatic/agogic/leap/peak), one-per-bar, earned** (3418-3465); tenuto union-of-reasons (3470-3503); fermata earned by a broad close (3504-3526). All grade-gated via `gp.expression`.

## 8. RHYTHM
- rhythm motifs + varyRhythm (1372-1448); anacrusis grade-gated, step-into-downbeat, lilt-leaning (3580-3606); dotted-crotchet-on-beat (3631-3652); rest realisation: style dictates FUNCTION not quantity, coherent across BOTH hands, breath matches articulation (2938-3032); hands-breathe-together (accompaniment 500-518).

## 9. CHECKS → fold into compose-audit.mjs
- from harmony-checks.mjs (all genuine, keep): `beatClash`, `parallelPerfects`(onset), `lhParallels`, `leapClashes`, `sixFours`(chord-aware), `handCrossing`, `melodicAug2nd`. **Do NOT resurrect `beatDissonance`** (retired, context-free wall that "forced the book bland").
- `melodyMonotony`(triad-only / one-pitch>42% / stutter), `thinAccompaniment`, `thinHarmony` — grade-scaled via `gp.richness`, read correct staff via `_mel` (4147-4178). (My audit already re-derived rougher versions — replace with these.)
- variety.mjs `novelty`/`report` — bank-level anti-convergence steering as an acceptance LEAN, not a wall.
- generate() scoring taxonomy: errors + genuine faults are walls, thinHarm is a ×500 lean, collisions are REPAIRED not rejected, suspensions protected. Metre spread by UNIFORM exploration (difficulty-correlated), identities (swap/doubling/dyn) by least-used.

## 10. GRADE-CANVAS (DATA, wholesale) — grade-params.mjs
- Already imported. Ensure the new machine reads: fixedPosition/span, chordMax, harmony.cadences/secondary/sevenths/**midBarChord**, **nonChordTones per grade**, richness floor, rejectPlainArpeggio. Capability-CLAMP not filter (3931-3950). reach-cap octave (3674-3686), hand-range clamp (3714-3734), chord-size clamp (3923-3930).

## 11. NOTATION (much already reused via engine.mjs)
- clean-split into tied values (4034-4067), different-pitch tie-drop (4068-4082), register-normalise tonic~D4 (811-817), collision repair by octave never touch melody (3687-3713), bar-sum invariant (3568-3578). fingering = existing `fingerHand` (markHand is dead, SKIP).

## 12. DATA tables to lift verbatim
CHARACTERS + CHAR_FIGS + character.dyn/tex, GRAMMAR, ROOTDEG/rootMotion, FUNC_NEXT/FORD, CHm/CH/CH_EXTRA, CHORD_DEG, `_HT`/HTEN tension, `_fcOpts` cadence weights, harmonic-rhythm hold periods (2/4/3), FIGBANK, RHBANK, QFEEL, KEYINFO, snapNear, NATURE (texture axes).

---
## SKIP (architecture-specific / dead)
vhDerive derive-harmony-from-melody flow (keep the grammar it enforces); anchor[] override map (keep pillar taxonomy); window/index arithmetic (winLo/wIdx/W/clamp — re-derive natively); NOVHARM bar-chord passes; markHand; accompany() lh-rebuild-from-finished-tune as code (keep its register-placement + post-passes); anti-static-pedal rebar; tries constants.

---
## VALIDATED — interrogation of every entry against the six questions (I1..I5 in scratchpad/port-catalog/interrogate/)

Counts: ~90 entries interrogated. KEEP ~90 / DEEPEN ~38 / DEMOTE ~13 / REJECT 2 (beatDissonance stays retired; tries constants). Nothing was outright non-composer, but "PORT" ≠ composer-grade: many carry gaps, disguised walls, or magic constants.

### THE UNIFYING GAP (found in every category — build this, don't port it)
The old machine COMPUTES the ingredients of musical drama — a harmonic-tension curve, phrase structure, a climax region, cadence goals — but **those computations never GOVERN the local choices.** Each layer decides locally/independently and the global dramatic shape doesn't propagate:
- Harmony (I1): `moveChord` is context-free Markov — no phrase-position, no aim toward the coming cadence.
- Melody (I3): the climax is *detected* (argmax of the tension curve / a bald 0.62 stamp / collapses to bar 0 on falling lines) — never *placed*.
- Voice-leading (I2): inversions are *accidental* (root-unless-forced) — never chosen for line or drama; no cadential-6/4 device; the summed-weight scorer is flat/uncalibrated (one decisive fact outvoted by tiny dispreferences).
- Texture/dynamics (I4): the intensity curve **never reaches** the left-hand or dynamic decision — no intention ever means "build to this cadence / thin so the tune breathes / drive the climax"; dynamics can only crescendo INTO tension, never the expressive hush AT the peak.
- Checks (I5): no audit for a melodic climax, harmonic-rhythm monotony, or (until just now) cadence resolution.
So a verbatim port yields locally-correct but globally-uncoordinated music. **The missing thing is the composer's top-down dramatic plan — a phrase-level tension/shape intent that DRIVES harmony, melodic climax, inversions, texture and dynamics coherently.** That is the spine the whole port hangs under.

### DEEPEN (port, but the reasoning has a real gap to fill)
- **Grammar → 2-D + cadence-aim**: key the successor weights on (chord, phrase-position) and add an aim-toward-the-coming-cadence term; anti-repetition must not silently outweigh root-motion (calibrate, don't use magic ratios).
- **Climax → PLACED**: deliberately place a once-only registral peak (varied position), reserved; make every apex-keyed device hang off it; a falling/lament line still gets a summit.
- **Inversions → DELIBERATE**: first-inversion to smooth the bass (I6/IV6/V6), cadential 6/4 as a positive device at the pillar, bass as a contrapuntal line with its own contour — my Viterbi bass-line path is the right shape; port chooseNote's leans INTO it, don't replace it.
- **Scorer → TIERED**: a few dominant structural terms decide, a bounded refinement band breaks ties; genuinely-wanted "faults" (cadential 6/4, climactic octave) get positive intentions, not a relaxed penalty.
- **Texture/dynamics → TENSION-DRIVEN**: route the energy curve into the texture/LH intention and into a hush-at-the-peak dynamic, not just crescendo-into-tension.
- Tendency tones: leading-tone-up + non-cadential 7ths-down + inner suspensions (only the final-I 7th-down is built). `answer` needs real tonal-answer logic; tenths by melodic suitability not just hand-reach; slurs at sub-phrase scale.

### DEMOTE (diversity/engineering plumbing wearing a composer label — keep as backstop or cut)
least-used dynamic-scheme + opening-dyn selection; `echo`/`motif` intentions that don't relate to the tune as named; doubled-thirds "articulation gate" that isn't actually in the code (it's a diversity coin); monotony hand-tuned constants (maxFrac 0.42/0.55, maxRun 3/5, rejectPlainArpeggio 0.30) → make leans, not walls; 4n one-directional parallel suppression.

### MISSING CHECKS to build (composer-audible faults with no check)
melodic-climax presence/shape; harmonic-rhythm monotony; cadence resolution (ADDED); phrase that never leaves the tonic. Keep beatDissonance's retirement rationale as a permanent header (do not re-add context-free interval walls).

### COMPOSER PROCESS ORDER (validated — the new machine's stages, top-down)
1. **Character + dramatic plan** — feel, then the phrase-level tension/shape: where it builds, its ONE climax, its cadences. *(the missing spine)*
2. **Harmony** — functional journey aimed at each cadence, phrase-position-aware, tension shaped by the plan; harmonic rhythm from the plan.
3. **Melody** — ornament the harmony; motif stated then developed; **climax placed** at the plan's peak; minor spelling by direction; breathe at phrase ends.
4. **Voice-leading** — bass + inner voices as lines; **inversions chosen** for line/drama; tendency tones resolved; parallels/6-4 avoided at source.
5. **Texture** — one intention per phrase, **driven by the plan** (build/thin/drive), thinning to sustain where unsupported.
6. **Dynamics + articulation** — the plan's tension as hairpins/shape (incl. hush at the peak); articulation from character + surface.
7. **Notation + audit** — clean split, clamps; the full check battery incl. the new climax/harmonic-rhythm/cadence audits.

## PORTING ORDER (highest leverage first, each verified against compose-audit.mjs)
1. **Voice-leader (`chooseNote`)** → bass/inner voices. Kills 6/4 + parallels by construction; adds inner counter-line (bass-static). Replaces my penalty thrash.
2. **GRAMMAR + moveChord** → harmonicPlan. Richer vocabulary off I-IV-V; feeds thinHarmony.
3. **Melodic ornament idioms** (figureFill, germ development, three-minors, suspension family, anti-repetition) → composeMelody.
4. **Cadence/period + phrase-function labels** → the backbone (fixes cadence/apex reasoning I keep re-breaking).
5. **Checks** (harmony-checks + monotony/thin + novelty) → replace my rougher audit rows.
6. **Texture-as-intention + phrase planning** (answer/tenth/post-passes).
7. **Dynamics energy-curve + entailment shapes; articulation.**
8. **Grade-canvas wiring (midBarChord/NCT/richness) + notation backstops.**
