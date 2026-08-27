# Design vocabulary

The app is large enough that the same element gets built more than once, in
different places, months apart. When that happens by eye the second one is
always slightly different, and enough slightly-differents make a big app feel
assembled rather than designed.

**The rule: before styling anything that already exists somewhere else, find it,
measure it, and reuse the values. Do not approximate them.** If a treatment
needs to change, change it in the shared rule so every use changes with it.

Measured values below are the current canonical ones. Where a treatment is used
in more than one place, the selectors are listed together so they can be kept in
one rule.

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
| letter-spacing | -.022em |
| line-height | 1 |
| bar | `::before`, 3px x 36px, 22% of the ink colour |
| rule above | 1px, the ground's line colour |
| padding | 28px above the words, 16px below |
| margin-top | 18px |
| first in a column | no rule, no top padding, no top margin |

Selectors: `.dash-band-head`, `#roadmap-content .rmp-head`, `#gm-body .wg-header`
with `.wg-title`.

## Category label

The small coloured word naming an area, a practice type or a goal's category.
Used on the dashboard's Today rows, the roadmap's objectives, and the goals
panel's rows.

| | |
|---|---|
| size | .64rem (10.24px) |
| weight | 800 |
| letter-spacing | .09em |
| line-height | 1.25 |
| transform | uppercase |
| colour | the category's own colour, adjusted for the ground |

The colours were chosen against a light card, so neither raw value clears 4.5:1
on both grounds. On the dark pages mix 82% toward `#fff`; on the white panel mix
78% toward `#000`.

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

## Buttons

| | |
|---|---|
| primary | gold `#f5c518`, ink `#3f2d00`, radius 12px on a full-width action, 9px in a form |
| secondary | white field, 1px line, radius 9px |
| icon button | 30x30, 1px line, radius 7px |
| labelled icon button | 30 tall, 11px side padding, 7px gap, radius 7px |

Icon buttons are `inline-flex`, never `grid`: a grid stacks the icon above the
word and bursts the box.

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

Never build a track, a field or a border from a variable without checking which
value it will resolve to on the page you are on. The ladder's empty segments
were invisible on the dashboard and correct on the roadmap for exactly this
reason: same rule, two different `--border`s.

## Contrast

WCAG AA: 4.5:1 for normal text, 3:1 for large text and for interface parts that
carry meaning, such as an unchecked tick circle.

Audit with everything **open**: expand every "Show all", every drop-down, every
collapsed panel first. An audit of the default state is not an audit.

## Words

Levels, not stages. Hours spelled out, not "h". No emojis, no em dashes, no
"meet"/"met", no cheesy analogies.
