/* gen-glyphs.mjs - the notation the Note Recognition option cards use as icons.
 *
 * Engraved, because if it is notation LilyPond sets it. Each card shows the one
 * symbol its question is about and nothing else: a clef where the question is
 * which clef, a key signature where it is which mode, accidentals where it is
 * whether to include them.
 *
 * EACH GLYPH IS CROPPED TO ITS OWN INK, and that is the point. A music glyph is
 * anchored at its reference line - a treble clef at the G line, a bass clef at
 * the F line, an accidental at the note it alters - so glyphs padded to a
 * shared frame come out sitting at wildly different heights inside it: the bass
 * clef low, the treble high, the accidentals up in the top corner. Cropped to
 * ink, every viewBox IS the symbol, so setting one height renders them all the
 * same size and centring the box centres the symbol.
 *
 * The trade: LilyPond's true proportions are dropped. A bass clef really is
 * about half the height of a treble clef, and here it is not. As icons they
 * want to look like a set; on a stave they would want the real thing.
 *
 * The build prints each viewBox. There is nothing to keep in sync now - the
 * numbers are just the shapes, and the css sizes them.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIR = process.env.LY_DIR ||
  "/private/tmp/claude-501/-Users-matthewcawood-Piano-Practice-Daily/0e598060-a03f-4468-bf26-d021661a7bf9/scratchpad/ly";
mkdirSync(DIR, { recursive: true });

const mg = (n) => `\\musicglyph #"${n}"`;

const CHIPS = {
  /* The clef step. Mixed asks for both, so it shows both - and since the two
     single cards are rendered at the same height as each other, the pair has to
     be too, or the bass clef inside Mixed would not match the one on the Bass
     card. \magnify brings it to the treble clef's height; \raise then levels
     their centres, which the reference lines they are anchored at do not. */
  treble: mg("clefs.G"),
  bass:   mg("clefs.F"),
  mixed:  `\\concat { ${mg("clefs.G")} \\hspace #1.4 \\raise #2.7 \\magnify #2.1 ${mg("clefs.F")} }`,

  /* The mode step: a note to name, or a key signature to read it in. */
  note:   `\\note {8} #1`,
  keysig: `\\concat { \\raise #1.4 ${mg("accidentals.sharp")} \\hspace #0.3 ` +
          `\\raise #0.1 ${mg("accidentals.sharp")} \\hspace #0.3 ` +
          `\\raise #1.8 ${mg("accidentals.sharp")} }`,

  /* The accidentals step: the two it adds, or the sign for neither. */
  sharp:   `\\concat { ${mg("accidentals.sharp")} \\hspace #0.5 ${mg("accidentals.flat")} }`,
  natural: mg("accidentals.natural"),
};

const out = {};
for (const [id, body] of Object.entries(CHIPS)) {
  const f = join(DIR, "gl_" + id + ".ly");
  writeFileSync(f, `\\version "2.24.0"
\\header { tagline = ##f }
\\paper { indent = 0 oddFooterMarkup = ##f oddHeaderMarkup = ##f
         bookTitleMarkup = ##f scoreTitleMarkup = ##f }
\\markup { ${body} }
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
  out[id] = svg;
  const vb = (svg.match(/viewBox="([^"]*)"/) || [])[1].split(" ").map(Number);
  console.log(`${id.padEnd(9)} ${String(svg.length).padStart(5)}B  ` +
    `w ${vb[2].toFixed(2)}  h ${vb[3].toFixed(2)}  aspect ${(vb[2] / vb[3]).toFixed(2)}`);
}

writeFileSync(join(DIR, "glyphs.json"), JSON.stringify(out, null, 1));
console.log(`\n${Object.keys(out).length} glyphs, ` +
  `${(Object.values(out).reduce((n, s) => n + s.length, 0) / 1024).toFixed(1)}kB`);
