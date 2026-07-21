# Dashboard + Stats redesign proposal

A rethink of the two pages together, because right now they overlap badly and neither does its
one job cleanly. The goal you set: a Stats experience that (a) makes members *feel their progress
compounding* and (b) *actually changes what they do next*, personalised and science-backed. To get
there we also have to fix the Dashboard, because half of what should drive behaviour is stranded there.

> **Research folded in.** A deep-research pass (behavioural science + product/UX teardowns, 22 sources,
> claims adversarially verified) is now reflected throughout, and summarised in **§8 Evidence base**.
> Headline: the durable, high-confidence evidence is the *behaviour-change* fundamentals
> (self-monitoring, goal + feedback, implementation intentions). Several eye-catching gamification stats
> were **refuted** in verification and are NOT relied on. Source-quality is called out in §8.

---

## 1. The core idea: give each page ONE job

Today both pages try to do everything, so they duplicate each other (streak, calendar, goals,
recent sessions, leaderboard ranks and the whole Journey card all appear on both). The fix is a
clean division of labour:

| | **Dashboard = "Today"** | **Stats = "Your progress"** |
|---|---|---|
| Tense | Present / near-future | Past + future |
| Question it answers | *"What do I do right now, and what's new?"* | *"How am I doing, how far have I come, and what should I change?"* |
| Mode | Act + browse + belong | Reflect + accumulate + course-correct |
| Emotional job | Momentum, "open the app and go" | Pride in the climb + a nudge that sticks |
| Content | Objectives, your next move, this week's focus, community, live events | Coaching insights, practice quality, the behaviour→result story, the long-term accumulation |

Rule of thumb for every card: **if it tells you what to do or what's happening now → Dashboard.
If it helps you reflect on how it's going over time → Stats.** Anything currently on both gets one
home, or a deliberately different cut on each (e.g. Dashboard = this month's calendar chain;
Stats = the full-year heatmap).

---

## 2. What's duplicated today, and where it should live

| Thing | On Dashboard | On Stats | Decision |
|---|---|---|---|
| Streak / week / all-time mins | Quick-stat cards | Hero + KPI cards | **Dashboard keeps a slim one-line glance; Stats owns the full breakdown.** |
| Calendar | This month | 52-week heatmap | **Keep both — different jobs.** Month = "keep the chain alive today"; year = "look how far." |
| Goals | Active goal bar + piece goals | Goal *projections* (ETA/pace) | **Dashboard owns active goal management; Stats owns the projection/pace reflection.** |
| Recent sessions | Last 3 | (History tab) | **Drop from Dashboard** — low value, History already covers it. |
| Leaderboard ranks | "Standings" | (implied, not actually rendered) | **Dashboard owns Standings** (it's social). Remove the idea of ranks from Stats entirely. |
| Journey / "Your Path" card | Hero card (objectives + stage + jars) | Skill levels reuse it | **Dashboard owns the full card** (it's the "what do I do" anchor). Stats shows only a *compact* stage/level/hours banner that links to the roadmap. |

---

## 2A. Designing for the empty screen — the retention-critical mode

**This is the highest-stakes part of the whole redesign.** The member most likely to churn is the
one who hasn't built the habit yet. To be accurate about what they actually see today: an onboarded
new member *does* see the Journey card with their Stage 1 objectives and the roadmap structure —
the "what to do" is on screen. (The Journey card only renders truly empty in a load/timing edge case,
not as the normal new-member state.) So the problem is **not** a blank screen. It's two things:

1. **No progress to feel.** Everything data-driven reads zero — streak 0, 0 minutes, empty calendar —
   and the insights engine is gated at ≥3 sessions, so there's no coaching yet either. They see
   structure, but nothing that says *"you're moving."*
2. **The objectives are shown, but are they *prompting*?** A checklist of things you haven't done is
   not the same as being pulled into doing the first one. The risk is that we *display* a to-do list
   they can ignore rather than *activate* the first action.

So the design job is **"fill the progress void with the road-ahead, and turn the visible objectives
into active prompts that get them to act"** — not "fill a blank screen." A more data-rich redesign
still makes #1 worse unless the low-data state is designed on purpose.

**Principle: "low data" must never mean "no sense of progress."** We have passive signals to lean on
even for someone who never logs a manual session:
- **Auto-logged in-app activity** — game plays, theory lessons and articles read are already logged.
- **Onboarding experience sliders** — give a prior-hours baseline, so even day one has a roadmap stage.
- **Library adds** — pieces the member has shown interest in.
- **The roadmap itself** — the path *ahead* is content we can show before any data exists.

### Both pages get an explicit cold-start mode that graduates into the full view

**Dashboard (new member):**
- A **"Start Here" checklist** replaces the empty Journey task list — 3–4 concrete first actions,
  each auto-ticking from data: *Log your first practice · Try Note Recognition (1 min) · Start the
  Theory course · Add a piece to learn.* A progress bar across the four. When all done, it switches
  to the normal Journey card. (This is the design from the earlier "Your Path" plan — it's exactly
  the empty-state answer.)
- The community feed still populates from *everyone's* activity, so even a day-one member sees a
  living app, not a dead one.

**Stats (new / low-data member):**
- Instead of zeros, show **the road ahead**: "Here's what your first month can look like" — the
  roadmap stages, a sample of the insights they'll unlock, and whatever passive data exists
  (games played, lessons done) framed as a real start.
- **Projected progress** from their onboarding baseline + early sessions ("at this pace you'll hit
  Stage 2 in ~6 weeks") so the accumulation story starts *before* the numbers are impressive.
- Charts that need history (heatmap, trends) show a friendly "keep logging to unlock this" placeholder
  with an example, not an empty axis.

### Three tiers, one design
Design every card for three states, and pick the tier per member from data volume:
1. **Cold (0–2 sessions):** Start Here checklist, the road ahead, passive signals, aspirational framing.
2. **Warming (3–~10 sessions):** first real insights appear, projections, early accumulation; Start Here retires.
3. **Full:** the complete Stats/Dashboard described below.

The rest of this proposal describes the **Full** tier; every section needs a Cold/Warming fallback,
and the research pass will sharpen exactly what the cold state should show.

---

## 3. Dashboard proposal

The Dashboard is currently ~15 stacked cards on mobile. It already has three zone labels
(Today / Your practice / What's new) but the cards don't respect them. Let's make the zones real
and cut the analysis out.

### Keep
- **Journey / "Your Path" card** — this stays the hero. It's the single best "what do I work on" unit.
- **Weekly Focus** — prescriptive, present-tense. Perfect Dashboard content.
- **Pieces-tidy triage** — prescriptive ("finished / still learning / not for me"). Keep, but fold it *into* the Journey card's task list so there's one to-do surface, not two.
- **Activity / Community feed**, **Live banner**, **Streams / Content**, **Next event** — all the "what's new / belong" content. Keep, group under one "What's new" zone.
- **Active goals** — the weekly goal bar + piece goals. Keep in the "Today" zone.
- **This month's calendar** — keep, but shrink it to a compact chain strip (the motivational "don't break it today" cue), not a full grid.

### Drop / slim
- **Recent sessions card** → drop (History covers it).
- **Quick-stat cards (streak/week/all-time)** → collapse to a single slim glance line at the top ("12-day streak · 140 min this week"), because the real numbers now live on Stats.
- **Term of the day + Article of the day** → keep but demote into the "What's new" zone as small items; they're nice-to-have, not core. Consider merging into one "Today's read" slot.

### Add (cross-page move — the important one)
- **"Your next move"** — surface the *single highest-priority insight* from the Stats insights engine right on the Dashboard, as one line with its CTA. The full coaching lives on Stats; the Dashboard just says *"Your next move: your sight-reading is the furthest behind your roadmap — play Note Recognition →"*. This is what turns the landing page from a status board into a coach.

### Resulting Dashboard structure (3 honest zones)
1. **Today** — glance line · Journey card (objectives, now including piece-triage) · Your next move · active goals · month chain strip.
2. **Keep going** — Weekly Focus · Matt's picks (already in the Journey card).
3. **What's new** — Activity/Community · Live/Streams/Content · Next event · Today's read (term/article).

---

## 4. Stats proposal

Today Stats is 12 sections, **three of which are fully built but hidden behind `display:none`**
(Extended stats, Time by Category, Practice Breakdown) — dead code to delete. The prescriptive
engine (Insights) is buried at position 3 and capped at 4 items. We restructure into a five-zone
narrative that runs "do → understand → celebrate."

### Delete outright
- `renderExtendedStats`, `renderCategoryBars` (Time by Category), `renderBreakdown` (Practice Breakdown) — hidden and superseded. Remove the code.
- The 4 KPI cards — they duplicate the hero. Fold the one unique thing (Player Level) into the new progression banner.
- Session-length histogram + "Practice by Day" bar chart — low behaviour-change value as raw charts; the day-of-week signal becomes a *nudge* instead (see §5, Best conditions).

### The new five zones

**Zone 1 — Where you are (slim orientation band).**
One compact banner: roadmap stage + Player Level + total hours + current streak, with a link to the
roadmap. Replaces the hero headline + KPI clutter. Small on purpose.

**Zone 2 — What to do next (the centrepiece).**
The Insights engine, promoted to the top and expanded. Two groups:
- **Do this** — the prescriptive nudges (skill balance, idle trainers, stalled pieces, focus quality), each with its CTA and its research citation (your science hook, made visible).
- **Nice work** — the reinforcement nudges (streak, improvement, consistency).
Uncap from 4; show the top 2–3 prescriptive + 1–2 reinforcement.

**Zone 3 — What's working (NEW — the behaviour→result bridge).**
The highest-leverage new unit. Show members the causal link between *their* behaviour and *their*
results, from data you already store:
- *"In weeks you practised 4+ days, your Note Recognition scores rose 12%."*
- **Practice Quality** — a focus-rating trend line + one correlation finding (*"your focus averages 4.3 in sessions under 30 min vs 2.8 over an hour"*). You capture `focus_rating` on every session and currently use it only to trigger two nudges — this is the most on-brand thing you could surface (deliberate practice, Ericsson, proven with their own numbers).

**Zone 4 — How far you've come (accumulation).**
The pride/compounding zone:
- **Full-year calendar heatmap** (keep — best accumulation visual).
- **Personal bests** (keep — "chase the record" tiles).
- **Hours milestones (NEW)** — total hours framed against something human: *"47 hours — more than a full university course's contact time"*, or a percentile vs other members. Makes the number *feel* like it's compounding.
- **Repertoire momentum** — the per-piece table you already have, reframed around movement: what's fresh, what's gone stale, what you finished. Lead with "3 pieces completed this year," not a raw table.

**Zone 5 — Trophies.**
"Earned this month" achievement medals (keep). Remove the stale "rankings" comment — ranks live on the Dashboard now.

---

## 5. The new science-backed, personalised features (the differentiators)

These are what make it "much more personalised" and genuinely behaviour-changing. All but the last
use data you already collect.

1. **Practice Quality (focus trend + correlation)** — *data ready.* `focus_rating` per session. Trend line + the single strongest correlation with session length / single-focus / time of week.
2. **Behaviour→result bridge** — *data ready.* Cross consistency (practice-days per week) with game-score deltas over the same weeks. "Your 4-day weeks are the ones that move your scores." Proof beats exhortation.
3. **Hours milestones** — *data ready.* Human-scale framing of accumulated hours + optional percentile.
4. **Repertoire momentum** — *data ready.* Reframe the piece table around finished / fresh / stale, with a "finish this one" nudge for the longest-stalled learning piece (already computed in `_insightCollections`).
5. **Best conditions ("you practise best on weekday mornings")** — *needs a small backend change:* `practice_sessions.created_at` exists but isn't pulled into `get_my_sessions`, so there's no time-of-day yet. One RPC tweak unlocks a classic, sticky nudge. Worth doing, but it's the only one that isn't free today.
6. **Implementation-intention plan (NEW — the strongest evidence in the whole pack, and it works with ZERO data).** Ask the member — in onboarding and again on re-engagement — to commit to a concrete *if-then* practice plan: *"After I make my morning coffee, I'll practise scales for 10 minutes."* Store it, and surface it as a live reminder on the Dashboard. Gollwitzer's experiments show cue-based plans roughly **double-to-triple** follow-through (22%→62%, 32%→71%), and crucially it works by *triggering action at a cue, not by boosting motivation* — so it's the single best lever for the exact person we're worried about: the new/low-data member who hasn't built the habit. This is a first-class part of the cold-start answer, not a stats card.

**Framing rule for every headline metric (WHOOP model):** don't show a bare number, show *number vs goal → the gap → one action*. Not "You practised 140 minutes," but "**140 of your 200-minute week — a 20-minute session today gets you there.**" This is what the evidence means by "actionable": a metric tied to a reference value and a single next decision.

---

## 6. Aesthetic direction

- **Fewer chart *types*, but keep the good ones.** Today: donut, line, two histograms, a ring, a heatmap, bar charts — that reads "dashboard," not "coach." Consolidate toward a small set: the heatmap (accumulation), one trend line (progression), the category donut (keep — the "avoid donut/pie" claim was *refuted* in the research; for a small number of categories it's fine and legible), and the insight cards (prescription). Cut the two histograms and the redundant rings. Evidence favours **length/position charts (bars, lines)** for anything requiring an accurate quantity read (Cleveland/McGill via NN/g).
- **Lead with sentences, not axes.** The insight rows (plain-English sentence + citation + CTA) persuade far better than any chart, and dashboards are for *fast* at-a-glance consumption, not exploration (NN/g). Bias the top of Stats toward words.
- **Don't over-weight vanity metrics.** Total-minutes, login counts and badge tallies feel good but are easy to inflate and don't track real skill. Give more visual weight to skill-linked signals (repertoire mastered, scales fluent, sight-reading/game progression). *(Blog-quality evidence, but the principle is well established.)*
- **One accent-per-zone rhythm.** Prescriptive zones in your gold/action colour; accumulation zones cooler and calmer, so the eye instantly knows "this is telling me to act" vs "this is celebrating me."
- **Shorter pages.** Dashboard from ~15 cards to ~9 in three clear zones; Stats from 12 sections to 5. Length itself is a UX problem — it makes both pages feel like a data dump rather than a place that helps.

---

## 7. Suggested build order (low-risk first)

The high-value behaviour-change wins are cheap and additive; the restructure and deletions come after.

**Phase 1 — the behaviour-change wins, on top of the current layout (fast, low risk):**
- Practice Quality card (focus trend + correlation).
- "What's working" behaviour→result bridge.
- "Your next move" single insight on the Dashboard.
These deliver the differentiator immediately without moving furniture.

**Phase 2 — declutter (safe deletions):**
- Delete the three dead Stats sections + duplicate KPI cards.
- Drop Recent sessions from Dashboard; slim the quick-stats to a glance line.

**Phase 3 — restructure into the zones:**
- Reorder Stats into the five zones; reorder Dashboard into the three real zones; fold piece-triage into the Journey card.

**Phase 4 — the one backend-dependent feature:**
- Add `created_at` to `get_my_sessions`, then ship the "best conditions" nudge.
- Hours-milestone framing + repertoire-momentum reframe.

---

## 8. Evidence base (from the deep-research pass)

22 sources, claims adversarially verified (16 confirmed, 9 refuted). **Believe the behaviour-change
fundamentals — they rest on top-tier meta-analyses. Discount the gamification stats — several were
killed in verification.**

### Confirmed — build on these (high confidence, peer-reviewed)
- **Self-monitoring works, and the active ingredient is *frequency of looking*.** Prompting people to monitor progress reliably raises goal attainment (Harkin et al. 2016, meta-analysis, 138 RCTs, d+=0.40). *→ Make Stats a surface members return to often; glanceable beats sophisticated.*
- **The effect is bigger when progress is *recorded* and when it's *reported/made public*.** *→ Logging and optional social/coach visibility aren't vanity — they amplify the core effect.*
- **Actionable = a feedback loop: state → compare to goal → surface the gap → one next action.** (Cambridge Handbook; WHOOP as the applied exemplar.) *→ The "goal + gap + action" framing rule in §5.*
- **Goals change behaviour only when *specific + difficult* AND paired with *summary feedback against them*.** (Locke & Latham, effect sizes .42–.80.) *→ Concrete targets, shown as progress-against-target, never raw activity.*
- **Implementation intentions (if-then plans) are the cheapest, strongest lever** — roughly double-to-triple follow-through (Gollwitzer & Brandstätter 1997). *→ The §5.6 plan feature; works with zero data.*
- **Visual design:** dashboards are for fast consumption, not exploration; length/position charts read most accurately (NN/g / Cleveland & McGill).

### Refuted — do NOT rely on these (failed 3-vote verification)
- ✗ "Streak-freeze improves retention ~48%." ✗ "Friend-streaks give +22% engagement." ✗ "Day-1 achievement → 33% vs 20% retention." *The specific gamification uplift numbers did not survive. Treat streak depth/forgiveness as a deliberate, A/B-testable choice, not a settled win.*
- ✗ "Data only becomes actionable through social context." (Overreached its source — individual reflection is fine.)
- ✗ "Personalised always beats generic." (Not supported as an absolute.)
- ✗ "Pie/donut charts should generally be avoided." (Refuted — the category donut is fine to keep.)
- ✗ "Practising without metrics is pointless." (Too strong — don't over-claim the deliberate-practice line.)

### Source-quality caveat
The behaviour-change science is high-confidence and durable. The retention/first-run *product* patterns
(Duolingo streak-in-first-session, WHOOP decision-framing, empty-state playbooks) rest largely on
**blog/teardown sources** — directionally useful, not RCT-grade. And the research did **not** surface
hard, quantified evidence for the specific low/no-data tactics (aspirational vs projected vs sample data);
those remain **design judgement** to be validated in-app. The Harkin effect is drawn mostly from health
behaviours, so applying it to piano practice is a reasoned inference.

### Two things the evidence says we should ADD that weren't in the first draft
1. **The if-then plan feature (§5.6)** — highest-confidence lever, and it's aimed squarely at the new/low-data member.
2. **The "goal + gap + action" framing rule** — applied to every headline metric on both pages.

---

## Open questions for you
1. Comfortable making the **single top insight** the thing a member sees first on the Dashboard (under the Journey card)? That's the biggest behavioural lever and the biggest change to the landing experience.
2. **Keep the month calendar on the Dashboard *and* the year heatmap on Stats**, or is that still too much calendar? (I think they're genuinely different jobs, but it's your call.)
3. How **competitive** do you want Stats to feel? I've pulled ranks/leaderboards entirely onto the Dashboard ("Standings") and kept Stats personal — but if you want Stats to also compare-to-others, that changes Zone 4.
4. Start with **Phase 1 only** (the two new Stats cards + the Dashboard "next move") so you can feel the behaviour-change win before we touch the layout?
