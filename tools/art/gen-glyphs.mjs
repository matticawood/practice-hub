/* gen-glyphs.mjs - the notation the Note Recognition option cards use as icons.
 *
 * Engraved, because if it is notation LilyPond sets it. Each card shows the one
 * symbol its question is about and nothing else: a clef where the question is
 * which clef, a key signature where it is which mode, accidentals where it is
 * whether to include them. Anything more is a symbol to read past.
 *
 * THE SIZING. Every glyph is padded to the SAME BOX before cropping. Cropping
 * trims to ink, so a box smaller than the ink gets expanded and a box larger
 * than it is kept - glyphs that overflowed ended up in a different frame from
 * ones that fitted, and no per-glyph pixel height could reconcile them, because
 * the frames themselves disagreed. That was the bug behind clefs that were
 * every size but the right one. One frame nothing overflows, and a single css
 * height renders the whole set at its true proportions: a bass clef comes out
 * around half the height of a treble clef because it is.
 *
 * The build prints each viewBox. Heights must all match; if one does not, its
 * ink has outgrown BOX_Y and the frame needs raising. Never answer a mismatch
 * with a per-glyph pixel value.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIR = process.env.LY_DIR ||
  "/private/tmp/claude-501/-Users-matthewcawood-Piano-Practice-Daily/0e598060-a03f-4468-bf26-d021661a7bf9/scratchpad/ly";
mkdirSync(DIR, { recursive: true });

/* Deep enough for a treble clef, which overhangs everything else here. Width is
   per-glyph, because a pair of clefs is legitimately wider than one. */
const BOX_Y = "#'(-4.3 . 4.3)";

const at = (size) => (w, m) => ({ w, body: `\\override #'(font-size . ${size}) { ${m} }` });
/* A clef is drawn far larger than an accidental, so the two families are set at
   sizes that put them in the same frame. Within each, the proportions are
   LilyPond's own. */
const clef = at(-1.0);
const sym  = at(2.6);
const mg   = (n) => `\\musicglyph #"${n}"`;

const CHIPS = {
  /* The clef step. Mixed asks for both, so it shows both, set close enough to
     read as one symbol rather than two. */
  treble: clef(2.5, mg("clefs.G")),
  bass:   clef(2.7, mg("clefs.F")),
  mixed:  clef(5.7, `\\concat { ${mg("clefs.G")} \\hspace #0.35 ${mg("clefs.F")} }`),

  /* The mode step: a note to name, or a key signature to read it in. */
  note:   sym(2.88, `\\note {8} #1`),
  keysig: sym(5.4, `\\concat { \\raise #1.4 ${mg("accidentals.sharp")} \\hspace #0.3 ` +
                   `\\raise #0.1 ${mg("accidentals.sharp")} \\hspace #0.3 ` +
                   `\\raise #1.8 ${mg("accidentals.sharp")} }`),

  /* The accidentals step: the two it adds, or the sign for neither. */
  sharp:   sym(3.9, `\\concat { ${mg("accidentals.sharp")} \\hspace #0.5 ${mg("accidentals.flat")} }`),
  natural: sym(1.9, mg("accidentals.natural")),
};

const out = {};
let refH = null;
for (const [id, chip] of Object.entries(CHIPS)) {
  const f = join(DIR, "gl_" + id + ".ly");
  writeFileSync(f, `\\version "2.24.0"
\\header { tagline = ##f }
\\paper { indent = 0 oddFooterMarkup = ##f oddHeaderMarkup = ##f
         bookTitleMarkup = ##f scoreTitleMarkup = ##f }
\\markup { \\pad-to-box #'(-0.1 . ${chip.w}) ${BOX_Y} { ${chip.body} } }
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
  if (refH === null) refH = vb[3];
  const bad  = Math.abs(vb[3] - refH) > 0.01 ? "  <-- HEIGHT DIFFERS, raise BOX_Y" : "";
  const over = Math.abs(vb[2] - (chip.w + 0.1)) > 0.01 ? `  <-- ink wider than w, use ${(vb[2] - 0.1).toFixed(2)}` : "";
  console.log(`${id.padEnd(9)} ${String(svg.length).padStart(5)}B  ` +
    `w ${vb[2].toFixed(2)}  h ${vb[3].toFixed(2)}${bad}${over}`);
}

writeFileSync(join(DIR, "glyphs.json"), JSON.stringify(out, null, 1));
console.log(`\n${Object.keys(out).length} chips, ` +
  `${(Object.values(out).reduce((n, s) => n + s.length, 0) / 1024).toFixed(1)}kB`);
