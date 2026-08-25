/* gen-notes.mjs — engrave the Note Recognition question set.
 *
 * The game draws its stave by hand: five <line>s in an inline SVG plus glyph
 * paths, sized into a 220x115 viewBox. That is the thing the standing rule is
 * against — if it is notation, LilyPond sets it.
 *
 * It can be, because the question set is FINITE. A question is a clef, a
 * letter, an octave and an accidental, so every one of them can be engraved
 * ahead of time and picked at random at play time. Nothing is rendered in the
 * browser; the page holds a map of ready SVGs.
 *
 * This run is the sample the mock uses. The full set is the same loop over the
 * whole range, which is a few hundred files and about the same again in kB.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIR = process.env.LY_DIR ||
  "/private/tmp/claude-501/-Users-matthewcawood-Piano-Practice-Daily/0e598060-a03f-4468-bf26-d021661a7bf9/scratchpad/ly";
mkdirSync(DIR, { recursive: true });

const paper = `\\version "2.24.0"
\\header { tagline = ##f }
\\paper {
  indent = 0
  line-width = 42\\mm
  oddFooterMarkup = ##f
  oddHeaderMarkup = ##f
  bookTitleMarkup = ##f
  scoreTitleMarkup = ##f
  page-breaking = #ly:one-line-breaking
}
`;

const one = (clef, note) => `\\score { \\new Staff \\with {
    \\remove "Time_signature_engraver" \\remove "Bar_engraver" } {
  \\clef ${clef} \\key c \\major \\cadenzaOn
  \\override Staff.Stem.transparent = ##t
  ${note}1
} \\layout { } }`;

/* A spread of the shapes the game actually asks: a plain note, one with a
   sharp, one on a ledger line above, one below. */
const SET = {
  "treble-g4":  one("treble", "g'"),
  "treble-fs5": one("treble", "fis''"),
  "treble-c6":  one("treble", "c'''"),
  "bass-f2":    one("bass",   "f,"),
  "bass-bf3":   one("bass",   "bes"),
  "bass-c2":    one("bass",   "c,"),
};

const out = {};
for (const [id, src] of Object.entries(SET)) {
  const f = join(DIR, "n_" + id + ".ly");
  writeFileSync(f, paper + src);
  execFileSync("lilypond", ["-dbackend=svg", "-dcrop", "-o", join(DIR, "n_" + id), f], { stdio: "pipe" });
  let svg = readFileSync(join(DIR, "n_" + id + ".cropped.svg"), "utf8");
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
  console.log(`${id.padEnd(12)} ${String(svg.length).padStart(5)}B  ratio ${(vb[2] / vb[3]).toFixed(2)}:1`);
}
writeFileSync(join(DIR, "notes.json"), JSON.stringify(out, null, 1));
console.log(`\n${Object.keys(out).length} engraved, ` +
  `${(Object.values(out).reduce((n, s) => n + s.length, 0) / 1024).toFixed(1)}kB`);
