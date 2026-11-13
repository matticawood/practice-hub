#!/usr/bin/env node
/* publish-lower-intermediate-course.mjs — create the course and its 14 lessons.
 *
 * Structured to match the other two piece walkthroughs exactly: one level, all
 * lessons at level 1, context lessons first with no practice break, the
 * bar-by-bar sections each followed by a break, and a closing lesson with none.
 * Blocks are the same pair the other walkthroughs use: the video, then the
 * line telling the member it logs itself.
 *
 * Reads the Mux map written by upload-course-videos.mjs.
 * Idempotent: the course row is upserted and this course's lessons are deleted
 * and rewritten, so a re-run after a failed upload fills the gaps rather than
 * duplicating anything.
 *
 *   node publish-lower-intermediate-course.mjs [--map f.json] [--status draft|published] [--dry]
 */
import { readFileSync, existsSync } from "node:fs";

const ENV_FILE = "/Users/matthewcawood/The Practice Room Database/.env.local";
const env = Object.fromEntries(readFileSync(ENV_FILE, "utf8").split("\n")
  .filter(l => l.includes("=")).map(l => {
    const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
  }));
const SB = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_KEY;
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

const args = process.argv.slice(2);
const argOf = n => { const i = args.indexOf(n); return i < 0 ? null : args[i + 1]; };
const MAP = argOf("--map") || "/private/tmp/claude-501/-Users-matthewcawood-Piano-Practice-Daily/5800d9f6-7409-4922-87e3-a3f9ab102a8a/scratchpad/mux-lower-int.json";
const STATUS = argOf("--status") || "published";
const DRY = args.includes("--dry");
const COURSE = "lower-intermediate-walkthrough";

/* Where the course sends you off to practise, keyed by lesson number. Only the
   playing sections: the opening context lessons are watched through, and
   nothing follows the last section except the closing lesson. Same shape and
   register as the other two walkthroughs. */
const BREAKS = {
  4:  "Spend a little time on the opening before you go on. Play it slowly until the chords feel settled under your hands.",
  5:  "Give this phrase some time on its own. There's no rush, come back when it feels comfortable.",
  6:  "Play the two phrases together a few times so they join up, then come back and carry on.",
  7:  "Work on this bar until the accidental stops surprising you, then come back and keep going.",
  8:  "Play through what you have so far and listen to how the repetition changes. Move on whenever you're ready.",
  9:  "Sit with this section for a while. It's a different world from the opening, so let it settle before moving on.",
  10: "Take some time over the answering phrase, listening to how it responds. Come back when you're happy with it.",
  11: "Work through these bars slowly at your own pace. When the harmony feels familiar, come back and carry on.",
  12: "Give this chord some time on its own. Play up to it and past it until it sounds intended rather than accidental.",
  13: "Play through the ending a few times until it feels shaped rather than just correct, then come back for the last lesson.",
};

/* [lesson number, title, what the summary says it covers]. Titles are the
   filenames. A summary names what the lesson covers and stops: it does not
   give away what the lesson arrives at, and it stays as plain and as short as
   the Learn Your First Piece summaries, which are the house pattern. */
const LESSONS = [
  [1,  "Introduction",           "what the piece is, what you'll learn, and how the course works."],
  [2,  "Background",             "the background to the piece, when and why Grieg wrote it, and the story behind it."],
  [3,  "Fact Finding",           "the details in the score to notice before you start playing."],
  [4,  "The Opening",            "the opening of the piece, its notes, and the chorale sound it is built on."],
  [5,  "Phrase 1",               "the first phrase, its chords, and shaping it so the melody sings on top."],
  [6,  "Phrase 2",               "the second phrase, how it differs from the first, and holding the lines that overlap."],
  [7,  "Accidental",             "the accidental in this section and what it tells you about the harmony."],
  [8,  "Repetition",             "the material returning, and what to change so a repeat is not just a repeat."],
  [9,  "Ghosts",                 "the Intermezzo, its change of character, and how to play the septuplet flourishes."],
  [10, "The Responding Chorale", "the chorale that answers the flourishes, its chords, and balancing it as it grows."],
  [11, "Landing in Obscurity",   "where the harmony goes in this section, and how to pace the chords it lands on."],
  [12, "An Unexpected Chord",    "the return of the opening material, and the expression written into it this time."],
  [13, "The Final Turn",         "the final phrase and the cadence that closes the piece."],
  [14, "Conclusion",             "what to take from the piece and where to go next."],
];

const map = existsSync(MAP) ? JSON.parse(readFileSync(MAP, "utf8")) : {};
const byN = {};
Object.values(map).forEach(v => { byN[v.n] = v; });

const missing = LESSONS.filter(([n]) => !byN[n]?.playbackId).map(([n, t]) => `${n} ${t}`);
if (missing.length) {
  console.log(`NOT READY - ${missing.length} lesson(s) have no Mux playback id yet:`);
  missing.forEach(m => console.log("   " + m));
  if (!DRY) { console.log("\nRe-run once the uploads finish."); process.exit(1); }
}

async function rest(path, init) {
  const r = await fetch(SB + "/rest/v1/" + path, { ...init, headers: { ...H, ...(init?.headers || {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(path + " -> " + r.status + " " + t.slice(0, 300));
  return t ? JSON.parse(t) : null;
}

const rows = LESSONS.map(([n, title, covers]) => {
  const v = byN[n] || {};
  return {
    course: COURSE,
    level: 1,                               // one level, like both other walkthroughs
    sort_order: n - 1,                      // 0-based
    title,
    summary: "In this lesson, we will cover " + covers,
    est_minutes: Math.max(1, Math.round((v.duration || 60) / 60)),
    status: STATUS,
    break_after: BREAKS[n] || null,
    thumb_id: v.playbackId || null,
    blocks: [
      { type: "video", public: true, caption: null, playbackId: v.playbackId || null },
      { type: "text", md: "This lesson logs to your practice automatically once you finish watching the video." },
    ],
  };
});

const totalMin = rows.reduce((a, r) => a + r.est_minutes, 0);
console.log(`${rows.length} lessons, ${totalMin} minutes total, status "${STATUS}"`);
rows.forEach(r => console.log(
  `  Lesson ${String(r.sort_order + 1).padStart(2)}  ${String(r.est_minutes).padStart(2)}min  ${r.break_after ? "[BREAK AFTER] " : "              "}${r.title}`));
if (DRY) { console.log("\n(dry run, nothing written)"); process.exit(0); }

/* the course row first, so the lessons have something to belong to */
await rest("courses", {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify([{
    key: COURSE, title: "Lower Intermediate Walkthrough", kind: "member",
    level_label: "Level", levels: 1, sort: 3, status: "published",
  }]),
});
console.log("course row upserted");

await rest(`lessons?course=eq.${COURSE}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
await rest("lessons", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(rows) });
console.log(`${rows.length} lessons written`);

const back = await rest(`lessons?select=title,sort_order,est_minutes,status,thumb_id,break_after&course=eq.${COURSE}&order=sort_order`);
const bad = back.filter(r => !r.thumb_id);
console.log(`verified: ${back.length} rows, ${bad.length} without a video, ${back.filter(r => r.break_after).length} with a practice break`);
