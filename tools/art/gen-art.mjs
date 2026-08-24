/* gen-art.mjs — engrave the tile artwork with LilyPond.
 *
 * The hand-drawn staves were the giveaway: noteheads at the wrong angle, stems
 * on the wrong side, spacing that no engraver would set. These are real
 * LilyPond output, so they are simply correct.
 *
 * LilyPond's SVG backend emits plain vector paths (no font dependency) and uses
 * currentColor for every fill and stroke, so each tile tints its own artwork by
 * setting `color` and nothing else has to change.
 *
 * Writes a JSON map of id -> inline <svg> string, which the build step below
 * splices into tools.html.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const DIR = "/private/tmp/claude-501/-Users-matthewcawood-Piano-Practice-Daily/0e598060-a03f-4468-bf26-d021661a7bf9/scratchpad/ly";
mkdirSync(DIR, { recursive: true });

const PRE = `\\version "2.24.0"
\\header { tagline = ##f }
\\paper {
  indent = 0
  line-width = 120\\mm
  oddFooterMarkup = ##f
  oddHeaderMarkup = ##f
  bookTitleMarkup = ##f
  scoreTitleMarkup = ##f
  page-breaking = #ly:one-line-breaking
}
`;

/* Each one is the thing the tool is actually about. */
const PIECES = {
  // naming notes on the stave: single notes, one with a ledger line
  note: `\\score { \\new Staff \\with { \\remove "Time_signature_engraver" \\remove "Bar_engraver" } {
    \\clef treble \\key c \\major \\cadenzaOn
    \\override Staff.Stem.transparent = ##t
    g'1 c''1 a'1 c'''1
  } \\layout { } }`,

  // reading a chord off the page: a triad, an inversion, a seventh
  chord: `\\score { \\new Staff \\with { \\remove "Time_signature_engraver" \\remove "Bar_engraver" } {
    \\clef treble \\key c \\major \\cadenzaOn
    \\override Staff.Stem.transparent = ##t
    <c' e' g'>1 <e' g' c''>1 <d' f' a' c''>1
  } \\layout { } }`,

  // the distance between two notes: a third, a sixth, an octave
  interval: `\\score { \\new Staff \\with { \\remove "Time_signature_engraver" \\remove "Bar_engraver" } {
    \\clef treble \\key c \\major \\cadenzaOn
    \\override Staff.Stem.transparent = ##t
    <c' e'>1 <c' a'>1 <c' c''>1
  } \\layout { } }`,

  // a passage worked until it holds: a real phrase between repeat barlines
  game: `\\score { \\new Staff \\with { \\remove "Time_signature_engraver" } {
    \\clef treble \\key c \\major \\time 4/4
    \\repeat volta 2 { c''8 b' a' g' a'4 g' }
  } \\layout { } }`,

  // the header: a longer line of music to sit behind the title
  banner: `\\score { \\new Staff \\with { \\remove "Time_signature_engraver" } {
    \\clef treble \\key c \\major \\time 4/4
    \\override Staff.Stem.transparent = ##t
    c''4 e'' g'' e'' | d'' f'' a'' f'' | e'' g'' c''' g'' | f'' a'' d''' a'' |
  } \\layout { } }`,
};

const out = {};
for (const [id, body] of Object.entries(PIECES)) {
  const f = join(DIR, id + ".ly");
  writeFileSync(f, PRE + body);
  execFileSync("lilypond", ["-dbackend=svg", "-dcrop", "-o", join(DIR, id), f], { stdio: "pipe" });
  let svg = readFileSync(join(DIR, id + ".cropped.svg"), "utf8");

  /* Strip what a browser does not need and what would collide: the XML
     preamble, LilyPond's <style> block (it sets tspan white-space globally),
     and the width/height attributes so the tile controls the size through CSS.
     The viewBox is kept, which is what makes it scale. */
  svg = svg
    .replace(/<\?xml[^>]*\?>\s*/g, "")
    .replace(/<!DOCTYPE[^>]*>\s*/g, "")
    .replace(/<style[\s\S]*?<\/style>\s*/g, "")
    .replace(/\s(width|height)="[^"]*"/g, "")
    .replace(/<svg /, '<svg aria-hidden="true" preserveAspectRatio="xMidYMid meet" ')
    .replace(/\s+/g, " ")
    .trim();

  out[id] = svg;
  console.log(`${id.padEnd(9)} ${String(svg.length).padStart(6)} bytes  ` +
    `paths ${(svg.match(/<path/g) || []).length}  ` +
    `viewBox ${(svg.match(/viewBox="([^"]*)"/) || [])[1]}`);
}

writeFileSync(join(DIR, "art.json"), JSON.stringify(out, null, 1));
const total = Object.values(out).reduce((n, s) => n + s.length, 0);
console.log(`\ntotal ${(total / 1024).toFixed(1)}kB inlined`);
