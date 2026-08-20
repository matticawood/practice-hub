# Composer-Model Build Plan

The output of a full line-by-line audit of the machine (`compose.mjs`, `compose-adapter.mjs`,
`grade-params.mjs`, `fingering.mjs`, `engine.mjs`) against the three criteria and five rules.

Every job below is a place the code reaches a composer's *result* by a **proxy, a dice, or a
repair-after-the-fact** instead of the composer's *thought*. The task for each is to replace the
mechanism with how a composer actually thinks, **at the point in the process where they think it**.

## The governing gate (applies to every job)

1. **A number is a thermometer, never the patient.** An off number is a signal to find where the
   generator stopped thinking like a composer — never a thing to shrink (not by a generator patch,
   not by loosening the audit).
2. **LOOK first.** Render and read the music as a composer before touching code; verify a fix by the
   music being more interesting / idiomatic / varied, not by a count moving.
3. **The fix is always a preference at the source**, never a filter / reject-reroll / tuned constant.
4. North star: **write for interest, stay idiomatic, make every piece its own.**

The only number that is a hard guarantee is **0 invalid** (notatability + grade legality — a
construction fact, checked by `engine.validate`). Everything else is read by eye.

---

## PHASE 1 — The harmonic journey (the foundation; everything sits on this)

**JOB A — Harmony planned as a phrase journey, not a Markov walk.**
- Fault: `NEXT_FN` (compose.mjs 89) walks chord-to-chord; interest is faked by two one-and-done
  "visit each region once" nudges (`usedFn` ~161, `chordForFunction` `visited ×1.7` ~109). Long
  pieces seesaw I-V once the boxes are ticked.
- Composer-thought: each phrase is a shape — tonic → **depart** (subdominant, or a colour: vi/III,
  a tonicisation) → **dominant** → cadence. The consequent departs differently/further than the
  antecedent and closes.
- Code + where: at plan-time, a `planPhrase(phrase,{mode,grade,siblingDeparture,bankColours})` that
  realises a trajectory; `harmonicPlan` orchestrates the phrases and feeds the antecedent's departure
  into the consequent so they contrast. Departure-and-return becomes intrinsic; the seesaw impossible.

**JOB B — Harmonic rhythm as a chosen rate filled by the progression, not per-beat dice.**
- Fault: whether the harmony turns over on each interior beat is a gamble
  (`moveBias × strengthJ × intensityAt × stasis`, compose.mjs 223-238); can bounce I-V inside a bar.
- Composer-thought: choose *how often* the harmony moves (a character/metre-appropriate rate); every
  change is the next step of the journey, or a prolongation by inversion/figuration.
- Code + where: pick a harmonic-rhythm rate per piece; lay Job A's progression onto the bars at that
  rate (two chords in a bar = two *adjacent* steps, never a return to the dominant). Sub-bar motion
  over one held chord is left to the accompaniment. Deletes the per-beat move-loop and the stasis clock.

> A and B are one piece of work — the journey defines the chords, the rate distributes them. Build together.

---

## PHASE 2 — The deliberate colours become reasoned placements (they sit on the journey) — DONE

> Verified by rendering + reading (grand/minuet/flowing/singing across major & minor), 0 invalid, accidental check
> clean. C1: 6/4 now 100% for formal chars (grand/march/minuet/waltz) at the final cadence, 0% otherwise. C2:
> secondary dominant 18-33% for smooth/lilt chars, ~0 for crisp, placed at V/V into the dominant. C3: emergence dice
> deleted. C4: minor LT decided by the from-below approach. Also fixed a real interaction: Job-B quicken must not fire
> before a cadential 6/4 (a bare V was wedging between the V/V and the I64).


**JOB C1 — Cadential 6/4 from cadence importance × character formality** (kill `pick({yes:45,no:55})`, compose.mjs 209).
A composer weights an *important* cadence for a *formal* character (a grand/march/minuet final PAC), not a coin toss.

**JOB C2 — Secondary dominant placed where it strengthens the journey** (kill `pick({take:18,skip:82})`, compose.mjs 191).
Find the site that most helps — classically V/V into the structural dominant — and place the piece's one colour there. Variety across the set stays in the set-level distinctness lean.

**JOB C3 — Emergence: delete the 12% dice** (`pick({emerge:12,keep:88})`, compose.mjs 512).
It is a worse duplicate of the reasoned `reharmoniseStaticSpans`. Let the reasoned "harmony travels under a held/recurring note" own all recolouring.

**JOB C4 — Minor cadence leading tone from "is this an authentic cadence"** (kill `rnd()<0.55/0.85`, compose.mjs 577).
An authentic minor cadence resolves ^7→^1 through the line as a matter of course; decide from the cadence, not probability.

---

## PHASE 3 — The melody's remaining proxies

**JOB D — The rhythmic germ conceived as a gesture, not a per-beat sample. — RULED A NON-DEFECT (looked).**
- Fault (as filed): the germ is drawn by `barRhythm` (compose.mjs 282), a per-beat weighted pick.
- LOOKED (germlook, one piece per character, g3/g4): the germs read as real, character-fit motifs — the
  cantabile's plain crotchets carried by a stepwise pitch shape (a broad theme, pitch IS the idea), the Adagio's
  crotchet+quavers with its inversion, the march's dotted tattoo, the waltz's broad minim+crotchet lilt. The
  pace/dot character leans + the state/repeat/develop/cadence phrase-function development already give the germ
  shape and identity.
- DECISION: do NOT rewrite. A fixed archetype-list pick would LITERALIZE "a composer conceives a gesture" into
  "pick from a canned list" (the top failure) and NARROW the continuous rhythmic space. The blandest draws
  (a quick character drawing a broad germ) are valid diversity — a redraw-fix for exactly this was reverted
  earlier. The ≥2-events floor stays (a single whole-bar drone is not a motif = the allowed degenerate gate).

**JOB I — The climax placed at a structural point; consolidate the contour.**
- I-b DONE: deleted the dead fixed `arch` (0.62-peak) and pointed its one caller (the leading-weak-note
  fallback, compose.mjs 533) at `contourAt`, so no line summits on a different curve from its neighbours.
- I-a MEASURED then REVERTED: the apex clusters (87% at frac 0.6) because `climaxBar` washes to ~bar 5. I
  rewrote it character-timed (crisp peaks late, smooth early) — but an 8-bar form's build window is only ~3
  bars, so the character shift is lost in bar-rounding: the renders were identical and g4 spread even
  tightened. It did NOT make the music better, so it was reverted (not kept for "better intent").
- RULING on the apex-spread flag (sd~0.07, "formulaic if <0.15"): substantially a BAD RULER. A climax
  belongs in the second-half build to the cadence; the metric wants it scattered across the whole piece
  (bar 1..8), which is musically wrong. Each piece's arch reads as a fine phrase (looked, many times); the
  homogeneity is a subtle cross-set property, and every other dimension (key, character, rhythm, harmony,
  register) does vary. A speculative contour-shape rework of the working melodic core is not justified by
  the value. Audit left intact (not loosened) — the report simply isn't a defect to chase. [cf. Job D, the germ.]

---

## PHASE 4 — The accompaniment: move the repairs to the moment of decision

**JOB C5 — Bass surface rhythm as a conceived figuration. — DONE (rendered + measured, 0 invalid).**
Replaced the per-beat `rnd() < density×intensity` (compose.mjs ~809) with a deterministic drama-shaped
decision: a beat breaks into a connecting eighth where drive×tension says the music is ACTIVE. Since the
tension curve is smooth, the walking beats form one contiguous stretch — the bass thickens INTO the climax
and eases after (verified: a flowing piece holds quarters, breaks to eighths through the climax, relaxes),
instead of scattering eighths at random beats. Calm characters keep their plain tread; driving ones walk throughout.

**JOB C5b — `bassline` differentiated from `broken` (walking vs arpeggio). — DONE (rendered + measured, 0 invalid).**
`composeBass` had been giving BOTH textures the same ascending broken-chord figure — but a "bassline" is a
different musical idea: a WALKING bass, a conjunct horizontal LINE (a minuet/scherzo tread), not a vertical
arpeggiation. Now `texture==='bassline'` builds a scalar RUN per bar over a diatonic scale-degree ladder: the
chord's true bass on the downbeat, then diatonic passing tones walking TOWARD the next bar's root (the next root
doesn't sound till the next downbeat, so the line moves all bar and the downbeat leaps onto it), turning only at
the range edge; a repeated root walks down and steps back up. Continuous motion, never a drone. Fixed two things
found by measuring cross-relations by texture: (1) the downbeat must be the TRUE chord tone `cur`, never snapped
onto the natural-minor ladder — snapping flattened a minor V's raised leading tone (C# → C) on every dominant
downbeat, cross-relating with the tune's C# above (corpus cross-rel 30 → **0**, false parallel-8ves 159 → 117);
(2) the walking line inflects ^6/^7 like the tune (melodic minor) — a natural passing ^6/^7 that would clash with
the tune's raised form is RAISED to match (or sidesteps where the chord pins the natural). Verified by rendering
minuet/scherzo/lively in minor: steady stepwise quarter-note walks, leading tones correctly sharpened in the bass
at the dominants, visibly distinct from the broken arpeggio. bassline cross-rel 44 → 1/418, drone 0, 0 invalid.

**JOB C5c — Alberti murmur no longer collapses to a drone. — DONE (rendered + measured, 0 invalid).**
The Alberti realization (realizeLH ~1338) searched UPWARD from the voice-led skeleton note `a.m` for three chord
tones; when `a.m` sat high in the range there was no room above, so it fell back to a single repeated note — the
murmur died to a drone. Measured: **22% of Alberti bars** collapsed to one pitch, in **82% of Alberti pieces**.
A composer anchors Alberti on the LOWEST chord tone (the bass foundation) and builds the murmur upward. Rewrote it
to anchor on `chordLo` (lowest chord tone in range), do the classic low–high–mid–high (the low note alternates
root/third under a steady top = the C-G-E-G shape across a beat pair), and fall back to a two-tone low–high murmur
when a narrow chord offers only two tones — a bare single note only when the range genuinely holds one chord tone
(now ~0). Collapse 22% → **0%**. Rendered g2–g4, maj+min: a steady broken-chord murmur every bar, register even,
no drones; 0 invalid, cross-rel 0, no new strong-beat dissonance.

**JOB C5d — Walking bass no longer wobbles in a cramped range. — DONE (rendered + measured, 0 invalid).**
Eye-audit caught it (the drone detector missed it — a wobble has 2 distinct pitches, not 1): the roots sit LOW in
the bass register, so the walk headed down, hit the range floor after one step and turned straight back — a
two-note lower-neighbour wobble (E-D-E) repeated identically across bars, not a walk. Measured: **44% of wide
(>=3-beat) walking bars** had <=2 distinct pitches. A composer boxed at the bottom walks UP (toward headroom), not
a semitone wobble. Fix: choose the walk direction by available headroom — if the preferred direction has fewer
than (nbeats-1) ladder steps of room and the other side has room, walk the roomy way. Mid-phrase wobble 44% →
**5.7%** (the residual is genuinely cramped ranges rocking gently); the remaining "cadence-bar wobbles" (23%) are
legitimate — a walking bass DOES stop walking at the cadence to land on the tonic. Rendered minuet/scherzo/lively:
the lines walk and vary; 0 invalid, cross-rel 0.

**JOB C5e — Block/sustained no longer thin to a bare single note. — DONE (measured + rendered, 0 invalid).**
Eye-audit caught a g3 block bar voiced as `G3 G3 G3 G3` (bare single notes where a chord should state the harmony).
Same root cause as the Alberti collapse: `voice()` only built the chord UPWARD from the skeleton note `a.m`; when
`a.m` sat high near `hi`, no chord tone fit above, so it returned a bare `a.m`. Measured: **11.6% of g3/g4 block
bars** were all-single-note (63% of pieces). A composer with a high bass simply adds a chord tone BELOW it. Fixed
`voice()` to search downward when nothing fits above (helps block AND sustained, which share it). Block 11.6% →
**0.2%**, sustained 2.6% (a held single tone is acceptable there). 0 invalid, voice-crossing 0, cross-rel 0.

**JOB C5f — The 6/4-by-leap that C5e introduced, fixed; audit tally made honest. — DONE (0 invalid).**
Auditing a fresh spread (answering "is this as a composer would write?") surfaced two big auditPiece flags: 14.7%
"6/4 not idiomatic" and 13.2% "uniform harmonic rhythm". Both investigated by LOOKING, both resolved:
- **6/4-by-leap (real, my own bug):** the C5e below-voicing scanned down from a high root and hit the FIFTH first
  (root G3 → nearest below D3 = the fifth), minting a stated 6/4 in sustained/block (39%/31%!). Fixed `voice()` to
  SKIP the fifth in the below-add (prefer root/third; a single root note over a stated 6/4). Also made the bassline
  downbeat + rootfifth-independent `chordLowest` prefer a non-fifth foundation. broken KEEPS the absolute-lowest
  anchor (its fifth is a line the arpeggio rises off; forcing a higher anchor re-droned it — verified: drone 0.6% vs
  5.3%). rootfifth reverted (a fifth oom is a dance-bass line into the next root; forcing the root doubled pah-rests).
  6/4: sustained 39%→0.2%, block 31%→0.4%, broken 3%, others ~0.
- **uniform harmonic rhythm (a NON-defect check — REMOVED, not gated):** first gated it to active tempos, but on
  challenge I verified the residual too: the active-tempo cases were ALL grade-2 (I-V-I is one chord per bar by the
  grade constraint) and g3/g4 driving pieces with a varied FIVE-chord progression at a steady tread — all read as
  composer-correct. Uniform one-chord-per-bar RATE is not a defect at any grade (calm lyrical music, steady dances,
  simple g2, fast Allegros all use it); the interest is the LINE and the progression, not accelerating the chord rate.
  The real harmonic defect is STALENESS (few DISTINCT chords), already the separate "HARM thin" check. So the uniform-
  rate check was DELETED — it only ever fired on well-formed music. This is measuring the real defect, NOT loosening
  the net to move a count (verified across every grade/character before removing).
Net auditPiece CLEAN 67.8% → **91.4%** over 6000, 0 invalid; residual flags now reflect real (or grade-idiomatic)
cases: BASS "drone" 3.8% (almost all g2-march repeated-root — the grade's pulse idiom, verified by eye), broken
moving-line 6/4 1.6% (a line, not a stated inversion), and small genuine melodic/harmonic-thinness tails (<1% each).

**JOB M-melody — Busy melodies no longer TREAD WATER (in-place wobble). — DONE (rendered + measured, 0 invalid).**
Eye-audit of the RIGHT HAND caught it: fast eighth-note characters (scherzo/lively) produced a melody that wobbled
in a narrow band — E-G-E-G-E, F-G-A-G-F-G-A-G, whole bars identical — no leaps, no arc, no motif (assembled, not
composed). ~8-9% of scherzo/lively. Root cause found by instrumenting the SKELETON: the germ (motif, from bar-0's
first intervals) is often a turn [±3]/[±2]/[±4], and the motivic-unity reward propagated it VERBATIM IN PLACE, so
`gwant` pushed prev+3, prev-3, prev+3 = an oscillation. A composer STATES a turn then DEVELOPS it (sequences it to
fresh pitches); it does not tread water. Fix (composeMelody score, PASS A): track `prev2` and lean AGAINST returning
to the pitch two ago (the A-B-A retread) by -2.2 — a lean, exempted at the come-home descent, so a genuine motivic
return / cadence still surfaces. The line then prefers a FRESH pitch: a turn E-G-E becomes an arpeggio E-G-B that
goes somewhere. Skeleton now ARCS to a peak and comes home (verified by dumping strong notes). Meander: lively
8%→3%, march 3%→0%, dance 4%→2%; scherzo's residual (8%) is now genuine directed fast passagework (scale runs +
turns + leaps, rendered and confirmed idiomatic), not wobble. auditPiece "MEL no leaps" 1.1%→0.5%, "MEL narrow"
0.6%→0.4%. Verified the penalty does NOT harm lyrical/singing/gentle characters (rendered — they keep their
cantabile turns). 0 invalid, cross-rel 0, parallels + strong-beat consonance unchanged. CLEAN 91.4%→91.7%.

**JOB H-journey — The harmonic journey no longer SEESAWS in the predominant. — DONE (rendered + measured, 0 invalid).**
The harmonic analogue of the melodic wobble, found by sampling progressions: the free-bar journey walk oscillated
between two predominants — `I iii IV ii IV ii V I`, `I ii vi ii vi ii V I` (2.9% of g3/g4). Cause: the "fresh chord"
bonus is exhausted once both PD chords are visited, and `journeyStep` only forbade the IMMEDIATELY previous chord,
so it bounced A-B-A-B. A composer's journey MOVES FORWARD (builds toward the dominant); it doesn't return to the
chord two ago. Fix (harmonicPlan `journeyStep`): pass the chord two-ago and lean against it (×0.15) — a strong lean,
so it still surfaces where the diatonic PD palette is genuinely exhausted (residual 0.3%, the real constraint).
Seesaw 2.9%→0.3%, avg distinct chords 4.85, 0 invalid, CLEAN ~91.6%, no regression; rendered — journeys move with
variety (vi-ii-IV-iii-ii), read as real journeys. [Note: also LOOKED at the ~10% adjacent-repeat rate in busy
melodies and judged it a NON-defect — barline restatements + on-beat repeats in dotted figures read fine, even the
20% worst case; did not chase it (classify don't assume; a number is a signal, not a target).]

**JOB P-phrase — Phrase lengths VARY (periods no longer all breathe dead-centre). — DONE (rendered + measured, 0 invalid).**
The mid cadence was fixed at `ceil(nbars/2)-1` — so ~70% of pieces (period + binary forms) breathed their structural
HC at the IDENTICAL bar (bar 4 of 8) every time. A composer writes mostly 4+4 but also asymmetric periods (3+5 / 5+3).
Fix (compose-adapter `formFor`): the mid-cadence bar is a weighted lean around the centre — {center 6, ±1 bar 1.5 each},
clamped so each limb keeps >=3 / >=2 bars. Result: 8-bar periods now 67% symmetric (4+4), 17% each 3+5 / 5+3. Rendered
confirmed 3+5 (a compact antecedent answered at length) and 5+3 (a long build to the dominant, short resolution): both
read as coherent, well-formed periods. 0 invalid, cross-rel 0, parallels + voice-crossing unchanged, CLEAN 91.8%. Also
exposed `ex._cadences` (form structure) for future audits. [P — a lean toward the symmetric norm, real variety, correct
by construction via the existing HC/PAC planner.]

**JOB M-cadence — A SUNG cadence steps to its close (not a 4th/5th leap to the tonic). — DONE (rendered + measured, 0 invalid).**
Measured the final melodic interval: 23.7% of pieces LEAPT a 4th/5th to the tonic, ~16-21% for the sung characters
(lyricalslow/singing). Rendered: for ENERGETIC characters a leap to a bright tonic reads well (kept), but a cantabile
leaping ^4/^5 down to ^1 is un-idiomatic (real lyrical repertoire steps: ^2-^1 / ^7-^1, or falls a third ^3-^1). Root
cause: the melodic penult over the FINAL TONIC CHORD is a chord tone (^1/^3/^5), and ^5 forces a leap. Fix (composeMelody
FINAL RESOLUTION): for conjunct/legato characters only, where the penult leaps to the tonic, pull it to a chord tone of
ITS OWN harmony a step/third from the tonic (^7 or ^2 over V → a stepwise ^7-^1 / ^2-^1; ^3 over I → a graceful third).
Consonant by construction (still a chord tone), a preference, energetic leaps untouched. lyricalslow 16%→6%, singing
21%→4%, waltz 36%→4%; energetic characters unchanged (lively 26%, scherzo 26%). Rendered lyrical cadences — now ^2-^1 /
^3-^1 / ^7-^1, graceful, no awkward leap into the penult. 0 invalid, no new strong-beat dissonance, cross-rel 0.
[Earlier this turn I also measured the ~10% adjacent-repeat rate and the leap-cadence for ENERGETIC characters and judged
both NON-defects (idiomatic), not chased — the fix targets only the genuinely un-idiomatic sung case.]

**JOB HR — Harmonic rhythm VARIES (not one chord per bar) + grade-2 consequences. — DONE (rendered + measured, 0 invalid). [Matthew]**
Matthew: "It makes no sense to have one chord per bar." The planner laid exactly one structural chord per bar. Rework
(harmonicPlan segs): each bar may PROLONG the chord flowing in from the previous bar (longer than a bar) or SPLIT toward
the next (shorter than a bar), leaned by the drama (held at rest, quicker into the build); pinned cadence bars stay whole.
g3/g4 now genuinely vary (~2.6 bars/piece with two chords, ~1.9 chords spanning >1 bar), render musically, 0% parallels.
Knock-ons: (1) formFor — a short piece is a single PHRASE not a 2+2 period (which pinned every bar → thin I-V-V-I); g2
now I-IV-V-I (≤2-chord pieces 66%→0%). (2) Grade-2 parallels — the richer g2 harmony + fixed five-finger box exposed
outer parallel 5ths/8ves the box can't re-voice out of (14%): sub-bar splits gated to g3+; resolveOuterParallels given a
real escape (hold a common tone incl. the fifth, or take the fifth as a heavy last resort, heavier on a downbeat — a
momentary inversion beats a parallel perfect). Outer parallels → 0/0 all grades; cost ~+1-3% "6/4 not idiomatic" (brief
escape inversions, verified by eye). (3) incoherent-hairpin audit fixed to understand `\!` closes a hairpin. Net: 0
invalid, cross-rel 0, voice-crossing 0, strong-beat dissonance 4/40000, clean ~91%.

**JOB DYN-rest — A hairpin may not cross a both-hands rest. — DONE (0 invalid). [Matthew]**
A crescendo ran through a both-hands rest. dress post-pass: end the hairpin (`\!`) on the last sounding note before the
silence, resume the level + hairpin on the first note after. LH-timeline test, so a RH breath over a sounding LH is left
alone. Crossings 0/6000, rendered, 0 invalid.

**JOB BOOK-adjacency — Distinctness GRADIENT: near neighbours leaned apart, easing with distance. — DONE (measured, 0 invalid).**
The old machine (gen-batch.mjs `tooSimilar`) had it: the closer two exercises sit in the book, the more distinct they
must be — immediate neighbours differ in key AND metre, nothing within 8 shares key+metre, nothing within 25 shares
key+metre+figure, past 25 only the identical-notes guard. But that was a hard REJECT screen (re-roll until distinct),
which the naturalness framework moved away from. The new machine had only the SET-LEVEL `leanAway` (spread over the
whole bank by count), with no sense of proximity. Brought the gradient across as a LEAN (compose-adapter, the identity
picker): each existing piece's contribution to the "already used" counts is weighted by PROXIMITY — `proxW(i) = 1 +
PROX_K·exp(-(distance-1)/PROX_TAU)` with K=45, TAU=4 — so the immediate neighbour weighs most and it fades to the
set-level base of 1 by ~16 pieces out. Applied to key / metre / character (not mode: only 2 values). Result (avg of 4
sequential 120-books): same-character 2% at the immediate neighbour easing to 8% far; same-metre 22% easing to 37%;
key ~6-9% (12-key cardinality floor). A genuine lean — every option reachable, no starvation, key balance healthy
(hist ~15/4), and the MUSIC is untouched (identity SELECTION only; clean rate 90.8%, 0 invalid over a 3x120 book).
Wired via `server.mjs /api/generate` already passing `avoid: existing` (the whole bank in book order). [P — the book
gradient as a weighted spread, never the old wall.]

**JOB DYN-rest — A hairpin may not cross a both-hands rest. — DONE (rendered + measured, 0 invalid). [Matthew caught it]**
Deep per-grade audit (round 3): Matthew spotted a crescendo hairpin running THROUGH a both-hands rest — you cannot
change loudness through silence. `dress` drew the arc's hairpins (`\<` from the opening to the climax dynamic, `\>`
from the climax to the close) spanning the whole arc, ignoring the phrase breaths, so a hairpin crossed any moment
both hands rest. Fix (compose-adapter `dress`, post-pass): where a cresc/dim would span a both-hands silence, END it
(`\!`) on the last sounding note BEFORE the rest and RESUME the source level + hairpin on the first sounding note
AFTER the rest (if that note already carries the target dynamic, the hairpin just ends before the breath and the
mark lands after it). Exactly Matthew's placement: "the crescendo stops before the rest, the mark sits on the first
note after it." Both-hands-rest test reads the LH timeline (a RH breath over a sounding LH is fine — you can still
crescendo across re-struck LH chords, so those are untouched). Crossings 0/6000, rendered gentle/flowing/singing:
the hairpin ends before the breath and rebuilds after; 0 invalid, every piece keeps its dynamics, terraced
characters unaffected. [Deep audit otherwise CLEAN across 9 pieces: correct minor sharps, cadential 6/4, secondary
dominants, stepwise sung cadences, phrase variety — the only real find was this dynamics defect.]
The per-breath weights (compose.mjs ~929) are now adjusted by the breath's ROLE: a late breath (>0.68) YIELDS
(settle into the close, never chatter an answer into the cadence); a mid-seam breath (0.4–0.62) leans ANSWER
(the conversation); character stays the lean. Real for the playful/lilt characters that converse; calm
characters yield throughout either way (correct). 0 invalid.

**JOB E — The leading-tone accidental settled at the source. — DONE (verified by construction).**
`breatheLH` now takes the melody+tonic+mode and REFUSES to lift a tread-beat that would strand a hollow,
unresolved, un-self-spelled raised ^7 — so the sharp is never left unsupported. Deleted the adapter's
after-the-fact naturalise pass. Swept 1500 minor pieces: 0 bare leading tones over 2313 raised ^7s, 0 invalid.

**JOB H — The cadence voiced to resolve as you cadence. — DONE (verified by construction).**
A 6/4 with nothing after it is not a cadential close (theory-wrong), so the fifth is now excluded at the
close at the SOURCE — three places found by measuring: (1) structuralBassLine `nodeCost` excludes the fifth
at the final node (i=N-1); (2) the bass skeleton anchors its final beat (the cadential arrival) instead of
arpeggiating off it; (3) `elaborateHeldHarmony` states the bass on the final beat instead of arpeggiating a
prolonged tonic onto the fifth. Deleted the adapter final-6/4 repair pass. Swept 4500 pieces across grades:
0 fifth-closes (was ~0.5% overall, ~1.7% at g2), 0 invalid. Closes are root, or a third (first inversion)
where the box frees it.

**JOB F — Voice-leading avoided while voicing, not repaired twice.**
Parallels are handled in three places: the structural bass DP (source, good) **plus**
`resolveOuterParallels` **plus** `fixLHParallels` (two post-hoc repairs). Collapse the two repairs into
the texture's own voicing so it sounds each chord cleanly.

**JOB G — A held harmony written alive from the start.**
Fold `animateInnerVoice` + `elaborateHeldHarmony` (post-hoc animation) into the texture realization, so
a prolonged chord is figured intrinsically.

**JOB E — The leading-tone accidental settled where the harmony is settled.**
The accidental is already decided correctly at the source (composeMelody 584-606); the adapter's
bare-leading-tone scan (compose-adapter 151-164) exists only because `breatheLH` later lifts the very
dominant the tune leaned on. Fix `breatheLH` (compose.mjs 1111) to not lift a dominant a raised ^7 sits
over; delete the adapter pass.

**JOB H — The cadence voiced to resolve as you cadence.**
`resolveFinalToClose` (compose.mjs 1131) already does this but only for some textures; `sustained`/
`block` skip it, which is why the adapter's final-6/4 scan (compose-adapter 165-175) still fires. Apply
the close-resolution in every texture; delete the adapter pass.

---

## PHASE 5 — Cleanup (independent; do anytime)

- **Delete dead `fingerHand`** (fingering.mjs ~317-621, ~300 lines) and its export; it is never called
  (every live path uses `fingerHandDP`), and its header comment falsely claims it is "the primary
  fingerer." Fix the record.
- **Resolve the two legacy rejection thresholds** in grade-params.mjs (`richness` g2, `melody.rejectPlainArpeggio`
  g4). Confirm the composer-model doesn't consume them (their comments cite the old `generator.mjs`);
  if dead, delete; if anything reads `rejectPlainArpeggio`, make it a *lean in the melody scorer*.
- **Dedupe `GRADES` (engine.mjs 58) vs `grade-params.mjs`** bar-counts / fixedPosition — one source of truth.

---

## Left alone — genuine composer-thinking, in the right place

The dramatic tension arc; the diatonic palette; the melody built from chord tones with a real
suspension-and-resolution gate; `score()`'s line reasoning (contour, come-home, step/leap by character,
motif unity); the motif born from bar 0 and developed by phrase function; the minor ^6/^7 accidental
logic; the playability negotiation; the voice-led structural bass; the idiomatic textures (sustained,
block, oom-pah, alberti); `reharmoniseStaticSpans`; dynamics and articulation derived from the phrase
arc; the set-level distinctness lean; and the whole of `fingerHandDP` (a grounded ergonomic reasoner).

---

## Verification (every job, every phase)

Render across characters and grades and **read the music** — is the harmony a journey, is each piece its
own, is the character delivered? A job is done when the music is better by eye, with **0 invalid**. No
job is "done" because a flag count dropped.

## JOB G2-COUNTERLINE — grade-2 LH as a genuine two-part counter-line (parallels killed at the source)
Matthew: "You get implied harmony via moving lines... composing it like a composer would. I don't want arbitrary
gates, and I don't want ways of getting around things." Reworked `bassSkeleton` score() (compose.mjs) so the
per-beat bass is composed as a real second voice against the tune on EVERY beat: contrary motion preferred, oblique
allowed, parallel and direct (hidden) perfect 5th/8ve avoided. The escape from a parallel is the THIRD (first
inversion), never the fifth: the strong-beat fifth penalty (-7) is set above a direct fifth so parallel-avoidance
reaches for the third, never mints an exposed 6/4 (aligns the surface with structuralBassLine's existing principle,
compose.mjs ~793 "a 6/4-by-leap is worse than a parallel"). No gate, no 6/4 hack (the resolveOuterParallels
fifth-escape stays reverted). Result across 600 pieces, 0 invalid: g2 outer parallels 13.8% -> ~1-3% (sample variance), g3 ~1%, g4 <1%,
BY CONSTRUCTION. Residual ~2% parallels / ~5-6% fleeting weak 6/4 at g2 = the genuine fixed five-finger box bind.
ROOT CAUSE VERIFIED with live engine scores (DBG64 probe, since removed): of flagged g2 6/4s, ~65% have NO third
reachable in the box for that chord, and the rest have a third in the box that would ITSELF sound a parallel
octave/5th with the tune — so the fifth (a momentary/sustained weak 6/4) is the genuine least-bad, and the engine
takes it CORRECTLY over a parallel (e.g. sustained VII in Gm: the first-inversion third A3 scored -16.3 as a parallel
octave Bb->A over Bb->A, the 6/4 fifth C4 scored -7.65 by contrary motion; C4 rightly chosen). CORRECTS an earlier
looser note ("box offers only root or fifth") — the fuller truth is "no third, OR the third parallels." A cheap
proxy probe first mis-read some as bugs because it sampled the previous bass one BEAT back, wrong for
sustained/long notes (a whole bar back); the real engine reasons over the skeleton and is right. The genuinely-
composer way to erase this last slice is melody/harmony NEGOTIATION at the bind (nudge the melody note or the chord
so the fixed hand voices cleanly) — additive architecture, not a bug fix; left for Matthew to green-light.
Verified by rendering trios per grade + fresh g2 character trio (all read as two clean independent lines;
oom-pah/broken/sustained/alberti all intact). Harmonic rhythm stays ungated and moves within the bar (prolong/split
per beat) at every grade.

## JOB METRE-CHARACTER — a pinned character must honour its metre (waltz/minuet are ternary)
Found by LOOKING at an audit spread: pinning character='waltz' produced "Tempo di Valse" in 4/4, and 'minuet' in 2/4 —
no composer writes a waltz in 4/4. Traced: compose-adapter picks the metre FIRST (leanAway over the grade's simple
metres), then in UNPINNED generation picks the character to fit that metre (charPool filter) — so real output is always
consistent. The mismatch only arises when a caller PINS the character while leaving the metre free (my own audit
harness did exactly this). Verified NOT a production defect: server.mjs /api/generate passes only {avoid} (no
character), and gen-batch.mjs doesn't call generateCompose. Still fixed at source as a definitional constraint (a
genuine gate, criterion-1 exception): when opts.character is pinned, the metre is drawn from the intersection of the
grade's metres and the character's metres. Verified: waltz/minuet now always 3/4, march 4/4, scherzo 2/4; the dance
spread (waltz, minuet x2, march, scherzo) all render as idiomatic music. Distribution across 240/grade unpinned is
healthy: metres ~even, all 11 characters present each grade, waltz/minuet ~5% each (the only 3/4-locked characters).

## JOB STACCATO-REASONING — a staccato only where a composer would actually mark one (Matthew caught a dotted-quaver staccato)
Matthew, looking at a render: "it doesn't make sense to have a dotted eighth note that's staccato. Why would it not be a
16th note with a rest afterwards? There needs to be some more reasoning around when staccatos are actually used."
He is right — a staccato dot on a dotted quaver is self-contradictory. Cause: articulate() (compose-adapter.mjs) applied
'-.' to ANY note with n.d <= stacDurMax (1 for a detached character), a blanket duration threshold — so a dotted quaver
(0.75) qualified. Rebuilt the WHERE with a composer's reasoning: a staccato clips a note to leave note-then-silence, so it
fits an UNDOTTED value with room to clip. It is NOT applied to (a) a DOTTED value (the dot is a length/lilt gesture; short+
gap is written as a plain shorter note + rest, never a dotted-staccato), nor (b) the short note that COMPLETES a dotted
figure (the semiquaver after a dotted quaver — an upbeat that connects FORWARD; the dotted rhythm itself carries the
crispness). Verified: across 900 pieces, dotted-value staccatos 0 (was nonzero), dotted-tail staccatos 0, legitimate
plain-note staccatos 5177 (staccato still lands where it belongs). Rendered marches/scherzo: dotted tattoos now read as
connected dotted rhythm, even notes + block-chord tread stay crisply detached. 0 invalid.

## JOB RESTS — reasoning out how a composer actually uses rests (Matthew: "not used that often... more stylistically")
Measured first: rests averaged 0.59/piece, a third of pieces had NONE, all fell on weak beats as end-of-phrase breaths,
and 0% led in with an upbeat. So rests served exactly ONE function (the phrase breath). A composer uses rests for: (1)
the breath [had it], (2) the ANACRUSIS / upbeat, (3) the MOTIVIC rest (note-then-rest, the germ's air — ties to the
staccato point), (4) the TEXTURAL/dialogue rest [partly, answerAtBreath], (5) the DRAMATIC caesura. Matthew: build them
all, "however a composer would write."

Part 1 DONE — ANACRUSIS (compose-adapter addAnacrusis, ANAC map): whether a tune leads INTO its first downbeat or plants
it is a per-character phrase-opening choice (march/song/dance lead in; waltz/minuet/Maestoso state beat 1). The pickup is
a one-beat scale approach (a crotchet or two quavers) rising by step into the first downbeat note; the bass rests under
it and enters on the downbeat; the opening dynamic/hairpin/phrase-slur move onto the upbeat. Rendered via ex.partial
(engine already supported it). Inserted after articulate + before fingering so the pickup is fingered. Made compose-audit
partial-aware (every note-time walk compared to a body-time event now starts at -partial). Verified: 20% of pieces now
lead in (march 30/300, waltz 1, grand 6 — the intended spread), 0 invalid across 900, battery + parallels unchanged
(anacrusis pieces not mis-flagged), renders read as genuine upbeats (march + cantabile looked). Parts 2-3 (motivic +
dramatic rests) still to build.

Part 2 DONE — MOTIVIC AIR (compose.mjs composeMelody 3b pass + compose-adapter gap lean): a CRISP character's detachment
is partly RHYTHMIC, not only a staccato dot — a plain crotchet on a WEAK beat clips to a quaver + a quaver-rest (the
"note then air" gap Matthew described: the short-note-plus-rest a composer writes rather than dotting-and-detaching a
long value). Decided ONCE per piece (a consistent lean, reads as the tune's character not random holes), applied to every
qualifying weak-beat crotchet, never on a downbeat or in a cadence bar (the phrase breath owns the ends). gap =
detached 0.55 / crisp 0.4 / stac>=0.5 0.28 / smooth 0 — so smooth/legato characters are UNTOUCHED by construction.
Reuses the tail-rest (_breathRest) mechanism; breathe pass guarded not to double-carve. Also added articulation rule (c):
no staccato dot on a note a rest already follows (redundant). Verified: 0 invalid/900, rest usage 0.59 -> 1.23 RH
rests/piece, pieces-with-rests 49% -> 63%, battery clean; renders LOOKED (march reads as crisp "note-air-run" idiom, a
scherzo naturally takes few gaps as it runs in quavers, a cantabile is untouched). Part 3 (dramatic caesura / textural
dialogue rests, a grade-4 flourish) still open.

Part 2 REFINED (checking workings vs criterion 2): the motivic gap was clipping ANY non-downbeat crotchet, including the
4/4 mid-bar (beat 3), which is secondary-strong (ONE-two-THREE-four) — a composer SUSTAINS the strong beats and clips the
weak ones. Fixed: the gap now excludes both the downbeat AND the 4/4 mid-bar, landing only on genuinely weak beats.
Verified 0 invalid, 4/4 march reads with beat-3 sustained and gaps on beats 2/4.

Part 3 ASSESSED, not forced (criterion 1 restraint / don't over-engineer): a DELIBERATE dramatic caesura (grand pause
before the final statement) is a rare flourish Matthew himself flagged as lowest-value. Measured first: a both-hands rest
(the natural caesura moment) ALREADY emerges in 16% of pieces and 35% of grade-4 formal pieces, from the LH breathing WITH
the melody at a phrase boundary. So a mild caesura is already present as an emergent feature; forcing a special-cased
grand-pause on top would be over-engineering a rare gesture for marginal value. Recommendation: treat the rest work as
substantially complete with the two STRUCTURAL functions (anacrusis + motivic air) plus the emergent both-hands breath;
build the deliberate grand-pause only if Matthew specifically wants that dramatic gesture. [measured, then chose restraint]

## AUDIT (fresh, LOOK-first) + SEQUENCE ATTEMPT — reverted, with the real lesson
Matthew: fill the nuanced "correct but not idiomatic" gaps so pieces are indistinguishable from a composer's, treated
DIFFERENTLY per style. LOOK-first audit across grades/characters + measured the eye's flags. Findings:
 - STRONGEST: melodic SEQUENCES (a figure restated a step up/down) occur in ~48% of g3 / ~51% of g4 pieces but only ~3%
   of g2 — g2 tunes WANDER instead of developing a figure. (Partly structural: g2 tunes are short + boxed.)
 - ~20% of g2 pieces have a bar of undifferentiated even quavers (no rhythmic profile).
 - Accompaniment tends to run one figure for all 8 bars (mild at this grade — short teaching pieces often do).
ATTEMPTED: a style-dependent development system — capture each phrase's opening FIGURE, restate it in the continuation
by a per-character treatment (repeat / diatonic sequence / inversion / free), drama-directed (seq up into the climax,
down after). MEASURED: it REGRESSED sequences (full-melody 48/51 -> 34/44; strong-note bar-pairs only 4-5%). DIAGNOSIS
(the real lesson, exactly Matthew's warning): a melody-ONLY transposition fights the INDEPENDENTLY-planned harmony — a
real sequence moves MELODY AND HARMONY TOGETHER (the progression itself sequences: descending-fifths, stepwise 6/3s,
ii-V ii-V). Forcing the tune to transpose over non-sequencing chords just bends it to the nearest chord tone = noise.
REVERTED in full (0 invalid, baseline restored). CORRECT APPROACH (next, careful): plan a SEQUENTIAL PASSAGE in
harmonicPlan — a phrase segment whose progression moves by a consistent diatonic step, style-weighted — and let the
existing melody engine sequence over it naturally. That is the composer-true "sequence as a harmonic-melodic gesture",
and it belongs in Job A/B (the harmonic journey), not a melody post-hoc pull.

## SEQUENCE — part 1 KEPT: the HARMONY spins sequences (foundation). part 2 (melody coordination) still to build.
Following the lesson (a sequence is harmony+melody together), built the HARMONIC half in harmonicPlan: where a phrase has
>=2 free bars, a style-weighted lean (character.seqBias — smooth 0.5 / lilt 0.34 / crisp 0.2) fills them as a SEQUENTIAL
passage — the roots move by ONE consistent interval (descending FIFTHS the workhorse, +down-a-third / +up-a-step as
alternates) instead of the fresh-chord journey walk (which structurally PREVENTS a sustained sequence). Verified 0
invalid/600, battery clean, LOOKED: e.g. a flowing A-minor Andante now runs I-IV-vii-iii (textbook descending fifths)
with a purposeful descending bass — audibly more COMPOSED than a static I-V, even before the tune is coordinated. This is
criterion-sound (lean, composer-true, verified) and KEPT.
STILL OPEN — part 2, the MELODIC coordination: the tune does not yet RESTATE its figure over the sequenced bars (the
melody follows contour, so the harmonic sequence alone doesn't move the melodic-sequence metric). The earlier melody-ONLY
attempt failed because the harmony didn't cooperate; NOW it does, so a careful figure-restatement applied ONLY on
sequenced bars (where the transposed figure lands on the new chord's tones by construction) is the sound next step. Also
note: g2 has NO free bars (open->cadence), so g2 sequences need either sub-bar harmonic rhythm room or a melody+bass
transposition within the box — a separate careful sub-problem.

## SEQUENCE — part 2 KEPT: the MELODY rides the harmonic sequence (chord-relative restatement)
Built the melodic half SOUNDLY this time. composeMelody now DETECTS a sequential passage from the plan (roots moving by
one consistent scale-step for >=3 bars) and, on each step, RESTATES the figure CHORD-RELATIVELY — the same intervals above
the moving root — so the tune sequences WITH the harmony and every note is a chord tone BY CONSTRUCTION. This is why it
works where attempt 1 (a fixed/arbitrary melodic shift over non-sequencing harmony) failed: the harmony now cooperates and
the shift matches it. Fires only on a genuine sequential run (occasional, as sequences should be). Verified: 0 invalid/600,
battery + parallels clean, and LOOKED at firing cases — e.g. a grand Bb 3/4 over I-vi-ii-V has bars 2-3 clearly rhyming
(half-note + two descending quavers restated a step down with the harmony), a real idiomatic melodic sequence that reads
cleanly. Criterion-sound: lean (only on real runs), composer-true (chord-relative spinning-out), verified. KEPT.
NOTE: g2 still rarely sequences (no free bars for a 3-bar harmonic run) — its gap needs sub-bar harmonic room or a
box-safe melody+bass shift, a separate careful sub-problem, as flagged. The g3/g4 sequential passages are the win here.

## GERM PROFILE — a motif has rhythmic SHAPE, not a flat run (+ a criteria-honesty correction)
Checking my own workings: I had declined the grade-2 "even-quaver stream" flatness citing "grade-constrained" — that was
WRONG (g2 gmin 0.5 allows crotchets, dotted-crotchet+quaver, minims; the variety IS available). Measured the real
picture: the pure all-quaver monotony is only ~4% of g2 (a tail), and the broader "one cell dominates 60%+" (13%) is
mostly LEGITIMATE motivic unity, not a defect — so declining was defensible, but for the right reason, not mine.
FIXED the 4% tail at the SOURCE, extending the existing "a motif must be a shape (>=2 events, not a drone)" to rhythmic
PROFILE: the germ seeks some duration contrast, BOUNDED (3 redraws) so a genuinely flat character (a fast moto-perpetuo)
still surfaces — a lean, never a wall. Verified 0 invalid/600, flat-heavy pieces g2 4->3% / g3 2->0% / g4 1->0%, top-cell
share ~unchanged (UNITY PRESERVED — a march still restates its sseee figure), and LOOKED: a lively g2 that would have been
four flat quavers a bar now carries a half+two-quavers motif developed with rests. Criterion-sound: lean, composer-true
(a motif has profile), verified.

## CADENCE APPROACH — a graceful close STEPS to the tonic (widened from sung-only to all non-crisp characters)
Audited cadences (a strong "not composed" tell). Good already: penult is ALWAYS a dominant (100%), close is broadened
(93-98%). But ~17-25% of pieces LEAPT a 4th+ onto the final tonic (^5->^1, ^4->^1) — abrupt, un-composerly. Cause: the
existing "sung cadence steps to the close" pull was gated to (figure conjunct || legato), so SMOOTH-but-not-legato
characters (flowing, gentle, grand) and the LILTING dances (waltz, minuet) fell through and leapt. Widened the gate to
gracefulCad = (chr.feel !== 'crisp'): a smooth/lilting line pulls the penult to a chord tone of its own harmony a
step/third from the tonic (^7/^2 over V -> stepwise ^7-^1 / ^2-^1); a CRISP/energetic character (march/dance/lively/
scherzo) still keeps a leap to a bright tonic (a real flourish/fanfare). Verified 0 invalid/600: big-leap-to-close g2
25->8% / g3 17->9% / g4 17->10% (residual = the crisp fanfares), stepwise closes g2 46->66% / g3 50->58% / g4 52->62%,
and LOOKED — a flowing Andante that leapt up a 4th to a high tonic now steps down to a settled low tonic. Criterion-sound:
lean (only when the penult would leap, only non-crisp, only to a consonant chord tone), composer-true (tendency-tone
resolution), verified.

## G2 BIND — proactive hand-aware melody lean ATTEMPTED, reverted; the honest conclusion
Matthew (rightly) rejected "negotiation at the bind" as still a reactive repair. The proactive, composer-true framing:
write the melody AWARE of the bass so the outer voices never collide, so the bass states a clean root and never dodges
onto the fifth (6/4) or repeats (drone). IMPLEMENTED it: at a tight five-finger box, lean the melody away from a parallel
octave/fifth with the chord ROOT (the anticipated bass). MEASURED over 1200 pieces: 6/4 3.2%->3.6%, drone 1.4%->1.4% — NO
improvement. DIAGNOSIS: the premise is only half-right — the g2 LH is a COUNTER-LINE, not reliably the root, so avoiding a
parallel with the ROOT does not prevent the actual collision (which is against whatever chord tone the counter-line
lands on). Reverted cleanly (baseline restored, 0 invalid).
THE REAL CONCLUSION: the 6/4 at the bind is decided at the BASS realization, where BOTH the melody and the box are already
known, and it correctly takes the least-bad (a fleeting 6/4 over a parallel, per the established ordering). A genuinely
proactive fix needs the melody and bass COMPOSED TOGETHER for g2 (joint outer-voice planning) — a real change to the
harmony->melody->bass ORDERING, which Matthew correctly identified as the root cause. That architectural rework is
disproportionate to a ~3% residual that is ALREADY the correct least-bad outcome. So: left as-is, honestly, not patched.

## G2 HAND POSITION + BASS FOUNDATION — the real composer fix (Matthew, emphatic + correct)
Two false things were baked in: (1) the LH was nailed to the TONIC pentachord (^1-^5), so my whole "IV/V/vi bind" analysis
assumed the little finger is on the tonic — WRONG, the hand goes where the chords lie (put the little finger on ^6 and vi
sits fully under the hand); (2) the bass DODGED onto the fifth (an accidental 6/4) to escape a parallel the melody had set
up — a composer never states an accidental 6/4, and never sits on the fifth.
FIX (all preference-based, fully reasoned, measured over 6000 pieces to beat the ±1% sampling noise that had me chasing
ghosts earlier):
 1. The BASS states the FOUNDATION — root or first-inversion third, NEVER the fifth on a stated beat (bassSkeleton fifth
    penalty -> forbidden; the rootfifth OOM states the root/third, not the lowest chord tone). A planned cadential 6/4
    (bassDeg) is untouched.
 2. HARMONY is FREE (removed the false "lean away from IV/V/vi" — that was the tonic-assumption leaking in).
 3. The HAND is PLACED AFTER the harmony to FIT it: score every pentachord by ROOT coverage first (a stated root = clear
    harmony, no ambiguity), then third (a first-inversion escape); pick a best-fit, register-permitting, random tie-break
    so the position VARIES piece to piece; both hands take it, an octave apart.
RESULT (measured): g2 6/4 5.0% -> 1.0%; overall audit flags 10% -> 6.3% (HARM-ambiguous spike from a first draft cured by
the root-first metric); positions now 32% non-tonic (subdominant/dominant/^6 all appear, idiomatically — e.g. a
subdominant-position I-IV-V dance, a dominant-position waltz); 0 invalid. LOOKED: reads as real varied-position grade-2.
Residual ~4% "parallels" are the compound melody-over-bass octave motion that is idiomatic in beginner writing (the audit
does not flag it). LESSON: measure at 6000 pieces (the 5% rate has ±1% noise at 2000); reason the WHOLE chain before
changing one spot; do not assume the hand is on the tonic.

## G2 audit of rendered pieces (per Matthew) + octave-placement fix
Fully audited 6 rendered g2 pieces bar-by-bar, both hands: 5 clean (subdominant-position I-IV-V dance, dominant-position
waltz, tonic I-IV-V gentle, minor i-ii°-V lively, I-iii-V cantabile — varied positions, clear harmony, moving bass, no
6/4). 1 real defect: a G-major march DRONED on the tonic (I-vi-V) because G is a HIGH tonic and the register filter had
excluded the subdominant/dominant positions, locking it to the tonic where vi's root (^6) is out of the hand → vi's oom
fell on its third (=I's root) → drone. FIX: don't exclude positions by register — allow the little finger on ANY scale
degree (all 7 pentachords) and OCTAVE-PLACE the window so the melody stays in a readable treble register whatever the
position. Verified: 0 invalid; hand stays within a five-finger fifth (0 violations / 3000); non-tonic positions 32% -> 40%
(high-tonic keys can now move); overall audit flags 6.1% (from 10% baseline); 6/4 ~1%. Residual: marches still drone ~15%
(a repetitive tread is semi-idiomatic; overall drone 1.1%) — a minor character-specific tail, noted not chased.

## Self-audit against the three criteria (g2 hand-position work) + position-lean softening
Reviewed each g2 change I made for "preference-based, composer-reasoned, not a wall":
- bass never states an accidental 6/4  -> legitimate THEORY GATE (real fault, like parallels); planned cadential 6/4 + weak-beat passing fifths untouched. KEEP.
- oom states root->third->any  -> preference chain. KEEP.
- harmony freed (removed fitsHand bias)  -> removed a false tonic-assuming rule. KEEP.
- octave-placement  -> mechanical register, not a musical rule. KEEP.
- hand placed to fit harmony  -> was a HARD ARGMAX (single best voicing). That is an optimisation, not a preference.
  SOFTENED to a weighted lean: weight each position 2^(score-best) and draw. Best-fitting hand favoured, near-equal
  hands surface, poorly-fitting hands exponentially rare. A composer's choice, varied, never a rigid argmax.
Verified 3000 g2: 0 invalid, 0 span violations, 6/4 1.5%, non-tonic position 40%->65%. Variety up; quality held.

## "There should be no cost" — the drone was missing reasoning, not a tradeoff
Matthew's principle: if a piece shows something a composer wouldn't write, that is a reasoning GAP, not an
acceptable price. Chased the grade-2 block drone to source and found THREE gaps (fixed each at source):

1. SINGLE-VOICE BLOCK hammered one pitch. `block` at grade 2 (chordMax 1) struck the skeleton note every beat, so a
   held harmony = one pitch repeated. A composer with one LH voice OUTLINES the chord on the beat (root on the harmony
   CHANGE / downbeat, then walking up through the chord tones) — a firm march tread that moves. Also keyed "state the
   root" off a genuine deg-change, not every plan event-boundary (the plan emits a held chord as several 1-beat events).

2. TWO PARALLEL-BREAKERS minted repeats. fixLHParallels AND resolveOuterParallels both broke an outer-voice parallel
   by holding the PREVIOUS bass pitch (b0 / p.b) — genuine oblique motion only when that note SUSTAINS; on a discrete
   tread beat it re-articulates the same pitch = a drone, worse than the offbeat parallel it breaks (a composer judges
   parallels between the STRUCTURAL outer voices, not the melody vs the accompaniment's offbeat inner filler). Guarded
   both: resolve onto the previous pitch only for a sustained note; on a discrete beat leave the milder reading.
   -> run-of-3 identical bass 39.5% -> 12.9% (the residual is legit: sustained pedals + oom-pah pah-rests filtered out).

3. POSITION LEAN vs HARMONY CLARITY. The weighted position lean let root-poorer hands surface -> more first inversions
   -> "root stated in neither hand" 11.8%. No one five-finger hand covers every chord's root, so indiscriminate variety
   muddies chords. Weighted ROOT coverage 3x (was 2x): ambiguity back to ~4.8% (the pre-variety baseline) with 58% of
   pieces still OFF the tonic. Variety AND clear harmony — a composer varies the hand but never muddies the chord.

Verified (grade 2, N=2000): 0 invalid, any-flag 8.7% (was 10.3% baseline; the 15.2% spike is gone), BASS-drone 0.15%,
parallels 0.00%. Grades 3/4 unchanged/better (the parallel-breaker fixes are shared). Rendered block march + oom-pah
scherzo: LH reads as a real moving tread, harmony clear. No cost.

## Full texture + dimension audit (finish pass)
Tallied every defect by grade AND texture (N=3000/grade) to find residual outliers, then fixed each at source:

1. BROKEN 6/4 (was the top texture-specific flag: g2 3.0% g3 5.4% g4 4.7%). The arpeggio anchored on the ABSOLUTE
   lowest chord tone "for room to climb" — a bare fifth on a short chord = a stated 6/4. Rewrote the anchor: lowest
   chord tone that lets the figure MOVE, preferring a non-fifth foundation; on a chord that will rise (>1 beat) a
   risen-off fifth is a line, on a one-beat chord the anchor must be a non-fifth (it's the whole statement). Careful:
   naive "skip the fifth" DRONED the narrow g2 hand (root at the top, nothing to climb to) — the rise-aware rule fixes
   both. -> broken 6/4 g2 1.9% g3/4 0%, drone 0%.

2. BLOCK 6/4 (g2 2.9%). footRootOf fell back to the skeleton note (could be the fifth) when neither root nor third was
   in the fixed hand. Made the fallback prefer any NON-fifth tone; the fifth only if the hand holds nothing else. Also
   a one-beat chord is now "strong" (states the foundation, never a walked-to fifth). -> block 6/4 g2 1.5% g3/4 ~0%.

3. HARM thin (g3 1.6% g4 2.4%) = a parallel period whose two limbs share the SAME departure (only 3 distinct chords).
   Strengthened the sibling-contrast lean 0.3->0.1 so the consequent departs differently. Residual = genuinely cramped
   ii-V-I periods (one departure bar total) — a legitimate idiomatic form, left as a judgment call.

4. CANTABILE re-strike (MEL repetitive, g2 2.0%, slow/legato characters). A singing line re-struck a pitch as 3-4 equal
   notes (69/1 69/1 69/1 69/1) where a composer SUSTAINS. Added a legato-only merge: consecutive same-pitch notes under
   ONE held harmony fold into a single sustained note (legal duration, no bar/beat crossing, no clash). -> g2 1.2% g3/4 ~0%.
   Crisp/detached lines keep their repeated attacks (a real device there).

FINAL (N=3000/grade): 0 invalid all grades. drone 0.07/0.30/0.33%, 6/4 0.60/0.07/0.03%, parallels 0.00% all.
any-flag g2 7.5% (dominated by the fundamental 5-finger/2-voice HARM-ambiguity — worst for the sparse sustained
texture, a real grade-2 floor), g3 3.3%, g4 4.7%. Texture flag-rates EVENED OUT (broken was 12% -> now 3.6-8.7%; no
outlier texture remains). Rendered all six textures across grades/characters: every one reads as composer writing.

## RE-DERIVATION 1: how a composer chooses a bass note (replaces the whole 6/4 patch cluster)
Matthew's bar: the LOGIC in the system must be how a composer THINKS while writing, preference-based, not reverse-
engineered from the output or the audit's defect definition. Reasoned out the bass note from scratch:

  The bass is a LINE and the harmony's FOUNDATION. Default = the ROOT (states the chord). The THIRD (first inversion)
  is taken for the LINE (smoother/lighter bass, a step not a leap). The FIFTH is NOT a foundation — a second inversion
  is a DEVICE (cadential 6/4, passing, pedal, arpeggiated), where the fifth is passed-through/held/arpeggiated, never
  leapt-to and sat on. So an accidental 6/4 cannot be CHOSEN; it is never offered as a foundation.

Put THAT one principle in the system, and DELETED the patches it makes unnecessary:
- structuralBassLine: structural candidates are now root/third (+ planned bassDeg) ONLY — the fifth is not a candidate.
  Deleted the +12 fifth penalty and the +50 final-fifth penalty (nothing to penalise; the fifth isn't offered).
- bassSkeleton: a STRONG beat offers only the foundation (root/third); a WEAK beat moves (the fifth lives here, passing).
  Deleted my -100 stated-fifth penalty.
- block texture: figures the foundation (state it on the beat, outline the chord up/down between). Deleted footRootOf's
  non-fifth fallback, the one-beat-chord-is-strong rule, and the explicit anti-repeat (all audit-shaped).
- broken texture: arpeggiates from the foundation (up, else down). Deleted the rise-aware anchor (ev.dur>beatLen branch,
  the "risen-off fifth is a line" reasoning was the audit's 6/4 exemption in disguise).

Verified: 0 invalid all grades; 6/4 0.08-0.16% (the residual is the genuine narrow-box last resort — the hand holds
only the fifth); drone ~0.3%; any-flag g2 7.1 / g3 3.6 / g4 5.0%. Rendered block march + broken arpeggio + earlier
textures: all read as genuine composer writing. The clean metrics are now a CONSEQUENCE of the principle, not the target.

STILL OUTCOME-SHAPED (next re-derivations, per Matthew's full-audit list):
- harmony-first architecture (should be tune-led / heard together, not planned before the melody exists)
- the five LH post-passes (elaborate/resolveOuterParallels/animateInner/breathe/respond = composing-then-editing)
- grade-2 hand-placement optimiser (score+weighted-draw) and rootW=3 (tuned to the ambiguity count)
- sibling-contrast 0.1 (tuned to the thin count)

## RE-DERIVATIONS 2-4: post-hoc parallel repairs removed; hand placement + period contrast re-derived
Continuing the "how a composer THINKS, not what the output looks like" audit, no patches, nothing cut off:

2. PARALLEL REPAIRS DELETED. A composer avoids parallels WHILE VOICING, never by hunting them in finished music. With
   the bass-foundation principle, the two-part counterpoint (contrary/oblique motion vs the tune) already runs at SOURCE
   in bassSkeleton. Verified: with the post-hoc repairs OFF, structural parallels stay 0.00% over 4500 pieces. The repairs
   were still firing (~0.5 notes/piece) on FIGURATION-level parallels (an arpeggio tone vs the tune) a composer never
   rewrites — and earlier they minted repeats doing it. DELETED both fixLHParallels (realizeLH's fix() → identity) and
   resolveOuterParallels (adapter call + the dead function + the import). Parallels still 0.00% from source alone.

3. HAND PLACEMENT re-expressed as an ORDERING, not a tuned ratio. Was score = 3*rootCov + 1*thirdCov with 2^(score-best)
   draw, the "3" tuned against the ambiguity count. A composer places the five-finger hand FIRST so the chords' ROOTS are
   playable (in two voices a reachable root = a legible chord), THEN among the most-root-covering hands prefers the one
   reaching the most THIRDS. Lexicographic: roots primary, thirds the tie-break; a weighted lean among the tied hands for
   variety (full-root hands lead, a one-short hand a reachable minority). Result: HARM-ambiguous 4.8% -> 1.9% AND non-tonic
   variety 67% — the honest ordering out-performed the tuned constant.

4. PERIOD CONTRAST: removed the tuned sibling-contrast (avoidDeg w*=0.1, tuned to the "thin" count). The genuine
   "prefer a FRESH colour" lean already contrasts a period's limbs (the antecedent's departure is "visited", so the
   consequent leans toward a chord it hasn't used) while letting a parallel period surface — as a composer writes both.
   Removed the penalty + the now-unused avoidDeg param + sibling threading. Distinct-chord spread essentially unchanged;
   the small "thin" rise is just more (legitimate) parallel periods.

State: 0 invalid all grades; parallels 0.00%, 6/4 ~0%, drone ~0% (the g4 two-voice block "drone" ~1% is the audit
flattening a STRUCK CHORD to its bass — a Maestoso block with a moving upper voice, idiomatic, not a real drone).
any-flag g2 4.9 / g3 5.8 / g4 7.2% (g3/4 up only because parallel periods, a legit form, read as "thin").

STILL OUTCOME-SHAPED (next):
- harmony-first architecture (harmony planned before any tune exists) — the deepest; a cognition question for Matthew.
- the shaping post-passes: elaborateHeldHarmony / animateInnerVoice / breatheLH / respondToBreaths — examine each:
  a genuine LAYER of writing, or a repair? (breathe/respond read as genuine dialogue; elaborate/animate need a look.)

## RE-DERIVATION 5: the shaping post-passes — repair vs layer
Judged each of the four LH post-passes against "a composer works in LAYERS (skeleton then enrichment) but never
DETECTS-AND-REPAIRS finished music":
- elaborateHeldHarmony -> REPAIR. It found a "dead" prolonged harmony and REPLACED the held bass with an arpeggio —
  overriding the texture's own choice. Rendered a sustained Adagio with it OFF: the held whole-note chords under the
  singing line are a genuine, spacious slow-movement texture (not dead). A held chord under a slow melody IS the texture,
  not a defect. Fires only 0.4%. DELETED (function + adapter call + import). (The audit's mirror "chord held un-elaborated"
  now honestly flags the rare genuinely-static span ~0.5% — a MELODIC-motion gap over a long harmony, a melody-engine
  matter for later, NOT something to fix by arpeggiating the bass after the fact.)
- animateInnerVoice -> LAYER (kept, flagged). Its output — a moving inner voice under a held/repeated 2-note chord — is a
  genuine device (that is how a Maestoso block stays alive). Applied as a post-pass, so ideally FOLDED into the two-voice
  texture's voicing; kept for now because it does real musical work, not defect-repair.
- breatheLH -> LAYER (kept). WHERE the accompaniment breathes at phrase ends, character-gated (detached lifts, legato
  holds), with the leading-tone guard. A real phrasing decision, not a repair.
- respondToBreaths -> LAYER (kept). continue / yield / answer at the melody's breaths, by the character's disposition —
  genuine dialogue between the hands.

State after this turn: 0 invalid all grades; any-flag g2 4.4 / g3 6.7 / g4 8.0% (g3/4 driven by HARM-thin = legit
parallel periods + the struck-chord "drone" audit quirk + the ~0.5% static-span honesty).

STILL TO DO: the harmony-first architecture (harmony planned before any tune exists). The deepest one; a genuine
question of how a teaching piece is conceived per grade — flagged for Matthew's read before rebuilding.

## HARMONIC RHYTHM: the journey is a TIMED slot walk (no longer one chord per bar) + the anacrusis audit bug
Matthew: a composer's structural harmony is NOT one chord per bar. The planner laid the journey one-chord-per-bar and
decorated the grid, wrong at the root. Rebuilt harmonicPlan: the journey is walked over strong-beat SLOTS (bar downbeat
+ the half-bar in a DUPLE metre; 3/4 stays per-bar = the waltz/minuet idiom), each chord HELD for one or more slots by
the harmonic PACE (grade x character x drama — quicker into cadences, slower at repose). The functional grammar
(departure/journeyStep), the cadence pins, the sequential passage, the cadential 6/4 and the g4 tonicisation are kept;
a per-bar chords[] is derived for the downstream. Result: bars with >1 chord ~25%->~40%, distinct chords up, cadences
100% intact, 0 invalid.

THE EXPOSED BUG (Matthew's principle: if it's reasoned right and something gets worse, the problem is ELSEWHERE — find
it, don't accept a cost). The density raised HARM-ambiguous to ~7%. Chased it wrong three times (structural bass, textures,
post-passes — all wrong). The real cause: it was concentrated ENTIRELY in ANACRUSIS pieces (partial>0: 25% ambiguous;
partial=0: 0.2%). compose-audit.mjs's ambiguity check built its note timelines from 0 instead of -P, so for a pickup it
compared pickup-shifted notes against body-time events — a false flag the one-per-bar harmony had hidden. Fixed the audit
(tr/tl2 start at -P, like the audit's other checks). The dense harmony was reasoned correctly all along.

FINAL (2500/grade): 0 invalid; any-flag g2 6.2 / g3 1.9 / g4 2.4%; HARM-amb 1.2 / 0.0 / 0.1%; parallels 0%; drone ~0.1%;
6/4 g2 1.5% g3/4 ~0.2%; bars>1chord 35-40%; distinct/piece 4.2-5.6. Also added: the bass is FUNCTIONAL under a short
chord (states the ROOT, not a first inversion) — a genuine composer principle for fast harmony (bassSkeleton + arpAnchor).

## GRADE = A PERVASIVE SOPHISTICATION LEAN, not a checklist or a gate
Matthew caught g3 ≈ g4 (a g3 even looked harder). Root causes + fixes:
1. I had GATED sub-bar chords to g4 (grade>=4) — pure binary thinking, which Matthew rejected ("that is not how a composer
   thinks"; mid-bar chords appear >1/bar at EVERY grade in real specimens; density is NOT a difficulty marker, RHYTHM is).
   UN-gated: half-bar slots exist at every grade in a duple metre; how often a bar turns over = the CHARACTER's harmonic
   pace × drama (removed the grade factor from `pace`). Density now flat across grades (~38-41% mid-bar), character-driven.
2. ANACRUSIS was leaking to g2/g3 (character-driven, no grade check). It IS a grade-canvas device (params: g4). Gated the
   call on gp.rhythmDevices.anacrusis → g2/g3 0%, g4 29%.
3. THE REAL DIFFERENTIATION (Matthew's composer-reasoning, which he endorsed): a composer writes AT the grade's LEVEL — the
   grade is a pervasive SOPHISTICATION lean in every decision, not a canvas of what's allowed and not a forced device. So a
   g4 cantabile is a MORE SOPHISTICATED cantabile (busier line, more colour) than a g3 one, same character, higher level.
   Built `soph` (g2=0, g3=.5, g4=1) threaded as a LEAN: chromColour ×(0.5+soph), seqBias ×(0.7+0.6·soph) [harmony reaches
   for colour/sequence more]; composeMelody pace ×(0.8+0.4·soph) [rhythm subdivides more]. Result (2500/grade): subdiv
   46/62/76%, chromatic 2/9/33%, secondary-dominant 0/0/25% — a clean rising progression, while density stays flat. A
   gentle g4 now reads at grade 4 (busy semiquavers + chromatic) vs a gentle g3 (simple + diatonic) — confirmed by render.
   All clean: 0 invalid, ambiguity ~0, parallels 0, drone 0, 6/4 ~0.1-0.3%.
LESSON (again): stop reaching for binary gates; a composer thinks in weighted, situational preference. Grade included.
