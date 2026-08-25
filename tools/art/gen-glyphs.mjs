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

const CHIPS = {
  /* The clef step. */
  treble: { m: mg("clefs.G") },
  bass:   { m: mg("clefs.F") },
  /* Mixed asks for both, so it shows both, at the same ratio to each other as
     the two single cards are to each other. */
  mixed:  { m: `\\concat { ${mg("clefs.G")} \\hspace #1.4 ` +
               `\\raise #${MIXED_RAISE} \\magnify #${MIXED_MAG} ${mg("clefs.F")} }` },

  /* The mode step: a note to name, or a key signature to read it in. */
  note:   { m: `\\note {8} #1` },
  keysig: { m: `\\concat { \\raise #1.4 ${mg("accidentals.sharp")} \\hspace #0.3 ` +
                `\\raise #0.1 ${mg("accidentals.sharp")} \\hspace #0.3 ` +
                `\\raise #1.8 ${mg("accidentals.sharp")} }` },

  /* The accidentals step: the two it adds, or the sign for neither. */
  sharp:   { m: `\\concat { ${mg("accidentals.sharp")} \\hspace #0.5 ${mg("accidentals.flat")} }` },
  natural: { m: mg("accidentals.natural") },
};

const out = {};
for (const [id, chip] of Object.entries(CHIPS)) {
  const f = join(DIR, "gl_" + id + ".ly");
  writeFileSync(f, `\\version "2.24.0"
\\header { tagline = ##f }
\\paper { indent = 0 oddFooterMarkup = ##f oddHeaderMarkup = ##f
         bookTitleMarkup = ##f scoreTitleMarkup = ##f }
\\markup { ${chip.m} }
`);
  execFileSync("lilypond", ["-dbackend=svg", "-dcrop", "-o", join(DIR, "gl_" + id), f], { stdio: "pipe" });
  let svg = readFileSync(join(DIR, "gl_" + id + ".cropped.svg"), "utf8");
  svg = svg
    .replace(/<\?xml[^>]*\?>\s*/g, "")
    .replace(/<!DOCTYPE[^>]*>\s*/g, "")
    .replace(/<style[\s\S]*?<\/style>\s*/g, "")
    .replace(/\s(width|height)="[^"]*"/g, "")
    .replace(/<svg /, '<svg aria-hidden="true" preserveAspectRatio="xMidYMid meet" ')
    .replace(/\s+/g, " ")
    .trim();

  const vb = (svg.match(/viewBox="([^"]*)"/) || [])[1].split(" ").map(Number);
  out[id] = svg;
  console.log(`${id.padEnd(9)} ${String(svg.length).padStart(5)}B  ` +
    `crop ${vb[2].toFixed(2)} x ${vb[3].toFixed(2)}`);
}

writeFileSync(join(DIR, "glyphs.json"), JSON.stringify(out, null, 1));
console.log(`\n${Object.keys(out).length} glyphs, ` +
  `${(Object.values(out).reduce((n, s) => n + s.length, 0) / 1024).toFixed(1)}kB`);
