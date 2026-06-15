# Sight Reading Studio

Local tool to generate, check, correct, and bank ABRSM-style sight-reading exercises
for **Book 2** (Grades 2, 3, 4 — 120 each). One engine (LilyPond) drives both the
on-screen preview and the final book, so what you approve is exactly what prints.

## Run it

```bash
cd sr-studio
node server.mjs
```

Then open **http://localhost:7700**.

Requires LilyPond on PATH (`brew install lilypond`) and Node. No other dependencies.

## The loop

1. Pick a **grade** (top of the page). Each shows progress, e.g. `Grade 2 — 14/120`.
2. **New candidate** generates a fresh exercise. Every candidate is pre-validated, so it
   already passes the rules; you mostly just review.
3. The **report** is green (passes everything) or lists issues in red.
4. To **correct** anything, edit the Right/Left hand text or the key/time/tempo fields and
   press **Apply edits** — it re-renders and re-validates instantly.
5. **Approve & bank** saves it (only if it passes all checks) and loads the next. **Skip**
   discards. The bank list on the right lets you **view** or **✕ remove** banked ones.

Your bank is stored in `bank/grade2.json`, `grade3.json`, `grade4.json` — commit these to
keep your progress.

## Note text format

`PITCH[:DUR][marks]`, notes space-separated, `|` optional bar hints.

- Pitch: `E4`, `F#4`, `Bb3`, chord `C4+E4`, rest `R`
- Duration: `:2` half · `:1` quarter (default) · `:.5` eighth · `:1.5` dotted-quarter · `:4` whole · `:3` dotted-half · `:.25` sixteenth
- Marks (append, any order): `.` staccato · `_` tenuto · `^` accent · `(` `)` slur · `<` cresc · `>` dim · `!` hairpin-end · `{mp}` dynamic

Example: `E4:1{mp}<( G4 E4 C4) | F4:2 D4:2`

## What the validator checks

Length (grade bar-count), five-finger range, fingering (finger 5 on the lowest LH note;
start finger by scale-step), no parallel 5ths/8ves, no harsh clashes, articulation matched
between hands when they share a beat+duration, staccato only on short notes, a dynamic present,
correct key spelling.

## Export the book

When a grade's 120 are banked:

```bash
node export-book.mjs 2     # -> book-grade2.pdf
```

## Files

- `engine.mjs` — note model, validator, LilyPond emitter, text parse/serialize
- `generator.mjs` — per-grade composer (chord-led + rejection sampling)
- `server.mjs` — local server + LilyPond rendering + the bank
- `index.html` — the UI
- `export-book.mjs` — typeset a banked grade to PDF
- `bank/` — your approved exercises

## Status / known limits

- **Grade 2** is solid (fixed five-finger, the proven generator).
- **Grades 3 & 4** generate valid, reviewable exercises with the correct parameters
  (keys, metres, 8-bar length, 2-note chords, compound time), but the musical sophistication
  is more basic and will improve with tuning — review and edit as you go.
- Left-hand textures: broken chord, root-fifth, block (G3+), sustained. More to come.
