/* ── The course catalogue ──────────────────────────────────────────────────
   One definition, read by the Courses page and by the dashboard. It used to
   live inside courses.html, which meant the dashboard could not see it at all
   and would have needed a second copy to drift out of step.

   `levels` is which of the eight roadmap levels a course is FOR, so the
   dashboard can show a member the courses that suit where they are. It is
   explicit rather than read out of `audience`, which is a sentence written for
   a human to read on the Learn page: "Beginners" and "Absolute beginners" are
   different audiences but nothing in the words says by how much. The Absolute
   Beginner Course is level 1 only - it is for people who have never played.

   Icons are raw path markup here rather than SVG(...) so this file has no
   dependency on the page that loads it. */
window.PR_COURSES = [
  { key: "first-steps", levels: [1], label: "The Absolute Beginner Course", blurb: "Never played before? Start here and play your first pieces.", color: "#8b5cf6", audience: "Absolute beginners",
    icon: '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>' },
  // Music Theory is one course in the database (key "theory", lessons tagged by
  // level 1-5). It is PRESENTED as five separate level-courses: each entry below
  // reads the same `theory` lessons filtered to its `onlyLevel`. No database
  // change, so achievements/progress/deep-links that key off course="theory"
  // keep working. Levels 4-5 have only draft lessons, so they show as
  // "coming soon" until those lessons are published (self-activating).
  // Hidden parent: not shown as a card (card surfaces skip `hidden`), but kept
  // so anything that queries by the real lesson course key ("theory"), e.g. the
  // dashboard's one-shot lesson query, keeps resolving exactly as before.
  { key: "theory", levels: [1,2,3,4], label: "Music Theory", blurb: "How music works, from note names to harmony.", color: "#10b981", audience: "Absolute beginner to intermediate", hidden: true,
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' },
  { key: "theory-1", levels: [1,2], label: "Music Theory 1", blurb: "Note names, basic rhythm, and reading your very first music.", color: "#34d399", audience: "Absolute Beginner", srcCourse: "theory", onlyLevel: 1,
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' },
  { key: "theory-2", levels: [2,3], label: "Music Theory 2", blurb: "More keys and rhythms, intervals, and the signs on the page.", color: "#10b981", audience: "Beginner", srcCourse: "theory", onlyLevel: 2,
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' },
  { key: "theory-3", levels: [3,4], label: "Music Theory 3", blurb: "Compound time, scales, and the triads behind the music.", color: "#059669", audience: "Lower Intermediate", srcCourse: "theory", onlyLevel: 3,
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' },
  { key: "theory-4", levels: [4,5], label: "Music Theory 4", blurb: "More keys and chords, and reading music with real fluency.", color: "#0d9488", audience: "Intermediate", srcCourse: "theory", onlyLevel: 4,
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' },
  { key: "theory-5", levels: [5,6], label: "Music Theory 5", blurb: "Everything up to Grade 5 theory, the gateway to advanced playing.", color: "#0f766e", audience: "Upper Intermediate", srcCourse: "theory", onlyLevel: 5,
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' },
  { key: "learn-your-first-piece", levels: [1,2,3], label: "Learn Your First Piece", blurb: "Ready for a real piece? Learn your first one, bar by bar.", color: "#2563eb", audience: "Beginners",
    format: "video", thumbId: "Uav7E8LAdqGDVIgS00iOsm91FYJ9vb4pNawk6KMwfchc", thumbTime: 21,
    icon: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>' },
  { key: "sight-reading-beginners", levels: [1,2,3,4,5,6], levelLabel: "Module",
    // The six modules are named, not numbered: the course was planned and
    // approved as "Module 1 - Foundations" and so on, and a bare "Module 3"
    // tells a member nothing about what is in it.
    levelNames: { 1: "Foundations", 2: "Before You Play", 3: "While You Play",
                  4: "After You Play", 5: "Guided Sight-Reading", 6: "What Next" },
    label: "Sight Reading for Beginners",
    blurb: "Play music you have never seen before, with the exact formula for improvement.",
    color: "#0ea5e9", audience: "Beginners",
    format: "video", thumbId: "VUFYDUO02DzcZ6uYRkIL6elAmrmPgXWyupgc4s5nNT9Q", thumbTime: 3,
    // Finishing a lesson auto-logs its minutes. This course is sight reading,
    // so the time belongs on the sight-reading track, not musicianship.
    practiceType: "sightreading",
    // Launch feature: leads the Courses hero and the Learn hero until this
    // date, then both fall back to normal rotation. One week from publishing.
    featuredUntil: "2026-10-27",
    icon: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>' },
  { key: "ear", levels: [1,2,3,4,5,6,7,8], label: "Ear Training", blurb: "Train your ear to recognise notes, intervals and chords.", color: "#ec4899", audience: "All levels",
    icon: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>' },
  { key: "improv", levels: [1,2,3,4,5,6,7,8], label: "Improvisation", blurb: "Start making up your own music at the keyboard.", color: "#f97316", audience: "Beginner and up",
    icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' },
  // Announced before they exist, so the course list never reads as a finished set.
  // `soon` is the line shown where the lesson count and CTA normally sit.
  { key: "upper-intermediate-walkthrough", levels: [5,6,7,8], label: "Upper Intermediate Walkthrough",
    blurb: "A full upper intermediate piece, bar by bar, including how to make decisions and learn effectively.",
    color: "#14b8a6", audience: "Upper intermediate",
    format: "video", thumbId: "jM1dU54Lz00le01d61w9cD72wjBK2QjY2n9JQzrvzvshw", thumbTime: 2,
    // Launch feature: leads the Courses hero and the Learn Library course slot
    // until this date, then both fall back to normal rotation. Set the end date
    // when you publish.
    featuredUntil: "2026-10-17",
    icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="8" y1="4" x2="8" y2="14"/><line x1="12" y1="4" x2="12" y2="14"/><line x1="16" y1="4" x2="16" y2="14"/>' },
  { key: "lower-intermediate-walkthrough", levels: [3,4,5], label: "Lower Intermediate Walkthrough", soon: "Coming in late October",
    blurb: "A full lower intermediate piece, bar by bar, including how to make decisions and learn effectively.",
    color: "#6366f1", audience: "Lower intermediate",
    icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="8" y1="4" x2="8" y2="14"/><line x1="12" y1="4" x2="12" y2="14"/><line x1="16" y1="4" x2="16" y2="14"/>' },
];
