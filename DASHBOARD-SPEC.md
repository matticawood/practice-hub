# Dashboard, the fixed spec

The reference for the redesign. Facts come from Matthew and are not negotiable.
Findings come from research and are not to be discarded when a fact corrects a
design. When those two collide it is almost always because I applied a finding
about FORM to a question of MECHANICS. Fix the application, keep the finding.

## 1 · What the page is for

They open the app to **log practice**. The reason to do it here rather than in
a notebook is that logging **registers**: the streak holds, the week fills, the
hours add up, the statue advances. Progression is the environment the act
happens in, not a section on the page.

It is the **first screen** a member lands on, and today it is the weakest page
in the app.

The dashboard is **not a directory of the app**. The reduction from the live
page was deliberate: the nav already reaches Tools, Learn, Live and Community.

## 2 · How the app actually works, FACTS

- **Overall level**, 8 stages, by TOTAL HOURS practised.
  `[0, 50, 150, 350, 700, 1200, 2000, 3500]`
  First Steps, Beginner, Foundations, Intermediate, Confident, Advanced,
  Performer, Artist.
- **Four areas**, Repertoire, Technique, Sight-reading, Musicianship.
  Each has its OWN independent level, also by hours logged in that area.
  They are **long-term and cumulative. They are not daily and they do not
  close.** Their purpose is **comparison**: to let a member spot a weakness in
  their playing or their practice strategy. An area can sit a stage behind the
  overall level.
- **Today's tasks**, five: a piece, sight-reading, scales, theory, and one
  practice tool. Pieces, scales and sight-reading are the substantial work;
  theory and the tools take negligible time.
  Tasks are **specific suggestions**. Area bars are **general**. A member can
  fill the Musicianship bar by doing theory their own way, or log a quick
  session with no piece named. The task is one route into the bar, never its
  definition.
- **Objectives**, ~16 per level, each tagged to an area. Unordered. Members
  chip at MANY in parallel over roughly 100 hours, in their own order and at
  their own priority. There is no "next one".
  Their purpose is **direction**: they tell a member what to aim for at this
  level. They must therefore be VISIBLE, not deferred until complete.
- **Log Practice** floats bottom-right on every page already.
- The **statue** is per level and is the app's one piece of real craft.

## 3 · What is settled

The top of the page is **approved and closed**: the level headline as the
distance to the next level, the statue, the ladder, Log practice, then the
streak with its week strip, then the weekly goal. On both phone and desktop.
Everything from Today downwards is the open problem.

## 4 · Research findings, KEEP THESE

| Finding | Source | What it governs |
|---|---|---|
| Light wins on legibility; the advantage GROWS as type shrinks | NN/g polarity | Dark is only defensible with **few objects and large type**. It is a constraint on density, not a licence. |
| A dark canvas makes coloured data read as content, not decoration | WHOOP | Why dark suits this page: the area colours, ladder and statue are the substance. |
| One instant read, then the trend, then the detail | WHOOP, Oura | The page has three layers, not one flat column. |
| A multidimensional score stops you neglecting a dimension | Apple rings | Why four areas exist at all. |
| Closure drives behaviour; and three dimensions render as ONE compact comparative glyph | Apple rings | **Form only.** The four areas want a single compact comparative shape. It does NOT mean making them daily, that was my error, and it contradicts §2. |
| Progress sits ON the object you act on | Duolingo | Suggestion and its area belong together visually. |
| Home is consumed with minimal cognitive processing; 3 daily quests | Duolingo | Today's five must be light, one line each, not a paragraph and two chips. |
| Motivation rises with proximity to a goal | Goal-gradient | Headline the DISTANCE, not the level name. |
| Autonomy, competence, relatedness | SDT | Relatedness is why the activity feed earns a place. |
| Streaks and ranking run on introjected regulation | SDT | Present them, never weaponise them. |
| 2–3 layers max on mobile before context is lost | Progressive disclosure | Sixteen objectives cannot all be on the home screen. |
| Group by proximity; a rule only at a real boundary | Gestalt | One rule per chapter, none between rows of a list. |

## 5 · Decisions that follow, and that do not get re-litigated

1. Near-black ground, few objects, large type.
2. Three layers: **where you stand** → **what to do now** → **where you are
   heading**.
3. **Areas**: one compact comparative block, not four stacked bars in a list.
   The instrument has to make the odd one out obvious without the member doing
   the comparison themselves, and it needs a plain-English sentence naming the
   weakness so it explains itself on day one. Long-term hours. Never daily.
4. **Today**: five items, one line each. Three substantial, two quick, and they
   should not read as five identical rows.
5. **Objectives**: visible, grouped under the same four area names so the
   weakness block and the direction list share one vocabulary. Not all sixteen.
6. **Colour means area.** Nothing else on the page gets a hue.
7. No mono. Figures in Fraunces, labels in the sans.
8. One rule per chapter, none between rows.

## 5a · Vary the instrument, not the language

The single most useful principle to come out of the section mock, and it came
from Matthew looking at Progress:

> Each section is visually distinct in form while keeping the same visual
> language, which makes it easy to follow.

Every section takes the form its data actually needs, a trend wants a chart, a
habit wants a heat map, discrete facts want a figure grid, a breakdown wants
ranked bars, a comparison wants columns on one shared scale, a journey wants a
spine. They cohere because the type, the colour, the spacing and the rules
never change.

Two failure modes, and I have committed both:

- **Varying the language.** Light grounds, different card systems, borrowed
  treatments. This destroys coherence and is what made the early dashboards
  look like different products bolted together.
- **Repeating one form.** Rows, rows, rows, with hierarchy attempted through
  size alone. This is what made every version read as a mess: a page of
  identical rows gives the eye no landmarks, so it cannot be navigated or
  remembered.

Test for any section: *what is this data, and what instrument shows it?* If the
answer is "a row with a bar" for the fourth time on one page, it is wrong.

## 5b · The two questions, in order

Before proposing any element, and before presenting any change:

1. **Does it matter functionally?** Does it change what the member does, or
   what they know? If not, it goes, and the second question never arises.
2. **Does it work in place?** Render it and look at it in context, not at the
   argument for it in prose.

Arguing a third thing instead of these two is how bad elements get built. The
theory lesson's duration was defended on whether the number was TRUE, which is
neither question: knowing a lesson takes four minutes does not change whether
you do it, and one figure in a set of five reads as an error.

The same pair would have caught the pips (duplicated "1 of 5"), the progress
ladder on Pieces (measured nothing), the box drawn around the tick (a decision
made visible that was not a decision) and every glow on the page.

Corollary: a rule that needs an exception in the same breath is a rule not
believed. "Width is weight, not minutes, except the lesson" was that.

## 6 · Open

- **Achievements presentation.** They now live on Progress, but how they are
  shown is not right yet, on Progress or in the room feed. Needs its own pass.
- **The room's length.** With posts interleaved it will grow. Cap it at about
  five combined items on the dashboard and let the full feed carry the rest,
  or it quietly becomes the longest thing on the page.

- How many objectives to show, and chosen how, given there is no "next one"
  and members work on many at once.
- Whether the desktop puts the day's five and the direction side by side.
