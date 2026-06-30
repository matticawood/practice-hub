# Practice Roadmap — per-stage objectives (DRAFT v2, internally framed)

Rewritten from research across all 118 Monday Music Tips, the in-app Theory course,
the Weekly Focus series, the store course, books and roadmap text, so the objectives
reflect **your** teaching philosophy and **your** content, not an exam syllabus.

Principles this draft follows (all evidenced in your writing):
- **Internal framing, never grades.** Objectives describe a thing the member can now DO
 ("You can…"), not an exam to pass. No ABRSM/grade/exam language anywhere.
- **Consistency is the headline beginner objective** — habit before difficulty.
- **Scales: depth over breadth, and PRACTISED hands together, two octaves.** The key *order*
 follows your Theory course (C→G→D→F→A,B♭,E♭→minors), but how they're practiced is your
 playing recommendation, NOT the theory-lesson framing: even at beginner level, **hands
 together, two octaves** for the simple scales (the Theory course only shows them one-octave
 hands-separate to explain the concept). **Simple arpeggios come in from the second stage.**
 Depth over breadth (a few keys mastered innately, ~2 new/week), note names aloud, made
 musical once fluent. No five-finger-pattern framing.
- **Method is embedded** in each objective (isolate, slow, stop-and-fix), not just the target.
- **Ear and improvisation are core from the start**, not advanced extras.
- **Theory maps to YOUR levels:** L1 = absolute beginners, L2 = beginners (future levels → later stages).

**Read each stage as "by the END of this level, you can…"** — the checklist is the exit
criteria for the level you're currently in, built up over that level's practice hours
(not cumulative from zero). It shows while you're in the level; ticking it all means you're
consolidating that level and ready for the next.

Stage → practice-hours band (cumulative hours to *enter* each, so e.g. First Steps runs 0–50h):
First Steps 0–50 · Beginner 50–150 · Foundations 150–350 · Intermediate 350–700 ·
Confident 700–1200 · Advanced 1200–2000 · Performer 2000–3500 · Artist 3500+.

**Progress is NOT linear across the bands.** The first 50h (First Steps) are disproportionately
slow — basic coordination, finding the keys, building the habit — so it stays light. **Beginner
(50–150h) is the most productive stretch and carries the biggest single leap.** From there each
band advances a little less per hour as pieces lengthen and gains cost more (the diminishing-returns
curve the grade research confirms). Objective loading per band reflects this S-curve, not even spacing.

Each objective auto-ticks from data unless marked **(self-check)**. Sources/calibration at the bottom.

**Roll-over:** a member who skipped levels (e.g. by adding prior hours and jumping ahead)
sees any un-completed objective from earlier levels carried into their current card under
"Still to catch up from earlier" — UNLESS it is superseded by a same-group objective at their
level (scales, note, chord, ear, days, theory, piece each absorb into the current, higher target).
A goal unique to a skipped level rolls forward until it's done.

Owner: edit anything. This drives the live "Your Path" card on dev (placeholder content).

Legend: habit · scales (self-check) · Note Recognition · Chord Recognition ·
 Ear Training · play-by-ear/improv (self-check) · piece · theory.

---

## 1. First Steps *(absolute beginner)*
- Build the habit: clock up your **first 30 days of practice** (they never get taken away, even if you miss a day). Consistency matters far more than difficulty right now.
- **(self-check)** Play **C and G major, hands together, two octaves** (a couple of scales to start), saying the note names aloud and using the thumb tuck.
- Reach **12+** in Note Recognition, so you can find notes without hunting.
- Begin **Theory Level 1** (reading the stave).
- Learn your **first Absolute Beginner piece** all the way through, fixing the tricky spots one bar at a time.

## 2. Beginner *(your most productive stretch — the biggest single leap)*
- Reach **100 days of practice**. You are becoming someone who practices.
- **(self-check)** Get the **four core major keys C, G, D and F fully under the hands** — scales hands together two octaves, plus their **tonic triads and simple arpeggios**.
- Reach **30+** in Note Recognition.
- Reach **10+** in Chord Recognition.
- Reach **15+** in Ear Training.
- Complete **Theory Level 1** and **begin Level 2**.
- Learn **4 Beginner pieces**.
- Spend **3 hours improvising**, starting with simple triads and a melody (logged in your practice log).

## 3. Foundations
- Reach **250 days of practice** — consistency is now part of who you are.
- **(self-check)** Extend to **A, B♭ and E♭ major** (scales, triads, arpeggios), and begin the **natural minors in A, E and D**. Once a scale is easy, play it *musically* with dynamics.
- Reach **40+** in Note Recognition.
- Reach **16+** in Chord Recognition.
- Reach **24+** in Ear Training.
- Complete **Theory Level 2**.
- Learn **1–2 Lower Intermediate pieces**.
- **(self-check)** Sight-read a new easy piece each week: read it **once**, keep going over small mistakes.

## 4. Intermediate
- **(self-check)** All majors plus the **natural and harmonic minors** secure (hands together, two octaves), with their arpeggios. *(Your minor-key Theory lessons exist but aren't published yet — see gaps.)*
- Reach **46+** in Note Recognition (near the ceiling — then maintain).
- Reach **22+** in Chord Recognition.
- Reach **30+** in Ear Training.
- Learn **2–3 Lower Intermediate pieces**, shaping phrasing and voicing with intention.
- Spend **5 hours improvising** over simple chord progressions (logged in your practice log).
- Deepen your understanding (theory sheets + the *Art of Understanding Music* course). *(No Theory Level 3 built yet — this is guidance, not a tick.)*

## 5. Confident *(beyond your built theory content — estimate)*
- **(self-check)** Scales and arpeggios (major and minor) secure across **more keys**, faster and kept relaxed and musical; extend toward more octaves where useful.
- Hold your recognition scores near their ceilings (Note ~48, Ear ~30, Chord ~24).
- Learn **1 Upper Intermediate piece**, holding a longer work together start to finish.

## 6. Advanced
- **(self-check)** Scales and arpeggios fluent across all keys, faster, always musical.
- Learn **1 Advanced piece**, interpreting with a clear sense of style.

## 7. Performer
- Prepare and **perform a balanced Advanced programme** end to end; begin reaching into Expert repertoire.
- *(Skill games are maxed by here; progress is repertoire- and performance-driven.)*

## 8. Artist
- Learn an **Expert-rated work** and make it your own.
- *(Self-directed. "A guide, not a finish line. Everyone's journey is different.")*

---

## Measurement (how each ticks)

| Objective | Source | Tick rule |
|---|---|---|
| Days practiced | distinct `practice_sessions.session_date` count | total days of practice ≥ target (never resets — a missed day costs nothing) |
| Scales | **self-check** → new `allowed_emails.scales_done` jsonb | member ticks each scale group; nudge if recent `practice_items.label` mentions a stage scale |
| Note Recognition | best `note_game_scores.score` | best ≥ target |
| Chord Recognition | best `chord_game_scores.score` | best ≥ target |
| Ear Training | best `ear_game_scores.score` | best ≥ target *(add ear to the trainer loader)* |
| Improv (hours) | sum of `practice_items.duration_minutes` where `item_type='improvisation'` | logged improv hours ≥ target (prescribed: what to improvise on) |
| Piece | `user_collections.status='completed'` × `pieces.difficulty` tier | completed pieces at/above the stage tier ≥ required count |
| Theory | `lesson_progress.completed` ∩ `lessons.course='theory'` | all lessons in the target level completed |

### Hour-band calibration — DECIDED (2026-06-30)
Researched two ways. **The app's own practice-logging data was discarded** for pacing:
migrated members carry years of prior practice the app never logged, so "Nth scale at
N logged hours" is meaningless. **External pedagogy benchmarks** were used instead and
**validated the existing bands** — they map cleanly onto real ABRSM hours (150h≈Grade 1,
350h≈Grade 3, 700h≈Grade 5-6, 1200h≈Grade 7, ~1500h=Grade 8). **Keep the bands as they are.**
(Only mild external note: all 12 major scales mastered ~200-300h, so the 7-major target by
end of Foundations/350h is, if anything, slightly generous — fine.)

### Game objectives are now PRESCRIPTIVE (difficulty-aware)
The score tables record the play settings, so each objective prescribes the difficulty and
only ticks when a score at that setting (or harder) is achieved — "10 in triads in a key" is
not the same as "22 in sevenths, any key". Difficulty axes: Note `clef` (treble/bass → mixed)
+ `accidentals`; Chord `tier` (1→6, inversions/sevenths) + `mode` (in a key → free/any key);
Ear `chord_set` (major_minor → triads → sevenths → extensions). The live card labels carry the
prescribed mode for each level; tune the wording/targets here.

**Key-specific recognition (to "live with" the keys being learned):** the tables also store
`key_signature`, so a recognition objective can require a target score in EACH key the member
is studying that level. Live now for Note Recognition: First Steps = C and G, Beginner = C/G/D/F,
Foundations = A/B♭/E♭ — it only ticks once a score at target exists in every prescribed key, and
shows "n/4 keys" progress meanwhile. The same key-set pattern can extend to Chord and Ear.

### Game-score targets (best-score-per-member distribution — absolute skill, hours-independent)
Front-loaded into the productive Beginner→Foundations bands, then maintained (non-linear pacing):
Note (**max 50**): First Steps 12 → Beginner 30 → Foundations 40 → Intermediate 46 → maintain ~48.
Chord (**max 27**): Beginner 10 → Foundations 16 → Intermediate 22 → maintain ~24.
Ear (**max 34**): Beginner 15 → Foundations 24 → Intermediate 30 → maintain.

### Content gaps flagged by the research (decisions / future work)
1. **Theory built only to Level 2.** Concrete theory objectives stop at Foundations; Intermediate+ is guidance until you author Level 3+. The minor-key lessons (L2 #6–9) are written but still **draft/unpublished** — the Intermediate scale objective leans on them, so publishing those would make it real.
2. **Scale practice = hands together, two octaves, with arpeggios from stage 2** (your correction). The Theory course only *introduces* scales one-octave hands-separate to teach the concept; the objectives now follow how you actually recommend practising them. (If you ever want the objective to spell out "hands together, two octaves" explicitly in the member-facing text vs. keep it implied, say which.)
3. **Ear Training & Improvisation courses are empty shells**, and the **books are draft** — so I can't yet link objectives to them; the ear/improv objectives are self-check for now.
4. **Games plateau** (fixed 1-minute format) — they support stages 1–4, then "maintain". Agreed?
5. **Stages 5–8 are content-light by design** (your library tiers + self-direction carry them). Keep them short as above, or flesh out later?
