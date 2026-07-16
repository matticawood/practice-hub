import { readFileSync, writeFileSync } from "node:fs";
const d = JSON.parse(readFileSync(new URL("./l3-0-condensed.json", import.meta.url), "utf8"));
const R = [ // [find, replace] — filler removal + grammar fixes
  ["Before we look at any notation, try this exercise with your hands. It only takes a minute and it will make everything else in this lesson feel obvious.",
   "Before we look at any notation, try this quick exercise with your hands."],
  ['"1-and-a, 2-and-a, 3-and-a, 4-and-a..."\n\nThis is trickier at first. It produces',
   '"1-and-a, 2-and-a, 3-and-a, 4-and-a..."\n\nIt produces'],
  ["The beat still splits into three throughout. Let the sound settle in your ear before moving on.",
   "The beat still splits into three throughout."],
  ["You should feel and hear the difference clearly. The second version will feel looser and more lilting. That rolling sensation is compound time doing its job.",
   "The second version should feel looser and more lilting. That rolling sway is compound time."],
  ["Sometimes you will hear a piece before you see the score. Here is a tip that works surprisingly well.\n\nListen to the beat.",
   "Sometimes you will hear a piece before you see the score. Listen to the beat."],
  ["Think of a lullaby, a boat rocking on water, or a Irish jig.",
   "Think of a lullaby, a boat rocking on water, or an Irish jig."],
  ["Compound time signatures look a little different at first glance, but once you know the two-step reading trick, they make perfect sense.",
   "Compound time signatures look a little different, but once you know the trick they make perfect sense."],
  ["This means a reader can see at a glance exactly where each beat starts and ends. Never beam across a beat boundary.",
   "A reader can then see exactly where each beat starts and ends. Never beam across a beat boundary."],
];
let hits = 0;
for (const b of d.blocks) if (typeof b.md === "string") for (const [f, t] of R) if (b.md.includes(f)) { b.md = b.md.split(f).join(t); hits++; }
d.est_minutes = 25; // matches the course-median heuristic (~322 wpm) and sibling L3 lessons
writeFileSync(new URL("./l3-0-final.json", import.meta.url), JSON.stringify(d, null, 1));
const words = JSON.stringify(d.blocks.map(b=>({...b,abc:undefined}))).replace(/<[^>]+>/g," ").split(/\s+/).length;
console.log("trims applied:", hits, "of", R.length, "| blocks:", d.blocks.length, "| words:", words, "| est:", d.est_minutes);
