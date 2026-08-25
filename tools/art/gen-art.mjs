/* gen-art.mjs — engrave every piece of notation on the Tools page.
 *
 * RULE: if it is notation, LilyPond sets it. Nothing on this page draws a
 * stave, a clef or a notehead by hand. The two hand-drawn pieces that remain
 * in tools.html are a wavefront and a pendulum, which are not notation.
 *
 * LilyPond's SVG backend emits plain vector paths (no font dependency) and
 * every fill and stroke is currentColor, so each tile tints its own artwork by
 * setting `color` and nothing else has to change.
 *
 * Writes art.json: a map of id -> inline <svg> string, spliced into tools.html.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIR = process.env.LY_DIR ||
  "/private/tmp/claude-501/-Users-matthewcawood-Piano-Practice-Daily/0e598060-a03f-4468-bf26-d021661a7bf9/scratchpad/ly";
mkdirSync(DIR, { recursive: true });

const paper = (w) => `\\version "2.24.0"
\\header { tagline = ##f }
\\paper {
  indent = 0
  line-width = ${w}\\mm
  oddFooterMarkup = ##f
  oddHeaderMarkup = ##f
  bookTitleMarkup = ##f
  scoreTitleMarkup = ##f
  page-breaking = #ly:one-line-breaking
}
`;

/* The tile motifs are diagrams: the thing the tool is about, held still so it
   can be read. Whole notes with no stems is the correct engraving for that —
   a stem would imply a duration the diagram is not claiming.

   The banner is the opposite. It is not a diagram, it is music, so it is set
   as music: a real phrase on a grand staff with stems, beams and both hands.
   The first version had transparent stems, which left noteheads floating and
   read as fake notation. That was the mistake. */
const PIECES = {
  note: { w: 120, src: `\\score { \\new Staff \\with {
      \\remove "Time_signature_engraver" \\remove "Bar_engraver" } {
    \\clef treble \\key c \\major \\cadenzaOn
    g'1 c''1 a'1 c'''1
  } \\layout { } }` },

  chord: { w: 120, src: `\\score { \\new Staff \\with {
      \\remove "Time_signature_engraver" \\remove "Bar_engraver" } {
    \\clef treble \\key c \\major \\cadenzaOn
    <c' e' g'>1 <e' g' c''>1 <d' f' a' c''>1
  } \\layout { } }` },

  interval: { w: 120, src: `\\score { \\new Staff \\with {
      \\remove "Time_signature_engraver" \\remove "Bar_engraver" } {
    \\clef treble \\key c \\major \\cadenzaOn
    <c' e'>1 <c' a'>1 <c' c''>1
  } \\layout { } }` },

  /* A passage you work at: a real beamed phrase between repeat barlines. */
  game: { w: 120, src: `\\score { \\new Staff \\with { \\remove "Time_signature_engraver" } {
    \\clef treble \\key c \\major \\time 4/4
    \\repeat volta 2 { c''8 b' a' g' a'4 g' }
  } \\layout { } }` },

  /* The banner: four bars of actual piano writing, both hands, properly set.
     A rising right-hand line over a broken-chord left hand through
     C - Am - F - G, which is as plain and as musical as four bars get. */
  banner: { w: 210, src: `\\score { \\new PianoStaff <<
    \\new Staff = "up" { \\clef treble \\key c \\major \\time 4/4
      e''8 d'' c'' d'' e'' g'' c''' g'' |
      a''4 g''8 e'' c''4 e''8 g'' |
      f''8 e'' d'' e'' f'' a'' f'' c'' |
      d''4. c''8 b'4 d'' |
    }
    \\new Staff = "down" { \\clef bass \\key c \\major \\time 4/4
      c,8 g, c e g e c g, |
      a,,8 e, a, c e c a, e, |
      f,,8 c, f, a, c a, f, c, |
      g,,8 d, g, b, d b, g, d, |
    }
  >> \\layout { } }` },
};

const out = {};
for (const [id, { w, src }] of Object.entries(PIECES)) {
  const f = join(DIR, id + ".ly");
  writeFileSync(f, paper(w) + src);
  execFileSync("lilypond", ["-dbackend=svg", "-dcrop", "-o", join(DIR, id), f], { stdio: "pipe" });
  let svg = readFileSync(join(DIR, id + ".cropped.svg"), "utf8");

  /* Strip what a browser does not need and what would collide: the XML
     preamble, LilyPond's <style> block (it sets tspan white-space globally),
     and width/height so CSS controls the size. The viewBox is what makes it
     scale, so that stays. */
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
  console.log(`${id.padEnd(9)} ${String(svg.length).padStart(6)}B  ` +
    `paths ${String((svg.match(/<path/g) || []).length).padStart(3)}  ` +
    `ratio ${(vb[2] / vb[3]).toFixed(2)}:1`);
}

writeFileSync(join(DIR, "art.json"), JSON.stringify(out, null, 1));
console.log(`\ntotal ${(Object.values(out).reduce((n, s) => n + s.length, 0) / 1024).toFixed(1)}kB inlined`);
