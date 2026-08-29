# Design vocabulary

The app is large enough that the same element gets built more than once, in
different places, months apart. When that happens by eye the second one is
always slightly different, and enough slightly-differents make a big app feel
assembled rather than designed.

**The rule: before styling anything that already exists somewhere else, find it,
measure it, and reuse the values. Do not approximate them.** If a treatment
needs to change, change it in the shared rule so every use changes with it.

**The source is the mock, not the build.** `_practice-section-mock.html` and
`_dashboard-mock.html` are where these decisions were made. Reading values off
whatever is currently live canonises whatever drifted in last. Where the build
and the mock disagree, the mock wins unless the divergence was a deliberate
decision, and the deliberate ones are listed at the bottom of this file.

Values below are the mock's, confirmed against the build. Where a treatment is
used in more than one place, the selectors are listed together so they can be
kept in one rule.

---

## Chapter head

The heading that opens a section, with a rule above it and a short bar beside
it. Used by the dashboard's Today / Where to focus / Continue learning /
Community, the roadmap's Your four areas / Aiming for / The eight levels, and
the goals panel's Weekly Goal / Goals.

| | |
|---|---|
| family | Fraunces, Georgia, serif |
| size | 1.5rem (24px) |
| weight | 700 |
| letter-spacing | -.02em |
| line-height | 1 |
| bar | `::before`, 3px wide x 1.5em tall, radius 3px, `#4a4a56` on the dark ground |
| rule above | 1px, the ground's line colour |
| padding | 26px above the words, 16px below |
| margin-top | 18px |
| first in a column | no rule, no top padding, no top margin |

Mock: `.sec.big` in `_practice-section-mock.html`.
Selectors: `.dash-band-head`, `#roadmap-content .rmp-head`, `#gm-body .wg-header`
with `.wg-title`.

A section that is a label rather than a chapter uses the small variant: `.sec`,
800 .74rem/1, .13em, uppercase, in 50% of the category colour mixed toward white.

## Category label

The small coloured word naming an area, a practice type or a goal's category.
Used on the dashboard's Today rows, the roadmap's objectives, and the goals
panel's rows.

| | |
|---|---|
| size | .66rem (10.56px) |
| weight | 800 |
| letter-spacing | .12em |
| line-height | 1.25 (the mock's 1 assumes it never wraps; these can) |
| transform | uppercase |
| colour | the category's own colour, adjusted for the ground |

The colours were chosen against a light card, so neither raw value clears 4.5:1
on both grounds. On the dark pages mix 82% toward `#fff`; on the white panel mix
78% toward `#000`.

Mock: `.obg` in `_practice-section-mock.html`.
Selectors: `.dday-card-cat-txt`, `#roadmap-content .rmp-objs .rmp-tag`,
`#gm-body .pg-tag`.

## Counts and status chips

The small figure at the right of a row: "0/12 lessons", "7 days to go",
"0m / 20h".

- Radius **7px**, never a pill. A 99px radius on a 22px box is a lozenge.
- Font .66rem, weight 700, `font-variant-numeric: tabular-nums`.
- One width per list, measured from the widest count actually present, so the
  column is straight without shortening anyone's units.
- On a dark ground the chip's field is `rgba(255,255,255,.07)`.
- Where a status has two registers, the reading goes on top and the fact under
  it in a smaller, dimmer size. Not two places in the row.

## The count beside a chapter head

The small figure to the right of a chapter's name: "last 12", "0 of 13",
"28 days".

.86rem, weight **600**, `#93939e`, with a 4px dot at 55% opacity between it and
the heading. The mock sets 700 (`.sec.big em`); the build settled on 600 on the
roadmap and Progress follows it, so the same figure beside the same heading
reads the same on both pages.

## The link out of a section

"All goals", "Browse all courses", "View full feed", "Open the full history",
"See it on your roadmap". Every one of these leaves for somewhere else, and the
dashboard sets all three of its own identically:

| | |
|---|---|
| size | .78rem |
| weight | 700 |
| colour | `#93939e`, lifting to `#f4f4f6` on hover |
| after the words | a space and `→` |

Not gold. Gold is reserved for your practice and for the thing to press *here*;
a link that takes you off the page is neither, and the dashboard settled this
across three instances before Progress existed. This is separate from **"Show
all"**, which is gold, because that one expands the list in place rather than
leaving.

## The four areas

One set of names and one set of colours, taken from the roadmap's `AREA` map,
which is what the roadmap paints its comparison plot from:

| area | name | colour |
|---|---|---|
| repertoire | Repertoire | `#f5c518` |
| technique | Technique | `#6366f1` |
| sight_reading | Sight-reading | `#10b981` |
| musicianship | Musicianship | `#a855f7` |

The mock names them Pieces & books, Scales & technique and Theory & ear, which
read better on their own. They are not used: the page links to the roadmap, and
the same four things under two sets of names across one tap is worse than a
plainer name. `#d99e12` is the repertoire colour on the **light** goals list
only; on the dark pages repertoire is `#f5c518`.

**A share is a share of something nameable.** `_rmTrackMinutes().total` counts
every logged item but only files an item into an area if its type maps to one,
so the four areas measured against the total came to 82% with no way to say
what the other 18% was. Percentages are of the four areas' own sum.

## Buttons

| | |
|---|---|
| primary | gold `#f5c518`, ink `#3f2d00`, radius 12px on a full-width action, 9px in a form |
| secondary | white field, 1px line, radius 9px |
| icon button | 30x30, 1px line, radius 7px |
| labelled icon button | 30 tall, 11px side padding, 7px gap, radius 7px |

Icon buttons are `inline-flex`, never `grid`: a grid stacks the icon above the
word and bursts the box.

**Two traps that make a control look foreign, both of them silent:**

1. `font: 700 .76rem/1 inherit` is **invalid**. The `font` shorthand needs a real
   family and will not take `inherit`, so the browser drops the whole
   declaration and the element falls back to its default size and weight. Use
   longhand: `font-weight`, `font-size`, `line-height`. Twelve rules in
   practice-log.html were dead this way, including most of the goals panel's
   form controls.
2. A `<button>`, `<input>`, `<select>` or `<textarea>` **does not inherit the
   page's typeface**. Set `font-family: inherit` on them, or they draw
   themselves in the system default, which is how one link's arrow came out in
   a different face from the identical arrow beside it.

## Nothing is in a box

The three dark pages put nothing in a card. A section is a rule, a heading, and
rows on the page itself. No fills, no rounded containers, no icon squares.

A block brought in from the old stats page must be flattened before it is shown
here: `background: transparent`, `border: 0`, `border-radius: 0`, no side
padding of its own. A grid of figures inside it takes the page's tile treatment
instead: a hairline above each cell, one down the middle, no gap and no fill.

**One gutter.** Everything on the page starts on `--dgut`, and the only things
allowed past it are a heading's own bar and text indented under an icon. The old
page inset its blocks by a further 16px on a phone, as padding on some and as a
negative margin on others, so a moved block sat 16px right of every native row
beside it. The slot carries the gutter; the block carries none.

## Rules, corners and ground

- One hairline between rows, none inside a row, one rule per chapter.
- Hairlines sit **between** rows, with equal air above and below. A rule drawn
  on a row's own top edge with no padding under it squashes the words against it.
- Corners: 7px on chips and small controls, 9px on inputs and form buttons,
  12px on a full-width action, 20px on a panel.
- Row hover is a neutral lift, never gold. Gold means your practice and the
  thing to press. The highlight must bleed past the row on both sides, or the
  first and last elements in the row sit on its edge and read as sliced.

## Grounds and variables

`#app-main` remaps `--surface`, `--surface-2`, `--border`, `--text-muted` for
the dark pages. Anything built from those variables **while inside `#app-main`**
comes out with the dark values, which is why modals built there render
transparent. Move a panel to `document.body` before showing it, or state its
colours outright.

**`--text` and `--text-main` are the ones that were missed.** `body.hub-mode`
sets both to `#1a1410` for the cream ground. The dark pages remapped
`--surface`, `--border` and `--text-muted` and left those two alone, because
everything on them was rebuilt from scratch and stated its own colour. The
moment an existing component is shown on a dark page it inherits near-black
text on a near-black ground and is invisible rather than merely unstyled. That
was the Sessions, Achievements and Ranks chips, and it was every block moved
into Progress. `body.lb-prog #app-main` remaps `--text`, `--text-main` and
`--accent-dark` for exactly this reason.

**Move the element, do not rewrite the analysis.** Progress shows the old stats
page's blocks by moving the nodes into its own chapters. Their ids travel with
them, so every renderer that fills them by id goes on working; re-rendering the
page hands them back to their original parent first, or the next `innerHTML`
would delete them from the document for good. A second implementation of the
same analysis is how the hero came to say 35 hours while the roadmap said 335.

Never build a track, a field or a border from a variable without checking which
value it will resolve to on the page you are on. The ladder's empty segments
were invisible on the dashboard and correct on the roadmap for exactly this
reason: same rule, two different `--border`s.

## Contrast

WCAG AA: 4.5:1 for normal text, 3:1 for large text and for interface parts that
carry meaning, such as an unchecked tick circle.

Audit with everything **open**: expand every "Show all", every drop-down, every
collapsed panel first. An audit of the default state is not an audit.

## Deliberate divergences from the mock

**The mock is not the only source.** Decisions made in conversation override it,
and an audit that reads only the mock will report those decisions as drift. They
are recorded here with the reason, so the next audit reads both.

### Decided in conversation

- **The eight levels are not the mock's spine.** The mock has "3 · Foundations"
  with a plain grey "Done / Here / 190 h away". The build shows a LEVEL N
  eyebrow, the name, the hours band and the grade on its own line, and the
  status as a square-cornered pill: DONE, YOU ARE HERE in gold, or "365 hours
  away". Asked for directly: the distance to a level is more use than the word
  Locked, and the current level is picked out in gold as the mock does for its
  name.
- **The ladder's current segment fills to where you have got to, and carries a
  gold ring.** The mock fills it solid. Solid said you had finished the level
  you are standing in.
- **The ladder's empty segments are light** (53% white), not the mock's `#232329`.
  The dark ones were invisible on the dashboard's ground.
- **Pills are square-cornered, 7px**, matching the Log practice button. Applies
  to the counts, the level statuses and the Complete / Locked marks.
- **The hero eyebrow is grey, not the mock's gold.** Gold means your practice
  and the thing to press; an eyebrow is neither.
- **Today's task titles are in the sans, not the mock's Fraunces 17px.** Settled
  over several rounds on the dashboard.
- **Objectives are one list in order of importance with a category tag per row**,
  not grouped under headings. Grouping threw away the importance order and made
  the capped list show rows chosen by group rather than by how much they matter.
- **Row hover is a neutral lift, never gold**, and the highlight bleeds past the
  row on both sides.
- **Goals is a panel over the page, not a tab**, and the Goals tab is gone from
  the sub-nav. The dashboard shows the weekly goal and at most two of your own.
- **Levels, not stages. Hours spelled out.**

### Decided while building

- **"Show all" is gold; the mock has it grey** (`.more`, `#b4b0ba`). It is a
  control.
- **Ticks are round; the mock draws rounded squares** (`.ob i`). Every other tick
  in the app is round and these rows reuse the app's own component. The
  dashboard's Today boxes do follow the mock: 24px, radius 7, 1.5px.
- **Progress bars use radius 3px; the mock uses 4px** on a 6px bar, which rounds
  a small fill into a dot.
- **Category colours are adjusted per ground.** The mock only ever sits on one.
- **The goals panel is a list; the mock has two tiles** (`.tgt`). Two tiles do
  not survive a member with ten goals.

## Words

Levels, not stages. Hours spelled out, not "h". No emojis, no em dashes, no
"meet"/"met", no cheesy analogies.
