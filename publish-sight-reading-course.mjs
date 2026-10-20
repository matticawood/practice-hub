#!/usr/bin/env node
/* publish-sight-reading-course.mjs — create the course and its 27 lessons.
 *
 * Reads the Mux map written by upload-course-videos.mjs and builds one lesson
 * row per video, in the module grouping Matthew confirmed. Lessons are grouped
 * by `level`, which the Courses page renders under `courses.level_label`, so
 * level_label is "Module" and the six modules become Module 1 to Module 6.
 *
 * Idempotent: rows are upserted on (course, sort_order), so a re-run after a
 * failed upload fills the gaps rather than duplicating the course.
 *
 *   node publish-sight-reading-course.mjs [--map f.json] [--status draft|published] [--dry]
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
const MAP = argOf("--map") || "/private/tmp/claude-501/-Users-matthewcawood-Piano-Practice-Daily/5800d9f6-7409-4922-87e3-a3f9ab102a8a/scratchpad/mux-map.json";
const STATUS = argOf("--status") || "draft";
const DRY = args.includes("--dry");
const COURSE = "sight-reading-beginners";

/* module number -> the lessons in it, and what each lesson says it covers.
   The wording follows the course plan and the house voice: no em dashes, no
   emoji, "practise" as the verb. */
const LESSONS = [
  [1, 1, "Introduction", "who this course is for, how it works, and what you will be able to do by the end."],
  [2, 1, "Reading vs Sight Reading", "the difference between working a piece out over time and playing something you have never seen before."],
  [3, 1, "Best Practices & Mindset", "taking the pressure off, reading below your playing level, and treating this as a skill of utility rather than musicianship."],
  [4, 1, "Saturation", "why volume and frequency beat accuracy, and how reading a little every day is what actually builds the skill."],

  [5, 2, "Key Signatures", "finding the key before you play, so none of the sharps or flats catch you out."],
  [6, 2, "Time Signatures", "finding the pulse and deciding how you are going to count it."],
  [7, 2, "Performance Directions", "the tempo and dynamic markings, and choosing a speed you can actually hold."],
  [8, 2, "Articulation", "legato, staccato and slurs, and how the music is meant to sound."],
  [9, 2, "Spotting Difficult Sections", "scanning for the hardest bar and setting your speed to that, not to the easy opening."],
  [10, 2, "Pattern Recognition", "spotting scales, repeats, steps and leaps, so you read patterns instead of separate notes."],
  [11, 2, "A Before Walkthrough", "running the whole pre-read routine out loud on a real example."],

  [12, 3, "Hand Position", "finding where your hands start, from the landmark note to the fingers you will use."],
  [13, 3, "Counting and Naming", "saying note names or counting out loud, and how to choose which."],
  [14, 3, "Judgement", "keeping going without stopping, restarting, or judging yourself while you play."],

  [15, 4, "What Went Well", "starting your evaluation with what actually worked."],
  [16, 4, "What Went Wrong", "finding the cause rather than just the bar, and what to watch for next time."],

  [17, 5, "The Book", "the exercise book used for the walkthroughs, and how its levels are graded."],
  [18, 5, "Level 1 Right Hand Walkthrough", "a full read-through of a level 1 exercise in the right hand."],
  [19, 5, "Level 1 Left Hand Walkthrough", "a full read-through of a level 1 exercise in the left hand."],
  [20, 5, "Level 2 Right Hand Walkthrough", "a full read-through of a level 2 exercise in the right hand."],
  [21, 5, "Level 2 Left Hand Walkthrough", "a full read-through of a level 2 exercise in the left hand."],
  [22, 5, "Level 3 Right Hand Walkthrough", "a full read-through of a level 3 exercise in the right hand."],
  [23, 5, "Level 3 Left Hand Walkthrough", "a full read-through of a level 3 exercise in the left hand."],
  [24, 5, "Level 4 Right Hand Walkthrough", "a full read-through of a level 4 exercise in the right hand."],
  [25, 5, "Level 4 Left Hand Walkthrough", "a full read-through of a level 4 exercise in the left hand."],
  [26, 5, "Grade 1 Walkthrough", "a full read-through of a grade 1 standard exercise."],

  [27, 6, "What Next", "building the habit, and where to find material to keep reading every day."],
];

const map = existsSync(MAP) ? JSON.parse(readFileSync(MAP, "utf8")) : {};
const byN = {};
Object.values(map).forEach(v => { byN[v.n] = v; });

const missing = LESSONS.filter(([n]) => !byN[n]?.playbackId).map(([n, , t]) => `${n} ${t}`);
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

const rows = LESSONS.map(([n, module, title, covers]) => {
  const v = byN[n] || {};
  return {
    course: COURSE,
    level: module,
    sort_order: n - 1,                    // 0-based, matches the other courses
    title,
    summary: "In this lesson, we will cover " + covers,
    est_minutes: Math.max(1, Math.round((v.duration || 60) / 60)),
    status: STATUS,
    thumb_id: v.playbackId || null,
    blocks: [
      { type: "video", public: true, caption: null, playbackId: v.playbackId || null },
      { type: "text", md: "This lesson logs to your practice automatically once you finish watching the video." },
    ],
  };
});

const totalMin = rows.reduce((a, r) => a + r.est_minutes, 0);
console.log(`${rows.length} lessons, ${totalMin} minutes total, status "${STATUS}"`);
for (const m of [1, 2, 3, 4, 5, 6]) {
  const g = rows.filter(r => r.level === m);
  console.log(`  Module ${m}: ${g.length} lessons, ${g.reduce((a, r) => a + r.est_minutes, 0)} min`);
}
if (DRY) { console.log("\n(dry run, nothing written)"); process.exit(0); }

/* the course row first, so the lessons have something to belong to */
await rest("courses", {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify([{
    key: COURSE, title: "Sight Reading for Beginners", kind: "member",
    level_label: "Module", levels: 6, sort: 5, status: "published",
  }]),
});
console.log("course row upserted");

/* lessons: delete this course's rows then insert, so a re-run cannot leave
   stale rows behind if the lesson list ever shrinks. Nothing else references
   them until the course is published. */
await rest(`lessons?course=eq.${COURSE}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
await rest("lessons", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(rows) });
console.log(`${rows.length} lessons written`);

const back = await rest(`lessons?select=title,level,sort_order,est_minutes,status,thumb_id&course=eq.${COURSE}&order=sort_order`);
const bad = back.filter(r => !r.thumb_id);
console.log(`verified: ${back.length} rows, ${bad.length} without a video`);
