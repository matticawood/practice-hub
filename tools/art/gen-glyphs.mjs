/* gen-glyphs.mjs - the notation the Note Recognition option cards use as icons.
 *
 * Engraved, because if it is notation LilyPond sets it. Each card shows the one
 * symbol its question is about and nothing else.
 *
 * EACH GLYPH IS CROPPED TO ITS OWN INK. A music glyph is anchored at its
 * reference line - a treble clef at the G line, a bass clef at the F line, an
 * accidental at the note it alters - so glyphs padded to a shared frame come
 * out sitting at wildly different heights inside it: the bass clef low, the
 * treble high, the accidentals up in the top corner. Cropped, the viewBox IS
 * the symbol, so one css height sizes them all and centring the box centres the
 * symbol.
 *
 * FILL IS WHERE THE RATIO LIVES. Cropping alone renders every glyph at the same
 * height, and that is wrong for the clefs: a treble clef is tall and narrow, a
 * bass clef squat and wide, so at equal height the bass has twice the ink and
 * reads as the larger of the two. LilyPond's real ratio is about 2:1, but that
 * is a ratio for glyphs standing on a stave; alone in a row the bass clef just
 * looks shrunken. So `fill` says what fraction of its frame a glyph occupies -
 * the frame is grown around the ink and the ink stays centred in it - and the
 * clef ratio is one number, in one place, chosen by eye rather than fallen into.
 *
 * A composite glyph carries the same ratio internally: the bass clef inside
 * Mixed is magnified to the same fraction of the treble clef beside it, so it
 * matches the one on the Bass card.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIR = process.env.LY_DIR ||
  "/private/tmp/claude-501/-Users-matthewcawood-Piano-Practice-Daily/0e598060-a03f-4468-bf26-d021661a7bf9/scratchpad/ly";
mkdirSync(DIR, { recursive: true });

const mg = (n) => `\\musicglyph #"${n}"`;

/* The bass clef is drawn at 0.66 of a treble clef's height. Equal height makes
   it the heavier of the two, since it is squat where the treble is narrow;
   LilyPond's own ~0.48 makes it look shrunken with no stave to stand on. The
   single Bass card gets that fraction applied in the page (NR_GLYPH_FILL),
   where the real ink can be measured; here it only has to be built into Mixed,
   so the pair carries the same ratio the two single cards do.
   MIXED_MAG brings a bass clef to 0.66 of a treble clef's height; MIXED_RAISE
   then levels their centres, which their reference lines do not. */
const MIXED_MAG  = 1.575;   /* bass to 0.66 of the treble clef's INK height */
const MIXED_RAISE = 1.91;   /* levels their ink centres, measured on the page */

/* Fixed stave width from the paper's line-width, notes centred by a skip at
   each end. The shared frame is applied after engraving - see RANGE_GROUP. */
/* Same construction as a range chip, in its own group so the chord shapes are
   sized against each other rather than against a stave with one note on it. */
const chordChip = (music) => Object.assign(rangeChip(music), { group: "chord" });

const rangeChip = (music) => ({
  group: "range",
  m: `\\score { \\new Staff \\with {
        \\remove "Time_signature_engraver" \\remove "Bar_engraver"
        %% The clef is HIDDEN, not removed. Removing the engraver takes the
        %% clef's POSITIONING with it, so the staff falls back to a neutral
        %% middle C and pitches that should sit on ledger lines land in the
        %% spaces instead - the ledger card had no ledger lines on it.
        \\override Clef.stencil = ##f
        \\override Clef.X-extent = #'(0 . 0) }
      { \\clef treble \\override Staff.Stem.transparent = ##t s4 ${music} s4 }
      \\layout { indent = 0
        \\context { \\Score
          %% Two notes plus the skips did not fit the fixed line-width, so the
          %% music broke onto a SECOND system and the crop caught both staves
          %% stacked - which is why the shared frame came out three times the
          %% height of a stave and drew all three of them tiny.
          \\override NonMusicalPaperColumn.line-break-permission = ##f } } }`,
});

const CHIPS = {
  /* The clef step. */
  treble: { m: mg("clefs.G") },
  bass:   { m: mg("clefs.F") },
  /* Mixed asks for both, so it shows both, at the same ratio to each other as
     the two single cards are to each other. */
  mixed:  { m: `\\concat { ${mg("clefs.G")} \\hspace #1.4 ` +
               `\\raise #${MIXED_RAISE} \\magnify #${MIXED_MAG} ${mg("clefs.F")} }` },

  /* The mode step: a note to name, or a key signature to read it in. */
  /* Engraved, not the \note markup: that composes a notehead, a stem and a
     flag as three pieces of markup, and at icon size the join reads as a gap -
     the note looked like it had lost its stem. A real staffless note is one
     drawing. */
  note:   { m: `\\score { \\new Staff \\with {
                  \\remove "Staff_symbol_engraver" \\remove "Time_signature_engraver"
                  \\remove "Bar_engraver" \\remove "Clef_engraver" }
                { \\cadenzaOn \\stemUp b'8 } \\layout { indent = 0 ragged-right = ##t } }` },
  keysig: { m: `\\concat { \\raise #1.4 ${mg("accidentals.sharp")} \\hspace #0.3 ` +
                `\\raise #0.1 ${mg("accidentals.sharp")} \\hspace #0.3 ` +
                `\\raise #1.8 ${mg("accidentals.sharp")} }` },

  /* The range step. These three ARE about the stave, so unlike the others they
     show one - no clef, because which clef is the question one row above.

     They are the only chips built to a FIXED FRAME rather than cropped to their
     own ink. A crop sizes each drawing by its own contents, so the single-note
     stave came out drawn larger than the one carrying notes above and below,
     and the three could not be compared - which is the whole job of that row.
     One line-width and one box means one stave, at one size, three times.
     A skip either side centres whatever sits between them. */
  rstave:  rangeChip("b'1"),
  rledger: rangeChip("a''1 c'1"),
  rfull:   rangeChip("b'1 a''1"),

  /* CHORD RECOGNITION. Its first two rows are both about the shape of a stack,
     so all five are one set at one stave size: three notes against four, and
     then the same three notes rearranged. No clef - which clef is its own row,
     as it is in Note Recognition. */
  ctriad:   chordChip("<e' g' b'>1"),
  cseventh: chordChip("<e' g' b' d''>1"),
  croot:    chordChip("<e' g' b'>1"),
  cinv:     chordChip("<g' b' e''>1"),
  cspread:  chordChip("<e' b' g''>1"),

  /* The accidentals step: the two it adds, or the sign for neither. */
  sharp:   { m: `\\concat { ${mg("accidentals.sharp")} \\hspace #0.5 ${mg("accidentals.flat")} }` },
  natural: { m: mg("accidentals.natural") },
};

const out = {}, boxes = {}, groups = {};
for (const [id, chip] of Object.entries(CHIPS)) {
  const f = join(DIR, "gl_" + id + ".ly");
  writeFileSync(f, `\\version "2.24.0"
\\header { tagline = ##f }
\\paper { indent = 0 line-width = 22\\mm ragged-right = ##f
         oddFooterMarkup = ##f oddHeaderMarkup = ##f
         bookTitleMarkup = ##f scoreTitleMarkup = ##f }
\\markup { ${chip.m} }
`);
  execFileSync("lilypond", ["-dbackend=svg", "-dcrop", "-o", join(DIR, "gl_" + id), f], { stdio: "pipe" });
  let svg = readFileSync(join(DIR, "gl_" + id + ".cropped.svg"), "utf8");
  svg = svg
    .replace(/<\?xml[^>]*\?>\s*/g, "")
    .replace(/<!DOCTYPE[^>]*>\s*/g, "")
    .replace(/<style[\s\S]*?<\/style>\s*/g, "")
    /* Strip width/height from the <svg> TAG ONLY, so css can size it. Run over
       the whole document this also stripped them from every <rect> - and
       LilyPond draws ledger lines as rects, so they were rendering zero by zero
       and the ledger card silently had no ledger lines on it. */
    .replace(/<svg\b[^>]*>/, (tag) => tag.replace(/\s(width|height)="[^"]*"/g, ""))
    .replace(/<svg /, '<svg aria-hidden="true" preserveAspectRatio="xMidYMid meet" ')
    .replace(/\s+/g, " ")
    .trim();

  const vb = (svg.match(/viewBox="([^"]*)"/) || [])[1].split(" ").map(Number);
  out[id] = svg;
  boxes[id] = vb;
  if (chip.group) (groups[chip.group] = groups[chip.group] || []).push(id);
  console.log(`${id.padEnd(9)} ${String(svg.length).padStart(5)}B  ` +
    `crop ${vb[2].toFixed(2)} x ${vb[3].toFixed(2)}`);
}

/* A grouped set shares ONE frame: the union of the members' own crops. They are
   engraved in the same coordinates - same stave, same width, same origin - so
   the union aligns them exactly, and rendering the group at one height then
   draws one stave at one size in all of them. Cropping each to its own ink
   would instead size each drawing by its contents, which is what made the
   single-note stave come out larger than the one carrying notes above and
   below - and comparing them is the entire job of that row. */
for (const [name, ids] of Object.entries(groups)) {
  const x0 = Math.min(...ids.map((i) => boxes[i][0]));
  const y0 = Math.min(...ids.map((i) => boxes[i][1]));
  const x1 = Math.max(...ids.map((i) => boxes[i][0] + boxes[i][2]));
  const y1 = Math.max(...ids.map((i) => boxes[i][1] + boxes[i][3]));
  const box = [x0, y0, x1 - x0, y1 - y0].map((n) => n.toFixed(4)).join(" ");
  ids.forEach((i) => { out[i] = out[i].replace(/viewBox="[^"]*"/, `viewBox="${box}"`); });
  console.log(`\ngroup ${name}: ${ids.join(", ")} share ${(x1-x0).toFixed(2)} x ${(y1-y0).toFixed(2)}`);
}

writeFileSync(join(DIR, "glyphs.json"), JSON.stringify(out, null, 1));
console.log(`\n${Object.keys(out).length} glyphs, ` +
  `${(Object.values(out).reduce((n, s) => n + s.length, 0) / 1024).toFixed(1)}kB`);
