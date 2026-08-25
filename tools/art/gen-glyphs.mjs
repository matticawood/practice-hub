/* gen-glyphs.mjs — the music symbols used as icons in the tools.
 *
 * The option cards were drawing clefs and accidentals as characters from a
 * music font at whatever size the card gave them. A clef has enormous ascenders
 * and descenders relative to its font size, so the bass clef came out too large
 * and clipped, and every icon was a different visual size from the next.
 *
 * These are the real glyphs, engraved, each cropped to its own ink. As SVG they
 * scale to whatever box they are given and every one of them fills it the same
 * way, so the icon column is finally consistent.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIR = process.env.LY_DIR ||
  "/private/tmp/claude-501/-Users-matthewcawood-Piano-Practice-Daily/0e598060-a03f-4468-bf26-d021661a7bf9/scratchpad/ly";
mkdirSync(DIR, { recursive: true });

/* Every glyph is padded to the SAME box before cropping. Cropped to its own ink
   each one filled its icon slot regardless of how big it really is, so a treble
   clef - which is naturally about twice the height of a bass clef - came out
   looking smaller than one. Padded to a common frame, the SVGs all share a
   viewBox and their relative sizes are simply true.

   The clef box is tall because a treble clef is; the accidentals get a shorter
   one of their own, since forcing them into the clef's frame would shrink them
   to specks. Within each group the proportions are honest. */
const BOX = {
  clef: "#'(-0.2 . 4.4) #'(-5.4 . 6.6)",
  acc:  "#'(-0.2 . 2.6) #'(-2.4 . 2.6)",
};
const GLYPHS = {
  treble:  { g: '\\musicglyph #"clefs.G"', box: BOX.clef },
  bass:    { g: '\\musicglyph #"clefs.F"', box: BOX.clef },
  /* Mixed means both clefs, because that is what it plays. */
  mixed:   { g: '\\musicglyph #"clefs.G" \\hspace #0.4 \\musicglyph #"clefs.F"',
             box: "#'(-0.2 . 8.4) #'(-5.4 . 6.6)" },
  sharp:   { g: '\\musicglyph #"accidentals.sharp"',   box: BOX.acc },
  flat:    { g: '\\musicglyph #"accidentals.flat"',    box: BOX.acc },
  natural: { g: '\\musicglyph #"accidentals.natural"', box: BOX.acc },
};

const out = {};
for (const [id, spec] of Object.entries(GLYPHS)) {
  const f = join(DIR, "gl_" + id + ".ly");
  writeFileSync(f, `\\version "2.24.0"
\\header { tagline = ##f }
\\paper { indent = 0 oddFooterMarkup = ##f oddHeaderMarkup = ##f
         bookTitleMarkup = ##f scoreTitleMarkup = ##f }
\\markup { \\override #'(font-size . 6) \\pad-to-box ${spec.box} { ${spec.g} } }
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
  console.log(`${id.padEnd(9)} ${String(svg.length).padStart(5)}B  ratio ${(vb[2] / vb[3]).toFixed(2)}:1`);
}

writeFileSync(join(DIR, "glyphs.json"), JSON.stringify(out, null, 1));
console.log(`\n${Object.keys(out).length} glyphs, ` +
  `${(Object.values(out).reduce((n, s) => n + s.length, 0) / 1024).toFixed(1)}kB`);
