/* gen-metro-mark.mjs — engrave the metronome mark's note value.
 *
 * The mark reads "note = 120", and the note in it is notation, so LilyPond
 * sets it. It was four Bravura paths placed by hand with a scale factor and a
 * baseline offset picked by eye - which is the thing the standing rule is
 * against, and it also meant the eighth and the sixteenth carried a flag drawn
 * at whatever size the same 0.045 scale happened to give them.
 *
 * \markup \note is the metronome-mark note: notehead, stem and flag as one
 * glyph, set the way LilyPond sets it inside \tempo.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIR = process.env.LY_DIR ||
  "/private/tmp/claude-501/-Users-matthewcawood-Piano-Practice-Daily/0e598060-a03f-4468-bf26-d021661a7bf9/scratchpad/ly";
mkdirSync(DIR, { recursive: true });

/* No \paper block. one-line-breaking is what the score generators use, and on
   a file whose whole body is a top-level \markup it makes LilyPond report
   success and write no file at all - not the .svg, not the .cropped.svg. */
const paper = `\\version "2.24.0"
\\header { tagline = ##f }
`;

/* #1 is the stem direction: up. font-size lifts it off the 20-staff-space
   default so the crop is a workable number of user units. */
const one = (d) => `\\markup { \\override #'(font-size . 6) \\note {${d}} #1 }\n`;

const DENOMS = [2, 4, 8, 16];
const out = {};

for (const d of DENOMS) {
  const stem = "m_" + d;
  const f = join(DIR, stem + ".ly");
  writeFileSync(f, paper + one(d));
  execFileSync("lilypond", ["-dbackend=svg", "-dcrop", "-o", join(DIR, stem), f], { stdio: "pipe" });
  let svg = readFileSync(join(DIR, stem + ".cropped.svg"), "utf8");
  svg = svg
    .replace(/<\?xml[^>]*\?>\s*/g, "")
    .replace(/<!DOCTYPE[^>]*>\s*/g, "")
    .replace(/<style[\s\S]*?<\/style>\s*/g, "")
    /* Anchored to the <svg> tag only. The same strip written globally takes
       width and height off every <rect> in the file too, and LilyPond draws
       stems and beams as rects - they come out zero by zero. */
    .replace(/<svg\b[^>]*>/, (t) => t.replace(/\s(width|height)="[^"]*"/g, ""))
    .replace(/<svg /, '<svg aria-hidden="true" preserveAspectRatio="xMidYMid meet" ')
    /* It is set in currentColor so it takes the colour of the line it sits in. */
    .replace(/fill="#000000"/g, 'fill="currentColor"')
    .replace(/stroke="#000000"/g, 'stroke="currentColor"')
    .replace(/\s+/g, " ")
    .trim();
  out[d] = svg;
  const vb = (svg.match(/viewBox="([^"]*)"/) || [])[1].split(" ").map(Number);
  console.log(`1/${String(d).padEnd(3)} ${String(svg.length).padStart(5)}B  ` +
    `viewBox ${vb.map((n) => n.toFixed(2)).join(" ")}  ratio ${(vb[2] / vb[3]).toFixed(3)}`);
}

writeFileSync(join(DIR, "metro-marks.json"), JSON.stringify(out, null, 1));
console.log(`\n${DENOMS.length} engraved, ` +
  `${(Object.values(out).reduce((n, s) => n + s.length, 0) / 1024).toFixed(1)}kB`);
