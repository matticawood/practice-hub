/* shared-member-modal.js — the universal "view a member" profile modal.
 *
 * Any avatar rendered with a `data-member-email="<email>"` attribute opens this
 * modal (hero + About / Achievements / Posts / Activity tabs, infinite scroll,
 * mobile-safe). The profile *page* (profile.html) is now only for editing your
 * own profile.
 *
 * Usage on each page (after the Supabase client exists):
 *   initMemberModal({ db, myEmail });                       // basic
 *   initMemberModal({ db, myEmail, onPostClick: id => … }); // custom post open
 *
 * The module is fully self-contained (its own helpers + achievement data) so it
 * has zero coupling to the host page's globals. It relies only on the shared
 * design tokens + .loading-spinner from style.css, which every page loads.
 */
(function () {
  "use strict";

  let _db = null, _myEmail = null, _onPostClick = null, _booted = false;

  /* ───────────────────────── self-contained helpers ───────────────────────── */
  function escHtml(str) {
    return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function relativeTime(ts) {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
    if (m < 2) return "just now";
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (d === 1) return "yesterday";
    return `${d}d ago`;
  }
  function formatMinutes(mins) {
    if (!mins || mins <= 0) return "0 min";
    const h = Math.floor(mins / 60), m = mins % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }
  const _memberColours = [
    { bg: "#ede9fe", fg: "#7c3aed" }, { bg: "#dcfce7", fg: "#16a34a" },
    { bg: "#fef3c7", fg: "#b8900a" }, { bg: "#dbeafe", fg: "#2563eb" },
    { bg: "#fee2e2", fg: "#dc2626" }, { bg: "#cffafe", fg: "#0891b2" },
    { bg: "#fce7f3", fg: "#db2777" }, { bg: "#ffedd5", fg: "#ea580c" },
  ];
  function _memberColour(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return _memberColours[Math.abs(h) % _memberColours.length];
  }
  function _memberInitials(name) {
    const parts = (name || "?").trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : (parts[0][0] || "?").toUpperCase();
  }

  /* ───────────────────────── achievement catalogue ────────────────────────── */
  const ACH = {
  s1:{icon:"🎹",name:"First Note",desc:"Log your first practice day"},
  s10:{icon:"🎵",name:"Getting Started",desc:"Practice on 10 different days"},
  s50:{icon:"🎶",name:"Regular",desc:"Practice on 50 different days"},
  s100:{icon:"💯",name:"Century",desc:"Practice on 100 different days"},
  s250:{icon:"🏅",name:"Dedicated",desc:"Practice on 250 different days"},
  s500:{icon:"👑",name:"Elite",desc:"Practice on 500 different days"},
  t1:{icon:"⏱️",name:"First Hour",desc:"Practise for 1 hour total"},
  t10:{icon:"⌚",name:"Ten Hours",desc:"Practise for 10 hours total"},
  t50:{icon:"⭐",name:"Fifty Hours",desc:"Practise for 50 hours total"},
  t100:{icon:"🌟",name:"100 Hours",desc:"Practise for 100 hours total"},
  t500:{icon:"💫",name:"500 Hours",desc:"Practise for 500 hours total"},
  k3:{icon:"🔥",name:"On a Roll",desc:"Achieve a 3-day streak"},
  k7:{icon:"🔥",name:"Week Warrior",desc:"Achieve a 7-day streak"},
  k14:{icon:"🔥",name:"Fortnight",desc:"Achieve a 14-day streak"},
  k30:{icon:"🔥",name:"Monthly",desc:"Achieve a 30-day streak"},
  k60:{icon:"🌋",name:"Two Months",desc:"Achieve a 60-day streak"},
  k100:{icon:"💯",name:"100 Days",desc:"Achieve a 100-day streak"},
  k180:{icon:"🌙",name:"Six Months",desc:"Achieve a 180-day streak"},
  k365:{icon:"🌍",name:"Full Year",desc:"Achieve a 365-day streak"},
  p1:{icon:"🎵",name:"First Piece",desc:"Practise a piece for the first time"},
  p5:{icon:"🎼",name:"Repertoire",desc:"Practise 5 different pieces"},
  p15:{icon:"📚",name:"Growing Library",desc:"Practise 15 different pieces"},
  p30:{icon:"🎭",name:"Expanding Repertoire",desc:"Practise 30 different pieces"},
  p50:{icon:"🎪",name:"Recital Ready",desc:"Practise 50 different pieces"},
  pd1:{icon:"🎯",name:"Committed",desc:"Log 1 hour on a single piece"},
  pd5:{icon:"🏅",name:"Deep Work",desc:"Log 5 hours on a single piece"},
  pd10:{icon:"⭐",name:"Dedicated",desc:"Log 10 hours on a single piece"},
  pd20:{icon:"💎",name:"Mastery",desc:"Log 20 hours on a single piece"},
  sc1:{icon:"🎹",name:"Scale Up",desc:"Practise your first scale or technique"},
  sc5:{icon:"🎶",name:"Well-Rounded",desc:"Practise 5 different scales or techniques"},
  sc15:{icon:"🌊",name:"Technical Depth",desc:"Practise 15 different scales or techniques"},
  ss5:{icon:"🔁",name:"Persistent",desc:"Return to the same scale 5 times"},
  ss10:{icon:"⚙️",name:"Drilled",desc:"Return to the same scale 10 times"},
  ss25:{icon:"⚙️",name:"Iron Fingers",desc:"Return to the same scale 25 times"},
  ss50:{icon:"👑",name:"Scale Master",desc:"Return to the same scale 50 times"},
  sr1:{icon:"👁️",name:"First Glance",desc:"Log your first sight-reading session"},
  sr10:{icon:"👀",name:"Quick Reader",desc:"Log 10 sight-reading sessions"},
  sr30:{icon:"📄",name:"Sharp Eyes",desc:"Log 30 sight-reading sessions"},
  srt1:{icon:"⏱️",name:"Reading Hour",desc:"Spend 1 hour on sight-reading"},
  srt5:{icon:"📖",name:"Dedicated Reader",desc:"Spend 5 hours on sight-reading"},
  srt25:{icon:"🔭",name:"Sight Reader",desc:"Spend 25 hours on sight-reading"},
  srt50:{icon:"🌟",name:"Music Reader",desc:"Spend 50 hours on sight-reading"},
  im1:{icon:"💡",name:"Free Spirit",desc:"Log your first improvisation session"},
  im10:{icon:"🎸",name:"Improviser",desc:"Log 10 improvisation sessions"},
  im30:{icon:"🎺",name:"Jazz Hands",desc:"Log 30 improvisation sessions"},
  imt1:{icon:"⏱️",name:"In the Flow",desc:"Spend 1 hour on improvisation"},
  imt5:{icon:"🎵",name:"Creative Hours",desc:"Spend 5 hours on improvisation"},
  imt25:{icon:"🌀",name:"Jam Master",desc:"Spend 25 hours on improvisation"},
  imt50:{icon:"🌟",name:"Free Form",desc:"Spend 50 hours on improvisation"},
  th1:{icon:"📐",name:"By the Book",desc:"Log your first theory session"},
  th10:{icon:"📝",name:"Studious",desc:"Log 10 theory sessions"},
  th30:{icon:"🎓",name:"Deep Thinker",desc:"Log 30 theory sessions"},
  tht1:{icon:"⏱️",name:"Theory Hour",desc:"Spend 1 hour on theory"},
  tht5:{icon:"📚",name:"Dedicated Student",desc:"Spend 5 hours on theory"},
  tht25:{icon:"🏛️",name:"Music Theorist",desc:"Spend 25 hours on theory"},
  tht50:{icon:"🌟",name:"Theorist",desc:"Spend 50 hours on theory"},
  et1:{icon:"👂",name:"First Listen",desc:"Log your first ear training session"},
  et10:{icon:"🎧",name:"Sharp Ears",desc:"Log 10 ear training sessions"},
  et30:{icon:"🔊",name:"Keen Ear",desc:"Log 30 ear training sessions"},
  course_first_lesson:{icon:"📖",name:"First Lesson",desc:"Complete your first course lesson"},
  course_theory_level1:{icon:"🎓",name:"Theory: Level 1",desc:"Complete every lesson in Music Theory Level 1"},
  course_theory_level2:{icon:"🏆",name:"Theory: Level 2",desc:"Complete every lesson in Music Theory Level 2"},
  ett1:{icon:"⏱️",name:"Listening Hour",desc:"Spend 1 hour on ear training"},
  ett5:{icon:"🎵",name:"Tuned In",desc:"Spend 5 hours on ear training"},
  ett25:{icon:"🎶",name:"Golden Ear",desc:"Spend 25 hours on ear training"},
  ett50:{icon:"👑",name:"Perfect Pitch",desc:"Spend 50 hours on ear training"},
  d60:{icon:"🎯",name:"Deep Practice",desc:"Complete a session of 1 hour or more"},
  d120:{icon:"🏋️",name:"Marathon",desc:"Complete a session of 2 hours or more"},
  d180:{icon:"🌋",name:"In the Zone",desc:"Complete a session of 3 hours or more"},
  mo20:{icon:"📅",name:"Monthly Commitment",desc:"Practice 20+ days in a calendar month"},
  bk1:{icon:"📗",name:"First Chapter",desc:"Log your first method book session"},
  bk10:{icon:"📘",name:"Methodical",desc:"Log 10 method book sessions"},
  bk30:{icon:"📙",name:"By the Method",desc:"Log 30 method book sessions"},
  bkt5:{icon:"⏱️",name:"Method Hours",desc:"Spend 5 hours on method books"},
  bkt25:{icon:"🏆",name:"Textbook",desc:"Spend 25 hours on method books"},
  vcomp:{icon:"🎨",name:"Complete Session",desc:"Log a session with piece, technique & more"},
  v4:{icon:"🌈",name:"Well-Rounded",desc:"Include 4+ practice types in a session"},
  sv1:{icon:"🛡️",name:"Safety Net",desc:"Use your first streak save token"},
  sv3:{icon:"🔄",name:"Resilient",desc:"Save your streak 3 times"},
  sv5:{icon:"💪",name:"Never Give Up",desc:"Save your streak 5 times"},
  r1:{icon:"📖",name:"First Read",desc:"Save your first theory sheet"},
  r5:{icon:"📚",name:"Keen Reader",desc:"Save 5 theory sheets"},
  r10:{icon:"🎓",name:"Music Scholar",desc:"Finish reading 10 theory sheets"},
  r25:{icon:"🏛️",name:"Deep Dive",desc:"Finish reading 25 theory sheets"},
  c1:{icon:"🎵",name:"Collector",desc:"Add your first piece to your collection"},
  c5:{icon:"🎼",name:"Curator",desc:"Have 5 pieces in your collection"},
  c10:{icon:"📀",name:"Aficionado",desc:"Build a collection of 10 pieces"},
  c25:{icon:"🎹",name:"Connoisseur",desc:"Amass a collection of 25 pieces"},
  c5l:{icon:"📝",name:"Busy Hands",desc:"Have 5 pieces on the go at once"},
  c3a:{icon:"🌠",name:"Dream Big",desc:"Add 3 pieces to your aspire list"},
  c10a:{icon:"✨",name:"Sky's the Limit",desc:"Have 10 pieces on your aspire list"},
  c1c:{icon:"✅",name:"First Finish",desc:"Mark your first piece as completed"},
  c3c:{icon:"🥉",name:"Hat Trick",desc:"Complete 3 pieces"},
  c5c:{icon:"🏆",name:"Completionist",desc:"Complete 5 pieces"},
  c10c:{icon:"👑",name:"Grandmaster",desc:"Complete 10 pieces"},
  g1:{icon:"🎯",name:"Fixer",desc:"Play your first Passage Fixer game"},
  g5t:{icon:"🔧",name:"Getting Into It",desc:"Play 5 Passage Fixer games"},
  g25t:{icon:"🛠️",name:"Regular Fixer",desc:"Play 25 Passage Fixer games"},
  g1c:{icon:"💥",name:"Cleared!",desc:"Clear your first passage"},
  g10c:{icon:"⚡",name:"Passage Master",desc:"Clear 10 passages"},
  g50c:{icon:"🌊",name:"Unstoppable",desc:"Clear 50 passages"},
  g1p:{icon:"💎",name:"Clean Run",desc:"Clear a passage without mistakes"},
  g5p:{icon:"🌟",name:"Perfectionist",desc:"Clear 5 passages without mistakes"},
  g3d:{icon:"🗺️",name:"Explorer",desc:"Work on 3 different passages"},
  g10d:{icon:"🧭",name:"Passage Explorer",desc:"Work on 10 different passages"},
  g5:{icon:"🔑",name:"Level 5",desc:"Reach level 5 on a single passage"},
  g10:{icon:"🚀",name:"Level 10",desc:"Reach level 10 on a single passage"},
  nrg1:{icon:"🎵",name:"First Game",desc:"Play your first note recognition game"},
  nrg10:{icon:"🎵",name:"Keen Player",desc:"Play 10 note recognition games"},
  nrg50:{icon:"🎵",name:"Note Enthusiast",desc:"Play 50 note recognition games"},
  nrs5:{icon:"🎵",name:"First Notes",desc:"Score 5 correct in a single game"},
  nrs10:{icon:"🎵",name:"Note Spotter",desc:"Score 10 correct in a single game"},
  nrs20:{icon:"🎵",name:"Sharp Eyes",desc:"Score 20 correct in a single game"},
  nrs30:{icon:"🎵",name:"Note Ace",desc:"Score 30 correct in a single game"},
  nrs50:{icon:"🎵",name:"Note Master",desc:"Score 50 correct in a single game"},
  nrb10:{icon:"🎵",name:"Bass Reader",desc:"Score 10 correct in the bass clef"},
  nrmix:{icon:"🎵",name:"Mixed Master",desc:"Score 10 correct with mixed clef"},
  nracc:{icon:"🎵",name:"Sharps & Flats",desc:"Score 10 correct with accidentals"},
  nrtreb:{icon:"🎵",name:"Treble Reader",desc:"Score 10 correct in the treble clef"},
  nrkey:{icon:"🎵",name:"In Key",desc:"Score 10 correct in key-signature mode"},
  nrkey3:{icon:"🎵",name:"Key Explorer",desc:"Play key-signature mode in 3 different keys"},
  crg1:{icon:"🎹",name:"First Chord",desc:"Play your first chord recognition game"},
  crg10:{icon:"🎹",name:"Chord Keen",desc:"Play 10 chord recognition games"},
  crg50:{icon:"🎹",name:"Chord Enthusiast",desc:"Play 50 chord recognition games"},
  crs10:{icon:"🎹",name:"Chord Spotter",desc:"Score 10 correct in a single chord game"},
  crs20:{icon:"🎹",name:"Triad Tracker",desc:"Score 20 correct in a single chord game"},
  crs30:{icon:"🎹",name:"Chord Master",desc:"Score 30 correct in a single chord game"},
  crtreb:{icon:"🎹",name:"Treble Chords",desc:"Score 10 correct in the treble clef"},
  crbass:{icon:"🎹",name:"Bass Chords",desc:"Score 10 correct in the bass clef"},
  crkey:{icon:"🎹",name:"Key Aware",desc:"Score 10 correct in key-signature mode"},
  cmp1:{icon:"📣",name:"First Post",desc:"Share your first post with the community"},
  cmp10:{icon:"📣",name:"Contributor",desc:"Share 10 posts with the community"},
  cmp25:{icon:"📣",name:"Active Voice",desc:"Share 25 posts with the community"},
  cmp50:{icon:"📣",name:"Community Pillar",desc:"Share 50 posts with the community"},
  cmc1:{icon:"💬",name:"First Comment",desc:"Leave your first comment"},
  cmc10:{icon:"💬",name:"Conversationalist",desc:"Leave 10 comments"},
  cmc50:{icon:"💬",name:"Engaged",desc:"Leave 50 comments"},
  cmc100:{icon:"💬",name:"Always Chatting",desc:"Leave 100 comments"},
  cmr1:{icon:"❤️",name:"Show Some Love",desc:"Give your first reaction"},
  cmr25:{icon:"❤️",name:"Supportive",desc:"Give 25 reactions"},
  cmr100:{icon:"❤️",name:"Hype Squad",desc:"Give 100 reactions"},
  cmcs:{icon:"🗣️",name:"Conversation Starter",desc:"Have one of your posts attract 5 or more comments"},
  cmav:{icon:"📸",name:"Say Cheese",desc:"Add a profile photo"},
  lv1:{icon:"📺",name:"Tuned In Live",desc:"Join your first live stream"},
  lv5:{icon:"📺",name:"Front Row",desc:"Join 5 live streams"},
  lv10:{icon:"📺",name:"Devoted Viewer",desc:"Join 10 live streams"},
  tmo25:{icon:"📆",name:"Big Month",desc:"Log 25 hours of practice in a single calendar month"},
  pweek:{icon:"🗓️",name:"Perfect Week",desc:"Practise all 7 days of a single calendar week"},
  wkwarr:{icon:"🌅",name:"Weekend Warrior",desc:"Practise on both Saturday and Sunday of the same weekend"},
  renais:{icon:"🎨",name:"Renaissance Musician",desc:"Practise every type: piece, technique, sight-reading, improvisation, theory, ear training and method book"},
  rm1:{name:"First Steps",desc:"Begin your roadmap journey"},
  rm2:{name:"Beginner",desc:"Reach the Beginner stage (50h)"},
  rm3:{name:"Foundations",desc:"Reach the Foundations stage (150h)"},
  rm4:{name:"Intermediate",desc:"Reach the Intermediate stage (350h)"},
  rm5:{name:"Confident",desc:"Reach the Confident stage (700h)"},
  rm6:{name:"Advanced",desc:"Reach the Advanced stage (1,200h)"},
  rm7:{name:"Performer",desc:"Reach the Performer stage (2,000h)"},
  rm8:{name:"Artist",desc:"Reach the Artist stage (3,500h)"},
  };
  // Roadmap stage trophies render the level's statue artwork (not an SVG badge).
  const ACH_TROPHY_IMG = { rm1:"/statue-l1.webp",rm2:"/statue-l2.webp",rm3:"/statue-l3.webp",rm4:"/statue-l4.webp",rm5:"/statue-l5.webp",rm6:"/statue-l6.webp",rm7:"/statue-l7.webp",rm8:"/statue-l8.webp" };

  const ACH_CAT = {
  s1:"sessions",s10:"sessions",s50:"sessions",s100:"sessions",s250:"sessions",s500:"sessions",
  t1:"time",t10:"time",t50:"time",t100:"time",t500:"time",
  k3:"streak",k7:"streak",k14:"streak",k30:"streak",k60:"streak",k100:"streak",k180:"streak",k365:"streak",
  p1:"pieces",p5:"pieces",p15:"pieces",p30:"pieces",p50:"pieces",
  pd1:"pieces",pd5:"pieces",pd10:"pieces",pd20:"pieces",
  sc1:"scales",sc5:"scales",sc15:"scales",ss5:"scales",ss10:"scales",ss25:"scales",ss50:"scales",
  sr1:"sightread",sr10:"sightread",sr30:"sightread",
  srt1:"sightread",srt5:"sightread",srt25:"sightread",srt50:"sightread",
  im1:"improv",im10:"improv",im30:"improv",
  imt1:"improv",imt5:"improv",imt25:"improv",imt50:"improv",
  th1:"theorycat",th10:"theorycat",th30:"theorycat",
  tht1:"theorycat",tht5:"theorycat",tht25:"theorycat",tht50:"theorycat",
  et1:"eartraining",et10:"eartraining",et30:"eartraining",
  ett1:"eartraining",ett5:"eartraining",ett25:"eartraining",ett50:"eartraining",
  d60:"depth",d120:"depth",d180:"depth",
  mo20:"sessions",
  bk1:"books",bk10:"books",bk30:"books",bkt5:"books",bkt25:"books",
  vcomp:"variety",v4:"variety",
  sv1:"saves",sv3:"saves",sv5:"saves",
  r1:"reading",r5:"reading",r10:"reading",r25:"reading",
  c1:"library",c5:"library",c10:"library",c25:"library",c5l:"library",c3a:"library",c10a:"library",c1c:"library",c3c:"library",c5c:"library",c10c:"library",
  g1:"game",g5t:"game",g25t:"game",g1c:"game",g10c:"game",g50c:"game",g1p:"game",g5p:"game",g3d:"game",g10d:"game",g5:"game",g10:"game",
  nrg1:"noterec",nrg10:"noterec",nrg50:"noterec",nrs5:"noterec",nrs10:"noterec",nrs20:"noterec",nrs30:"noterec",nrs50:"noterec",nrb10:"noterec",nrmix:"noterec",nracc:"noterec",nrtreb:"noterec",nrkey:"noterec",nrkey3:"noterec",
  crg1:"chordrec",crg10:"chordrec",crg50:"chordrec",crs10:"chordrec",crs20:"chordrec",crs30:"chordrec",crtreb:"chordrec",crbass:"chordrec",crkey:"chordrec",
  cmp1:"community",cmp10:"community",cmp25:"community",cmp50:"community",cmc1:"community",cmc10:"community",cmc50:"community",cmc100:"community",cmr1:"community",cmr25:"community",cmr100:"community",cmcs:"community",cmav:"community",
  lv1:"live",lv5:"live",lv10:"live",
  rm1:"roadmap",rm2:"roadmap",rm3:"roadmap",rm4:"roadmap",rm5:"roadmap",rm6:"roadmap",rm7:"roadmap",rm8:"roadmap",
  tmo25:"time",pweek:"streak",wkwarr:"sessions",renais:"variety",
  course_first_lesson:"courses",course_theory_level1:"courses",course_theory_level2:"courses",
  };

  const ACH_CAT_ORDER = {
  sessions:["s1","s10","s50","s100","s250","s500","mo20","wkwarr"],
  time:["t1","t10","t50","t100","t500","tmo25"],
  streak:["k3","k7","k14","k30","k60","k100","k180","k365","pweek"],
  pieces:["p1","p5","p15","p30","p50","pd1","pd5","pd10","pd20"],
  scales:["sc1","sc5","sc15","ss5","ss10","ss25","ss50"],
  sightread:["sr1","sr10","sr30","srt1","srt5","srt25","srt50"],
  improv:["im1","im10","im30","imt1","imt5","imt25","imt50"],
  theorycat:["th1","th10","th30","tht1","tht5","tht25","tht50"],
  eartraining:["et1","et10","et30","ett1","ett5","ett25","ett50"],
  depth:["d60","d120","d180"],
  books:["bk1","bk10","bk30","bkt5","bkt25"],
  variety:["vcomp","v4","renais"],
  saves:["sv1","sv3","sv5"],
  reading:["r1","r5","r10","r25"],
  library:["c1","c5","c10","c25","c5l","c3a","c10a","c1c","c3c","c5c","c10c"],
  game:["g1","g5t","g25t","g1c","g10c","g50c","g1p","g5p","g3d","g10d","g5","g10"],
  noterec:["nrg1","nrg10","nrg50","nrs5","nrs10","nrs20","nrs30","nrs50","nrb10","nrmix","nracc","nrtreb","nrkey","nrkey3"],
  chordrec:["crg1","crg10","crg50","crs10","crs20","crs30","crtreb","crbass","crkey"],
  community:["cmp1","cmp10","cmp25","cmp50","cmc1","cmc10","cmc50","cmc100","cmr1","cmr25","cmr100","cmcs","cmav"],
  live:["lv1","lv5","lv10"],
  roadmap:["rm1","rm2","rm3","rm4","rm5","rm6","rm7","rm8"],
  courses:["course_first_lesson","course_theory_level1","course_theory_level2"],
  };

  /* ── Badge SVG system (ported from practice-log.html) ── */
  const _AI={NOTE:`<path fill="currentColor" stroke="none" d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>`,CLOCK:`<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,TIMER:`<path d="M10 2h4"/><circle cx="12" cy="13" r="8"/><polyline points="12 9 12 13 15 15"/>`,CALCK:`<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 14 11 16 15 12"/>`,MEDAL:`<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>`,TROPHY:`<path d="M6 9H4.5a2.5 2.5 0 0 0 0 5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>`,CROWN:`<path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><line x1="2" y1="20" x2="22" y2="20"/>`,GLASS:`<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 1 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>`,STAR:`<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,STARF:`<polygon fill="currentColor" stroke="none" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,GEM:`<path d="M6 3h12l4 6-10 13L2 9z"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="3" x2="7" y2="9"/><line x1="12" y1="3" x2="17" y2="9"/>`,FLAME:`<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>`,SHIELD:`<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,SHIELDC:`<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>`,MOON:`<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`,SUN:`<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`,SPARKLE:`<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>`,GLOBE:`<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`,TARGET:`<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>`,LAYERS:`<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`,MAGNIFY:`<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,EYE:`<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,SCOPE:`<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>`,BOOK:`<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,BOOKS:`<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>`,LIGHTB:`<line x1="9" y1="21" x2="15" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M12 2a7 7 0 0 1 5.196 11.9 5 5 0 0 0-2.196 4.1H9a5 5 0 0 0-2.196-4.1A7 7 0 0 1 12 2z"/>`,BOLT:`<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,WAVE:`<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>`,REFRESH:`<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>`,GEAR:`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,WAVEFRM:`<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`,NOTES2:`<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>`,WRENCH:`<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`,INFINITY:`<path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/>`,STEPS:`<polyline points="4 19 4 15 8 15 8 11 12 11 12 7 16 7 16 3 20 3"/>`,PIANO:`<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M6 3v10M10 3v10M14 3v10M18 3v10"/><rect fill="currentColor" stroke="none" x="4" y="3" width="3" height="7" rx="0.5"/><rect fill="currentColor" stroke="none" x="8" y="3" width="3" height="7" rx="0.5"/><rect fill="currentColor" stroke="none" x="13" y="3" width="3" height="7" rx="0.5"/><rect fill="currentColor" stroke="none" x="17" y="3" width="3" height="7" rx="0.5"/>`,STAGE:`<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>`,COMPASS:`<circle cx="12" cy="12" r="10"/><polygon fill="currentColor" stroke="none" points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>`,MAP:`<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>`,SWORDS:`<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/>`,BINOS:`<circle cx="7" cy="14" r="5"/><circle cx="17" cy="14" r="5"/><path d="M7 9V6h10v3"/><line x1="12" y1="14" x2="12" y2="9"/>`,HEADPH:`<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>`,PALETTE:`<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>`,REPEAT:`<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>`,BELL:`<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,AWARD:`<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/><circle cx="12" cy="8" r="2" fill="currentColor" stroke="none"/>`,SUNRISE:`<path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="3" y1="22" x2="21" y2="22"/>`,};

  const ACH_ICON_MAP={s1:_AI.NOTE,s10:_AI.CLOCK,s50:_AI.CALCK,s100:_AI.MEDAL,s250:_AI.TROPHY,s500:_AI.CROWN,t1:_AI.GLASS,t10:_AI.TIMER,t50:_AI.STAR,t100:_AI.STARF,t500:_AI.GEM,k3:_AI.FLAME,k7:_AI.SHIELD,k14:_AI.SHIELDC,k30:_AI.MOON,k60:_AI.SUN,k100:_AI.SPARKLE,k180:_AI.SPARKLE,k365:_AI.GLOBE,p1:_AI.NOTE,p5:_AI.NOTES2,p15:_AI.BOOK,p30:_AI.PIANO,p50:_AI.STAGE,pd1:_AI.TARGET,pd5:_AI.LAYERS,pd10:_AI.MAGNIFY,pd20:_AI.GEM,sc1:_AI.STEPS,sc5:_AI.REFRESH,sc15:_AI.WAVEFRM,ss5:_AI.REPEAT,ss10:_AI.GEAR,ss25:_AI.SWORDS,ss50:_AI.CROWN,sr1:_AI.EYE,sr10:_AI.BINOS,sr30:_AI.SCOPE,srt1:_AI.CLOCK,srt5:_AI.BOOK,srt25:_AI.COMPASS,srt50:_AI.STARF,im1:_AI.LIGHTB,im10:_AI.BOLT,im30:_AI.SPARKLE,imt1:_AI.WAVE,imt5:_AI.PALETTE,imt25:_AI.FLAME,imt50:_AI.INFINITY,th1:_AI.BOOK,th10:_AI.BOOKS,th30:_AI.AWARD,tht1:_AI.CLOCK,tht5:_AI.BOOKS,tht25:_AI.GLOBE,tht50:_AI.STARF,et1:_AI.HEADPH,et10:_AI.WAVE,et30:_AI.BELL,ett1:_AI.CLOCK,ett5:_AI.HEADPH,ett25:_AI.NOTES2,ett50:_AI.CROWN,d60:_AI.CLOCK,d120:_AI.TROPHY,d180:_AI.GEM,mo20:_AI.CALCK,bk1:_AI.BOOK,bk10:_AI.BOOKS,bk30:_AI.MEDAL,bkt5:_AI.CLOCK,bkt25:_AI.TROPHY,vcomp:_AI.LAYERS,v4:_AI.SPARKLE,sv1:_AI.SHIELD,sv3:_AI.SHIELDC,sv5:_AI.CROWN,r1:_AI.BOOK,r5:_AI.BOOKS,r10:_AI.MEDAL,r25:_AI.GLOBE,c1:_AI.NOTE,c5:_AI.NOTES2,c10:_AI.BOOKS,c25:_AI.CROWN,c5l:_AI.LAYERS,c3a:_AI.STAR,c10a:_AI.STARF,c1c:_AI.CALCK,c3c:_AI.TROPHY,c5c:_AI.TROPHY,c10c:_AI.CROWN,g1:_AI.WRENCH,g5t:_AI.WRENCH,g25t:_AI.GEAR,g1c:_AI.BOLT,g10c:_AI.BOLT,g50c:_AI.WAVE,g1p:_AI.GEM,g5p:_AI.GEM,g3d:_AI.COMPASS,g10d:_AI.MAP,g5:_AI.STARF,g10:_AI.STARF,nrg1:_AI.NOTES2,nrg10:_AI.PIANO,nrg50:_AI.STAGE,nrs5:_AI.NOTE,nrs10:_AI.EYE,nrs20:_AI.BINOS,nrs30:_AI.SCOPE,nrs50:_AI.STARF,nrb10:_AI.WAVE,nrmix:_AI.LAYERS,nracc:_AI.SPARKLE,nrtreb:_AI.EYE,nrkey:_AI.STEPS,nrkey3:_AI.COMPASS,crg1:_AI.PIANO,crg10:_AI.LAYERS,crg50:_AI.STAGE,crs10:_AI.TARGET,crs20:_AI.BINOS,crs30:_AI.STARF,crtreb:_AI.EYE,crbass:_AI.WAVE,crkey:_AI.STEPS,cmp1:_AI.SPARKLE,cmp10:_AI.NOTES2,cmp25:_AI.AWARD,cmp50:_AI.CROWN,cmc1:_AI.BELL,cmc10:_AI.LAYERS,cmc50:_AI.STAR,cmc100:_AI.STARF,cmr1:_AI.SPARKLE,cmr25:_AI.GEM,cmr100:_AI.CROWN,cmcs:_AI.BELL,cmav:_AI.SPARKLE,lv1:_AI.BOLT,lv5:_AI.STAR,lv10:_AI.TROPHY,tmo25:_AI.CALCK,pweek:_AI.CALCK,wkwarr:_AI.SUNRISE,renais:_AI.PALETTE,course_first_lesson:_AI.BOOK,course_theory_level1:_AI.MEDAL,course_theory_level2:_AI.TROPHY,};

  const _BADGE_SHAPE={circle:`<circle cx="27" cy="27" r="24.5"`,hex:`<polygon points="27,3 48,15.5 48,38.5 27,51 6,38.5 6,15.5"`,shield:`<path d="M27 3L49 13v21q0 14-22 17Q5 48 5 34V13z"`,star:`<polygon points="27,2 33.2,18.5 50.8,19.3 37,30.3 41.7,47.2 27,37.5 12.3,47.2 17,30.3 3.2,19.3 20.8,18.5"`,diamond:`<polygon points="27,3 51,27 27,51 3,27"`,};
  const _BADGE_SHINE={circle:`<path d="M10 14Q27 3 44 14Q27 23 10 14Z" fill="rgba(255,255,255,.14)"/>`,hex:`<path d="M14 16L27 6 40 16Q27 24 14 16Z" fill="rgba(255,255,255,.14)"/>`,shield:`<path d="M11 14L27 6 43 14Q27 22 11 14Z" fill="rgba(255,255,255,.14)"/>`,star:`<path d="M18 18L27 5 36 18Q27 25 18 18Z" fill="rgba(255,255,255,.14)"/>`,diamond:`<path d="M16 18L27 4 38 18Q27 26 16 18Z" fill="rgba(255,255,255,.14)"/>`,};
  const _BADGE_CAT_SHAPE={sessions:'circle',time:'hex',streak:'shield',pieces:'diamond',scales:'hex',sightread:'circle',improv:'star',theorycat:'circle',eartraining:'hex',depth:'star',books:'circle',variety:'star',saves:'shield',reading:'shield',community:'circle',game:'hex',library:'diamond',noterec:'star',chordrec:'diamond',live:'star',courses:'shield',};
  const _BADGE_PALETTE={sessions:['#93c5fd','#2563eb','#1d4ed8'],time:['#fde68a','#f59e0b','#b45309'],streak:['#fca5a5','#ef4444','#b91c1c'],pieces:['#c4b5fd','#7c3aed','#5b21b6'],scales:['#6ee7b7','#059669','#047857'],sightread:['#67e8f9','#0891b2','#0e7490'],improv:['#fdba74','#ea580c','#c2410c'],theorycat:['#86efac','#16a34a','#15803d'],eartraining:['#d8b4fe','#9333ea','#7e22ce'],depth:['#fca5a5','#dc2626','#991b1b'],books:['#a5b4fc','#4338ca','#3730a3'],variety:['#f9a8d4','#db2777','#be185d'],saves:['#fde68a','#ca8a04','#a16207'],reading:['#5eead4','#0d9488','#0f766e'],community:['#7dd3fc','#0284c7','#0369a1'],game:['#fdba74','#c2410c','#9a3412'],library:['#f9a8d4','#be185d','#9d174d'],noterec:['#d9f99d','#65a30d','#3f6212'],chordrec:['#f0abfc','#c026d3','#86198f'],live:['#fda4af','#e11d48','#9f1239'],roadmap:['#fde68a','#f0a500','#9a6a00'],courses:['#6ee7b7','#10b981','#047857'],};

  function _lerpHex(h1,h2,t){const p=s=>parseInt(s,16);const r=Math.round(p(h1.slice(1,3))+(p(h2.slice(1,3))-p(h1.slice(1,3)))*t);const g=Math.round(p(h1.slice(3,5))+(p(h2.slice(3,5))-p(h1.slice(3,5)))*t);const b=Math.round(p(h1.slice(5,7))+(p(h2.slice(5,7))-p(h1.slice(5,7)))*t);return`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;}
  let _bdgUID=0;
  // NB: gradient ids are namespaced ("smmg…") so they never collide with the
  // host page's own achBadgeSVG ids ("g…"). A duplicate SVG gradient id makes
  // url(#…) resolve to the wrong/removed node → blank badge graphics.
  function achBadgeSVG(id,size=38){const _ti=ACH_TROPHY_IMG[id];if(_ti)return`<img src="${_ti}" width="${size}" height="${size}" alt="" draggable="false" loading="lazy" style="display:block;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(30,18,4,.35))">`;const cat=ACH_CAT[id]||'sessions';const uid=++_bdgUID;const shape=_BADGE_CAT_SHAPE[cat]||'circle';const el=_BADGE_SHAPE[shape];const pal=_BADGE_PALETTE[cat]||_BADGE_PALETTE.sessions;const catIds=ACH_CAT_ORDER[cat]||[id];const ti=Math.max(0,catIds.indexOf(id));const t=catIds.length>1?ti/(catIds.length-1):0;const topC=t<=0.5?_lerpHex(pal[0],pal[1],t*2):pal[1];const botC=t<=0.5?pal[2]:_lerpHex(pal[2],pal[1],(1-t)*2);const iconPaths=ACH_ICON_MAP[id]||_AI.STAR;return`<svg viewBox="0 0 54 54" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="smmg${uid}" x1="27" y1="2" x2="27" y2="52" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${topC}"/><stop offset="100%" stop-color="${botC}"/></linearGradient></defs>${el} fill="url(#smmg${uid})" stroke="rgba(0,0,0,.18)" stroke-width="1.5"/>${_BADGE_SHINE[shape]}<g transform="translate(15,15)"><svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.95)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">${iconPaths}</svg></g></svg>`;}

  const POST_TYPES = {
    progress:    { label: "Share Your Progress", short: "Progress",     color: "#10b981", bg: "rgba(16,185,129,.15)",  border: "rgba(16,185,129,.3)"  },
    feedback:    { label: "Get Feedback",         short: "Feedback",     color: "#f5c518", bg: "rgba(245,197,24,.12)",  border: "rgba(245,197,24,.3)"  },
    question:    { label: "Ask a Question",       short: "Question",     color: "#60a5fa", bg: "rgba(96,165,250,.15)",  border: "rgba(96,165,250,.3)"  },
    post:        { label: "Just Post",            short: "Post",         color: "#9ca3af", bg: "rgba(156,163,175,.1)",  border: "rgba(156,163,175,.22)" },
    practice_log:{ label: "Practice Log",         short: "Practice Log", color: "#a78bfa", bg: "rgba(167,139,250,.12)", border: "rgba(167,139,250,.3)" }
  };

  /* ───────────────────────────── injected CSS ─────────────────────────────── */
  const _CSS = `
    .member-modal-backdrop {
      position: fixed; inset: 0; z-index: 999;
      background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
    }
    .member-modal {
      background: var(--surface); border: 1.5px solid var(--border);
      border-radius: 16px; width: 100%; max-width: 540px; max-height: 88vh;
      display: flex; flex-direction: column;
      position: relative; overflow: hidden; color: var(--text);
      box-shadow: 0 24px 60px -14px rgba(0,0,0,.4);
      animation: memberModalIn .2s cubic-bezier(.22,.61,.36,1);
    }
    @keyframes memberModalIn { from { opacity: 0; transform: translateY(14px) scale(.97); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .member-modal { animation: none; } }
    .member-modal-close {
      position: absolute; top: 14px; right: 14px; z-index: 3;
      background: rgba(255,255,255,.7); border: 1px solid var(--border); color: var(--text-muted);
      font-size: 1.15rem; cursor: pointer; line-height: 1;
      width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
      border-radius: 50%; transition: background .15s, color .15s; backdrop-filter: blur(4px);
    }
    .member-modal-close:hover { background: #fff; color: var(--text); }
    .member-modal-hero {
      display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px;
      padding: 30px 24px 20px;
      border-bottom: 1px solid var(--border); flex-shrink: 0;
      background: linear-gradient(180deg, var(--mm-tint, var(--surface-2)) 0%, var(--surface) 76%);
    }
    .member-modal-avatar, .member-modal-avatar-initials {
      width: 84px; height: 84px; border-radius: 50%; flex-shrink: 0;
      box-shadow: 0 0 0 4px var(--surface), 0 8px 18px -5px rgba(60,40,20,.3);
    }
    .member-modal-avatar { object-fit: cover; }
    .member-modal-avatar-initials { display: flex; align-items: center; justify-content: center; font-size: 1.7rem; font-weight: 800; }
    .member-modal-avatar.is-founder, .member-modal-avatar-initials.is-founder {
      box-shadow: 0 0 0 3px rgba(245,197,24,.75), 0 8px 18px -5px rgba(60,40,20,.3);
    }
    .member-modal-info { display: flex; flex-direction: column; align-items: center; gap: 5px; margin-top: 12px; min-width: 0; max-width: 100%; }
    .member-modal-name {
      font-size: 1.22rem; font-weight: 800; color: var(--text); line-height: 1.2;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .member-modal-name .member-star { width: 15px; height: 15px; color: #e0a800; flex-shrink: 0; }
    .member-modal-badge {
      display: inline-flex; align-items: center;
      font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
      color: #6a5bb5; background: rgba(124,91,182,.1);
      border: 1px solid rgba(124,91,182,.25);
      border-radius: 20px; padding: 2px 9px;
    }
    .member-modal-headline { font-size: 0.88rem; color: var(--text-muted); line-height: 1.45; max-width: 380px; }
    .member-modal-meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 5px 16px; margin-top: 7px; }
    .member-modal-meta-item {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 0.78rem; color: var(--text-muted); line-height: 1.3;
    }
    .member-modal-meta-item svg { flex-shrink: 0; opacity: .8; }
    .member-modal-tabs {
      display: flex; border-bottom: 1px solid var(--border);
      padding: 0 10px; flex-shrink: 0; background: var(--surface);
      overflow-x: auto; scrollbar-width: none;
    }
    .member-modal-tabs::-webkit-scrollbar { display: none; }
    .member-modal-tab {
      background: none; border: none; cursor: pointer; flex-shrink: 0;
      padding: 11px 16px; font-size: 0.82rem; font-weight: 700;
      color: var(--text-muted); font-family: inherit; white-space: nowrap;
      border-bottom: 2px solid transparent; margin-bottom: -1px;
      transition: color .15s, border-color .15s;
    }
    .member-modal-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .member-modal-tab:hover:not(.active) { color: var(--text); }
    .member-modal-panels { flex: 1; min-height: 0; overflow-y: auto; padding: 20px; }
    .member-modal-panel { display: none; }
    .member-modal-panel.active { display: block; }
    .mm-about-section { margin-bottom: 22px; }
    .mm-about-label {
      font-size: 0.66rem; font-weight: 700; color: #b0a294;
      text-transform: uppercase; letter-spacing: .09em; margin-bottom: 10px;
    }
    .mm-about-value { font-size: 0.9rem; color: #6a5d53; line-height: 1.7; font-weight: 400; }
    /* App-style stats strip — gives the About tab structure so it reads like a
       profile screen, not a document. Neutral surface tiles (not a tinted box). */
    .mm-stats { display: flex; gap: 9px; margin-bottom: 20px; }
    .mm-stat {
      flex: 1; min-width: 0; text-align: center;
      background: var(--surface-2); border: 1px solid var(--border);
      border-radius: 13px; padding: 13px 8px 11px;
    }
    .mm-stat-num { font-size: 1.18rem; font-weight: 800; color: var(--text); line-height: 1.05; letter-spacing: -.01em; }
    .mm-stat-num small { font-size: 0.72rem; font-weight: 800; }
    .mm-stat-lbl { font-size: 0.6rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; margin-top: 5px; }
    .mm-stat-skeleton { color: var(--border); }
    /* Streak chip in the hero (current streak) */
    .member-modal-streak { margin-top: 9px; min-height: 0; }
    .mm-streak-chip {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 0.74rem; font-weight: 700; color: #b45309;
      background: linear-gradient(180deg, #fff6e0, #fdeaca);
      border: 1px solid #f2d488; border-radius: 20px; padding: 3px 11px 3px 9px;
    }
    .mm-streak-chip svg { color: #f59e0b; flex-shrink: 0; }
    .mm-streak-chip b { color: #92400e; font-weight: 800; }
    /* "Now learning" preview (About tab) */
    .mm-learning-sec { margin-bottom: 22px; }
    .mm-learn-item { display: flex; align-items: center; gap: 11px; padding: 9px 0; border-bottom: 1px solid var(--border); }
    .mm-learn-item:last-child { border-bottom: none; }
    .mm-learn-ico { width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #b8860b; background: linear-gradient(180deg, #fdf3d6, #fbe9b8); }
    .mm-learn-ico svg { width: 16px; height: 16px; }
    .mm-learn-title { font-size: 0.88rem; font-weight: 600; color: var(--text); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .mm-learn-comp { font-size: 0.76rem; color: var(--text-muted); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    /* Bio — a quote card in the same surface language as the stat tiles, with a
       soft gold quotation mark so it reads as the member's own words, not a
       document. Cohesive with the tiles above; gives the text an identity. */
    .mm-bio {
      position: relative;
      background: var(--surface-2); border: 1px solid var(--border); border-radius: 13px;
      padding: 30px 18px 16px;
      font-size: 0.9rem; color: #5b5048; line-height: 1.62; font-weight: 400;
    }
    .mm-bio::before {
      content: "\\201C";
      position: absolute; top: 7px; left: 13px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 2.4rem; line-height: 1; color: var(--accent); opacity: .42;
      pointer-events: none;
    }
    .mm-social-links { display: flex; gap: 8px; flex-wrap: wrap; }
    .mm-social-links a {
      display: flex; align-items: center; gap: 7px;
      font-size: 0.78rem; font-weight: 600; color: var(--text-muted);
      background: var(--surface); border: 1.5px solid var(--border);
      border-radius: var(--radius); padding: 7px 14px; text-decoration: none;
      transition: border-color .15s, color .15s;
    }
    .mm-social-links a:hover { border-color: var(--accent); color: var(--accent); }
    .mm-social-links a svg { flex-shrink: 0; }
    .mm-post-item {
      background: var(--surface); border: 1.5px solid var(--border);
      border-radius: 12px; padding: 13px 15px; margin-bottom: 9px;
      cursor: pointer; box-shadow: 0 1px 2px rgba(60,40,20,.04);
      transition: border-color .15s, box-shadow .15s;
    }
    .mm-post-item:hover { border-color: #dcdee3; box-shadow: 0 4px 14px rgba(60,40,20,.08); }
    .mm-post-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 7px; }
    .mm-post-title { font-size: 0.92rem; font-weight: 700; color: var(--text); line-height: 1.3; margin-bottom: 3px; }
    .mm-post-preview { font-size: 0.82rem; color: var(--text-muted); line-height: 1.5; white-space: pre-wrap;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .mm-post-time { font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; flex-shrink: 0; }
    .mm-activity-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 12px 0; border-bottom: 1px solid var(--border);
    }
    .mm-activity-item:last-child { border-bottom: none; }
    .mm-activity-icon {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 1rem;
    }
    .mm-act-ach-icon { width: 40px; height: 40px; }
    .mm-act-ach-icon > svg { width: 26px; height: 26px; }
    .mm-activity-body { flex: 1; min-width: 0; }
    .mm-activity-title { font-size: 0.88rem; color: var(--text); font-weight: 600; line-height: 1.3; }
    .mm-activity-desc { font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; line-height: 1.3; }
    .mm-activity-time { font-size: 0.72rem; color: var(--text-muted); margin-top: 3px; }
    .mm-ach-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
    .mm-ach-card {
      border: 1.5px solid var(--border); border-radius: 12px; padding: 16px 10px 12px;
      display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center;
      box-shadow: 0 1px 2px rgba(60,40,20,.04);
    }
    .mm-ach-card-name { font-size: 0.78rem; font-weight: 700; line-height: 1.25; }
    .mm-ach-card-desc { font-size: 0.68rem; color: var(--text-muted); line-height: 1.3; }
    .mm-ach-card-date { font-size: 0.65rem; color: var(--text-muted); margin-top: 2px; }
    .mm-tab-empty { text-align: center; padding: 40px 0; color: var(--text-muted); font-size: 0.85rem; }
    .mm-tab-loading { text-align: center; padding: 30px 0; color: var(--text-muted); font-size: 0.85rem; }
    .mm-sentinel { display: flex; align-items: center; justify-content: center; padding: 14px 0; }
    /* Glowing achievement medallion (mirrors community feed) */
    .feed-ach-icon {
      width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
      background: radial-gradient(circle at 50% 36%, #ffffff, var(--g0, rgba(245,158,11,.14)));
      box-shadow: 0 0 0 1.5px var(--g1, rgba(245,158,11,.35)), 0 5px 14px -6px var(--g2, #f59e0b), inset 0 -3px 8px var(--g0, rgba(245,158,11,.14));
    }
    .feed-ach-icon > svg { width: 32px; height: 32px; display: block; }
    .feed-ach-icon::after { content: ""; position: absolute; top: -40%; left: -60%; width: 45%; height: 180%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent); transform: rotate(20deg); pointer-events: none; animation: feedAchSheen 4.5s ease-in-out infinite; }
    @keyframes feedAchSheen { 0% { left: -60%; } 18% { left: 130%; } 100% { left: 130%; } }
    @media (prefers-reduced-motion: reduce) { .feed-ach-icon::after { display: none; } }
    .member-modal .post-type-badge {
      display: inline-block; font-size: 0.65rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .06em;
      border-radius: 20px; padding: 2px 8px; border: 1px solid; white-space: nowrap; flex-shrink: 0;
    }
    /* Tiny tooltip for [data-tip] elements (e.g. the founder star) — works on
       hover (desktop) and tap (mobile), since native title doesn't show on tap. */
    [data-tip] { cursor: help; }
    .smm-tip {
      position: fixed; z-index: 2147483000;
      background: #1f1813; color: #fff;
      font-size: 0.72rem; font-weight: 600; letter-spacing: .01em;
      padding: 5px 9px; border-radius: 7px;
      box-shadow: 0 6px 20px rgba(0,0,0,.28);
      pointer-events: none; white-space: nowrap;
      transform: translate(-50%, calc(-100% - 9px));
      opacity: 0; transition: opacity .12s ease;
    }
    .smm-tip.show { opacity: 1; }
    .smm-tip::after { content: ""; position: absolute; left: 50%; bottom: -5px; transform: translateX(-50%); border: 5px solid transparent; border-top-color: #1f1813; }
    @media (max-width: 768px) {
      .member-modal-backdrop {
        align-items: center;
        padding: 12px 12px calc(70px + env(safe-area-inset-bottom, 0px));
      }
      .member-modal {
        max-height: calc(100vh - 94px - env(safe-area-inset-bottom, 0px));
        max-height: calc(100dvh - 94px - env(safe-area-inset-bottom, 0px));
      }
    }
    @media (max-width: 480px) {
      .member-modal-hero { padding: 26px 20px 18px; }
      .member-modal-avatar, .member-modal-avatar-initials { width: 76px; height: 76px; font-size: 1.5rem; }
    }
  `;

  /* ───────────────────────────── injected HTML ────────────────────────────── */
  const _HTML = `
    <div id="member-modal-backdrop" class="member-modal-backdrop" style="display:none">
      <div class="member-modal">
        <button class="member-modal-close" type="button" aria-label="Close">×</button>
        <div class="member-modal-hero">
          <div id="mm-avatar"></div>
          <div class="member-modal-info">
            <div class="member-modal-name" id="mm-name"></div>
            <div id="mm-badge"></div>
            <div class="member-modal-headline" id="mm-headline"></div>
            <div class="member-modal-meta" id="mm-meta"></div>
            <div class="member-modal-streak" id="mm-streak"></div>
          </div>
        </div>
        <div class="member-modal-tabs">
          <button class="member-modal-tab active" type="button" data-mm-tab="about">About</button>
          <button class="member-modal-tab" type="button" data-mm-tab="achievements">Achievements</button>
          <button class="member-modal-tab" type="button" data-mm-tab="posts">Posts</button>
          <button class="member-modal-tab" type="button" data-mm-tab="activity">Activity</button>
        </div>
        <div class="member-modal-panels">
          <div class="member-modal-panel active" id="mm-panel-about"></div>
          <div class="member-modal-panel" id="mm-panel-achievements"></div>
          <div class="member-modal-panel" id="mm-panel-posts"></div>
          <div class="member-modal-panel" id="mm-panel-activity"></div>
        </div>
      </div>
    </div>
  `;

  /* ────────────────────────────── modal logic ─────────────────────────────── */
  let _mmEmail = null;
  const _MM_PAGE = 20;
  let _mmIO = null;
  let _mmPostsOffset = 0, _mmPostsDone = false, _mmPostsLoading = false;
  let _mmActOffset = 0, _mmActDone = false, _mmActLoading = false, _mmActSessions = [], _mmActAch = [];
  const _MM_SENTINEL = `<div class="mm-sentinel"><div class="loading-spinner"></div></div>`;

  function _mmResetTabs() {
    if (_mmIO) { _mmIO.disconnect(); _mmIO = null; }
    _mmPostsOffset = 0; _mmPostsDone = false; _mmPostsLoading = false;
    _mmActOffset = 0; _mmActDone = false; _mmActLoading = false; _mmActSessions = []; _mmActAch = [];
  }

  function _mmObserve(panel, kind) {
    if (_mmIO) { _mmIO.disconnect(); _mmIO = null; }
    const sentinel = panel.querySelector(".mm-sentinel");
    if (!sentinel || !("IntersectionObserver" in window)) return;
    _mmIO = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        if (kind === "posts") loadMemberPosts(true);
        else if (kind === "activity") loadMemberActivity(true);
      }
    }, { root: document.querySelector(".member-modal-panels"), rootMargin: "160px" });
    _mmIO.observe(sentinel);
  }

  function _mmPostItemHTML(p) {
    const pt = POST_TYPES[p.type];
    const badge = pt
      ? `<span class="post-type-badge" style="color:${pt.color};background:${pt.bg};border-color:${pt.border}">${escHtml(pt.short || pt.label)}</span>`
      : "";
    const title = p.title ? `<div class="mm-post-title">${escHtml(p.title)}</div>` : "";
    let body = p.content ? `<div class="mm-post-preview">${escHtml(p.content)}</div>` : "";
    if (!p.title && !p.content && p.type === "practice_log") body = `<div class="mm-post-preview">Shared a practice session.</div>`;
    return `<div class="mm-post-item" onclick="MemberModal._postClick('${p.id}')">
        <div class="mm-post-head">${badge}<span class="mm-post-time">${relativeTime(p.created_at)}</span></div>
        ${title}${body}
      </div>`;
  }

  async function loadMemberPosts(more) {
    if (!_mmEmail) return;
    const panel = document.getElementById("mm-panel-posts");
    if (!more) {
      if (panel.querySelector(".mm-list")) { if (!_mmPostsDone) _mmObserve(panel, "posts"); return; }
      _mmPostsOffset = 0; _mmPostsDone = false;
    }
    if (_mmPostsLoading || _mmPostsDone) return;
    _mmPostsLoading = true;
    const { data, error } = await _db.from("community_posts")
      .select("id, type, title, content, created_at").eq("email", _mmEmail)
      .order("created_at", { ascending: false })
      .range(_mmPostsOffset, _mmPostsOffset + _MM_PAGE - 1);
    _mmPostsLoading = false;
    const rows = data || [];
    if (!more && (error || !rows.length)) { panel.innerHTML = `<div class="mm-tab-empty">No posts yet.</div>`; return; }
    _mmPostsOffset += rows.length;
    if (rows.length < _MM_PAGE) _mmPostsDone = true;
    const html = rows.map(_mmPostItemHTML).join("");
    if (!more) {
      panel.innerHTML = `<div class="mm-list">${html}</div>${_mmPostsDone ? "" : _MM_SENTINEL}`;
    } else {
      panel.querySelector(".mm-list")?.insertAdjacentHTML("beforeend", html);
      if (_mmPostsDone) panel.querySelector(".mm-sentinel")?.remove();
    }
    if (!_mmPostsDone) _mmObserve(panel, "posts");
  }

  async function loadMemberAchievements() {
    if (!_mmEmail) return;
    const panel = document.getElementById("mm-panel-achievements");
    if (!panel.querySelector(".mm-tab-loading")) return;
    const { data, error } = await _db.from("achievement_events")
      .select("achievement_id, earned_at").eq("email", _mmEmail)
      .order("earned_at", { ascending: false }).limit(200);
    const achievements = data || [];
    if (error || !achievements.length) {
      panel.innerHTML = `<div class="mm-tab-empty">No achievements unlocked yet.</div>`;
      return;
    }
    panel.innerHTML = `
      <div class="mm-about-label" style="margin-bottom:14px">${achievements.length} Achievement${achievements.length === 1 ? "" : "s"} Unlocked</div>
      <div class="mm-ach-grid">
        ${achievements.map(row => {
          const ach   = ACH[row.achievement_id] || {};
          const aname = ach.name || row.achievement_id || "Achievement";
          const adesc = ach.desc || "";
          const cat   = ACH_CAT[row.achievement_id] || "sessions";
          const col   = (_BADGE_PALETTE[cat] || _BADGE_PALETTE.sessions);
          const badge = achBadgeSVG(row.achievement_id, 46);
          return `<div class="mm-ach-card" style="background:${col[0]}10;border-color:${col[1]}33">
            <span class="feed-ach-icon" style="--g0:${col[0]}26;--g1:${col[1]}66;--g2:${col[1]}">${badge}</span>
            <div class="mm-ach-card-name" style="color:${col[2]}">${escHtml(aname)}</div>
            ${adesc ? `<div class="mm-ach-card-desc">${escHtml(adesc)}</div>` : ""}
            <div class="mm-ach-card-date">${relativeTime(row.earned_at)}</div>
          </div>`;
        }).join("")}
      </div>`;
  }

  function _mmActItemHTML(item) {
    if (item.type === "achievement") {
      const row   = item.data;
      const ach   = ACH[row.achievement_id] || {};
      const aname = ach.name || row.achievement_id || "Achievement";
      const adesc = ach.desc || "";
      const cat   = ACH_CAT[row.achievement_id] || "sessions";
      const col   = _BADGE_PALETTE[cat] || _BADGE_PALETTE.sessions;
      const badge = achBadgeSVG(row.achievement_id, 38);
      return `<div class="mm-activity-item">
        <span class="feed-ach-icon mm-act-ach-icon" style="--g0:${col[0]}26;--g1:${col[1]}66;--g2:${col[1]}">${badge}</span>
        <div class="mm-activity-body">
          <div class="mm-activity-title" style="color:${col[2]}">${escHtml(aname)}</div>
          ${adesc ? `<div class="mm-activity-desc">${escHtml(adesc)}</div>` : ""}
          <div class="mm-activity-time">Achievement · ${relativeTime(row.earned_at)}</div>
        </div>
      </div>`;
    }
    const row = item.data;
    return `<div class="mm-activity-item">
      <div class="mm-activity-icon" style="background:rgba(245,197,24,.08);border:1px solid rgba(245,197,24,.2)">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f5c518" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div class="mm-activity-body">
        <div class="mm-activity-title">Practice session</div>
        <div class="mm-activity-desc">${formatMinutes(row.duration_minutes || 0)}</div>
        <div class="mm-activity-time">${relativeTime(row.session_date)}</div>
      </div>
    </div>`;
  }

  async function loadMemberActivity(more) {
    if (!_mmEmail) return;
    const panel = document.getElementById("mm-panel-activity");
    if (!more) {
      if (panel.querySelector(".mm-list")) { if (!_mmActDone) _mmObserve(panel, "activity"); return; }
      _mmActOffset = 0; _mmActDone = false; _mmActSessions = []; _mmActAch = [];
      const { data: ach } = await _db.from("achievement_events")
        .select("achievement_id, earned_at").eq("email", _mmEmail)
        .order("earned_at", { ascending: false }).limit(200);
      _mmActAch = (ach || []).map(r => ({ type: "achievement", date: r.earned_at, data: r }));
    }
    if (_mmActLoading || _mmActDone) return;
    _mmActLoading = true;
    const { data: sess } = await _db.from("practice_sessions")
      .select("id, session_date, duration_minutes").eq("email", _mmEmail)
      .order("session_date", { ascending: false })
      .range(_mmActOffset, _mmActOffset + _MM_PAGE - 1);
    _mmActLoading = false;
    const sessItems = (sess || []).map(r => ({ type: "session", date: r.session_date, data: r }));
    _mmActSessions.push(...sessItems);
    _mmActOffset += sessItems.length;
    if (sessItems.length < _MM_PAGE) _mmActDone = true;
    const items = [..._mmActAch, ..._mmActSessions].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!items.length) { panel.innerHTML = `<div class="mm-tab-empty">No activity yet.</div>`; return; }
    panel.innerHTML = `<div class="mm-list">${items.map(_mmActItemHTML).join("")}</div>${_mmActDone ? "" : _MM_SENTINEL}`;
    if (!_mmActDone) _mmObserve(panel, "activity");
  }

  function switchTab(tab, btn) {
    document.querySelectorAll(".member-modal-tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".member-modal-panel").forEach(p => p.classList.remove("active"));
    if (btn) btn.classList.add("active");
    document.getElementById(`mm-panel-${tab}`).classList.add("active");
    if (tab === "achievements") loadMemberAchievements();
    if (tab === "posts")       loadMemberPosts();
    if (tab === "activity")    loadMemberActivity();
  }

  function close(e) {
    if (e && e.target !== document.getElementById("member-modal-backdrop")) return;
    document.getElementById("member-modal-backdrop").style.display = "none";
    document.body.style.overflow = "";
    _mmEmail = null;
    if (_mmIO) { _mmIO.disconnect(); _mmIO = null; }
  }

  function _populate(m) {
    const name = (m.name || "").trim();
    const col  = _memberColour(name);
    const isFounding = (m.badge || "").toLowerCase().includes("founding member");
    const fClass = isFounding ? " is-founder" : "";

    const avatarEl = document.getElementById("mm-avatar");
    if (m.avatar_url) {
      avatarEl.innerHTML = `<img class="member-modal-avatar${fClass}" src="${m.avatar_url}" alt="${escHtml(name)}"
        onerror="this.outerHTML='<div class=\\'member-modal-avatar-initials${fClass}\\' style=\\'background:${col.bg};color:${col.fg}\\'>${_memberInitials(name)}</div>'">`;
    } else {
      avatarEl.innerHTML = `<div class="member-modal-avatar-initials${fClass}" style="background:${col.bg};color:${col.fg}">${_memberInitials(name)}</div>`;
    }
    const heroEl = document.querySelector(".member-modal-hero");
    if (heroEl) heroEl.style.setProperty("--mm-tint", m.avatar_url ? "var(--surface-2)" : col.bg);

    const starSvg = isFounding ? `<svg class="member-star" data-tip="Founding Member" viewBox="0 0 24 24" fill="currentColor" aria-label="Founding member"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 7.1-1.01L12 2z"/></svg>` : "";
    document.getElementById("mm-name").innerHTML = `${escHtml(name)}${starSvg}`;
    document.getElementById("mm-badge").innerHTML = (m.badge && !isFounding) ? `<div class="member-modal-badge">${escHtml(m.badge)}</div>` : "";
    document.getElementById("mm-headline").textContent = m.headline || "";

    let metaHTML = "";
    if (m.location)   metaHTML += `<div class="member-modal-meta-item"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escHtml(m.location)}</div>`;
    if (m.instrument) metaHTML += `<div class="member-modal-meta-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 4v8M11 4v8M15 4v8M19 4v8"/></svg>${escHtml(m.instrument)}</div>`;
    document.getElementById("mm-meta").innerHTML = metaHTML;

    let aboutHTML = "";
    // App-style stats strip (filled async by _loadStats); skeleton dashes first.
    aboutHTML += `<div class="mm-stats" id="mm-stats">
      <div class="mm-stat"><div class="mm-stat-num mm-stat-skeleton">–</div><div class="mm-stat-lbl">Practised</div></div>
      <div class="mm-stat"><div class="mm-stat-num mm-stat-skeleton">–</div><div class="mm-stat-lbl">Pieces</div></div>
      <div class="mm-stat"><div class="mm-stat-num mm-stat-skeleton">–</div><div class="mm-stat-lbl">Achievements</div></div>
    </div>`;
    // "Now learning" — filled async by _loadStats; hidden until it has pieces.
    aboutHTML += `<div class="mm-learning-sec" id="mm-learning" style="display:none"></div>`;
    if (m.bio) aboutHTML += `<div class="mm-about-section"><div class="mm-bio">${escHtml(m.bio).replace(/\n/g,"<br>")}</div></div>`;
    let socialLinks = "";
    if (m.website)   socialLinks += `<a href="${m.website.startsWith("http") ? m.website : "https://"+m.website}" target="_blank" rel="noopener"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>Website</a>`;
    if (m.instagram) socialLinks += `<a href="https://instagram.com/${encodeURIComponent(m.instagram)}" target="_blank" rel="noopener"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0" fill="currentColor" stroke="none"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>Instagram</a>`;
    if (m.twitter)   socialLinks += `<a href="https://x.com/${encodeURIComponent(m.twitter)}" target="_blank" rel="noopener"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>X / Twitter</a>`;
    if (m.youtube)   socialLinks += `<a href="${m.youtube.startsWith("http") ? m.youtube : "https://"+m.youtube}" target="_blank" rel="noopener"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>YouTube</a>`;
    if (socialLinks) aboutHTML += `<div class="mm-about-section"><div class="mm-about-label">Links</div><div class="mm-social-links">${socialLinks}</div></div>`;
    if (!aboutHTML)  aboutHTML  = `<div class="mm-tab-empty">No profile info yet.</div>`;
    document.getElementById("mm-panel-about").innerHTML = aboutHTML;

    document.getElementById("mm-panel-achievements").innerHTML = `<div class="mm-tab-loading"><div class="loading-spinner" style="margin:0 auto 10px"></div>Loading achievements…</div>`;
    document.getElementById("mm-panel-posts").innerHTML        = `<div class="mm-tab-loading"><div class="loading-spinner" style="margin:0 auto 10px"></div>Loading posts…</div>`;
    document.getElementById("mm-panel-activity").innerHTML     = `<div class="mm-tab-loading"><div class="loading-spinner" style="margin:0 auto 10px"></div>Loading activity…</div>`;

    document.querySelectorAll(".member-modal-tab").forEach((b, i) => b.classList.toggle("active", i === 0));
    document.querySelectorAll(".member-modal-panel").forEach(p => p.classList.remove("active"));
    document.getElementById("mm-panel-about").classList.add("active");

    // Reset premium-extra state for the newly opened member.
    _mmDayMin = {}; _mmStreak = { current: 0, best: 0 };
    const _streakEl = document.getElementById("mm-streak");
    if (_streakEl) _streakEl.innerHTML = "";

    _mmEmail = m.email || null;
    _mmResetTabs();
  }

  // ── Premium extras: practice streak + stat count-up ──
  let _mmDayMin = {};                       // 'YYYY-MM-DD' → minutes practised that day (drives the streak)
  let _mmStreak = { current: 0, best: 0 };
  const _reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function _computeStreaks(daySet) {
    if (!daySet.size) return { current: 0, best: 0 };
    const days = [...daySet].sort();
    let best = 1, run = 1;
    for (let i = 1; i < days.length; i++) {
      const diff = (Date.parse(days[i] + "T00:00:00Z") - Date.parse(days[i - 1] + "T00:00:00Z")) / 86400000;
      if (diff === 1) { run++; if (run > best) best = run; }
      else if (diff !== 0) run = 1;
    }
    const fmt = (dt) => dt.toISOString().slice(0, 10);
    const now = new Date();
    const cur = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    if (!daySet.has(fmt(cur))) cur.setUTCDate(cur.getUTCDate() - 1); // streak alive if today OR yesterday
    let current = 0;
    while (daySet.has(fmt(cur))) { current++; cur.setUTCDate(cur.getUTCDate() - 1); }
    return { current, best };
  }

  function _streakChipHTML(n) {
    return `<span class="mm-streak-chip" data-tip="Best streak: ${_mmStreak.best} day${_mmStreak.best === 1 ? "" : "s"}"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg><b>${n}</b> day streak</span>`;
  }

  function _animateStat(el, to, suffix) {
    if (!el) return;
    el.innerHTML = to + suffix;                         // guaranteed final value
    if (_reduceMotion() || to <= 0) return;
    const dur = 700; let s0 = null;
    function step(ts) {
      if (s0 === null) s0 = ts;
      const p = Math.min(1, (ts - s0) / dur);
      el.innerHTML = Math.round((1 - Math.pow(1 - p, 3)) * to) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    el.innerHTML = "0" + suffix;                        // animate up from zero…
    requestAnimationFrame(step);
    setTimeout(() => { el.innerHTML = to + suffix; }, dur + 80); // …safety net if rAF is throttled
  }

  // Fill the About stats strip + streak chip, and compute per-day minutes for the
  // heatmap. Cheap: one fetch of session (date+duration) + two head-count queries.
  async function _loadStats(email) {
    let durs = [], pieceCount = 0, achCount = 0, learning = [];
    try {
      const [dRes, pColRes, pCustomRes, aRes, learnRes] = await Promise.all([
        _db.from("practice_sessions").select("duration_minutes, session_date").eq("email", email),
        // Catalogue pieces in their collection (learning/completed, non-custom rows)…
        _db.from("user_collections").select("id", { count: "exact", head: true }).eq("email", email).in("status", ["learning", "completed"]).is("user_piece_id", null),
        // …plus every custom piece they've added (separate table). Summed so the
        // collection's own custom rows aren't double-counted.
        _db.from("user_pieces").select("id", { count: "exact", head: true }).eq("email", email),
        _db.from("achievement_events").select("id", { count: "exact", head: true }).eq("email", email),
        // A few pieces they're actively learning (catalogue or custom) for the "Now learning" preview.
        _db.from("user_collections").select("created_at, pieces(title, composer), user_pieces(title, composer)").eq("email", email).eq("status", "learning").order("created_at", { ascending: false }).limit(4),
      ]);
      durs = dRes.data || [];
      pieceCount = (pColRes.count || 0) + (pCustomRes.count || 0);
      achCount = aRes.count || 0;
      learning = (learnRes.data || []).map(r => r.pieces || r.user_pieces).filter(Boolean);
    } catch (_) { /* leave skeleton */ return; }
    if (_mmEmail !== email) return; // a newer profile was opened meanwhile

    // Per-day practice minutes (drives the practice streak) + total practice time.
    _mmDayMin = {};
    let totalMin = 0;
    for (const r of durs) {
      const m = r.duration_minutes || 0; totalMin += m;
      const ds = String(r.session_date || "").slice(0, 10);
      if (ds) _mmDayMin[ds] = (_mmDayMin[ds] || 0) + m;
    }
    _mmStreak = _computeStreaks(new Set(Object.keys(_mmDayMin).filter(d => _mmDayMin[d] > 0)));

    const wrap = document.getElementById("mm-stats");
    if (wrap) {
      const totalH = totalMin >= 60 ? Math.round(totalMin / 60) : totalMin;
      const unit = totalMin >= 60 ? "h" : "m";
      const tile = (lbl) => `<div class="mm-stat"><div class="mm-stat-num">0</div><div class="mm-stat-lbl">${lbl}</div></div>`;
      wrap.innerHTML = tile("Practised") + tile("Pieces") + tile("Achievements");
      const nums = wrap.querySelectorAll(".mm-stat-num");
      _animateStat(nums[0], totalH, `<small>${unit}</small>`);
      _animateStat(nums[1], pieceCount, "");
      _animateStat(nums[2], achCount, "");
    }
    const streakEl = document.getElementById("mm-streak");
    if (streakEl) streakEl.innerHTML = _mmStreak.current >= 1 ? _streakChipHTML(_mmStreak.current) : "";

    // "Now learning" — only shown when they have pieces in progress (celebrates, never empty).
    const learnEl = document.getElementById("mm-learning");
    if (learnEl) {
      if (learning.length) {
        const note = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>`;
        learnEl.innerHTML = `<div class="mm-about-label">Now learning</div>` + learning.map(p => `
          <div class="mm-learn-item">
            <span class="mm-learn-ico">${note}</span>
            <div style="min-width:0">
              <div class="mm-learn-title">${escHtml(p.title || "Untitled piece")}</div>
              ${p.composer ? `<div class="mm-learn-comp">${escHtml(p.composer)}</div>` : ""}
            </div>
          </div>`).join("");
        learnEl.style.display = "";
      } else {
        learnEl.style.display = "none";
      }
    }
  }

  let _openToken = 0;
  async function open(email) {
    if (!_booted || !email) return;
    const token = ++_openToken;
    let m = null;
    try {
      const { data } = await _db
        .from("allowed_emails")
        .select("email, name, headline, location, instrument, avatar_url, badge, bio, website, instagram, twitter, youtube")
        .eq("email", email).maybeSingle();
      m = data;
    } catch (_) { /* ignore */ }
    if (token !== _openToken || !m) return;   // superseded by a newer open, or no row
    // Populate first, THEN reveal — so the entrance animation plays with content
    // rather than racing ahead of the fetch on an empty shell.
    _populate(m);
    const bd = document.getElementById("member-modal-backdrop");
    bd.style.display = "flex";
    document.body.style.overflow = "hidden";
    const panels = document.querySelector(".member-modal-panels");
    if (panels) panels.scrollTop = 0;
    // Force the entrance animation to (re)play on every open. Clearing the inline
    // value falls back to the stylesheet, which is `none` under reduced-motion.
    const card = bd.querySelector(".member-modal");
    if (card) { card.style.animation = "none"; void card.offsetWidth; card.style.animation = ""; }
    _loadStats(m.email);
  }

  /* ─────────────── delegated avatar click (capture phase) ──────────────────
     Capture so we run before any underlying card/link onclick and can suppress
     it — clicking an avatar inside a post opens the person, not the post. */
  function _onDocClickCapture(e) {
    if (e.target.closest && e.target.closest("[data-tip]")) return; // tip clicks aren't avatar clicks
    const el = e.target.closest && e.target.closest("[data-member-email]");
    if (!el) return;
    const email = el.getAttribute("data-member-email");
    if (!email) return;
    e.preventDefault();
    e.stopPropagation();
    open(email);
  }

  /* ─────────────── tooltip for [data-tip] (hover + tap) ───────────────────── */
  let _tipEl = null, _tipTimer = null;
  function _positionTip(el) {
    if (!_tipEl) { _tipEl = document.createElement("div"); _tipEl.className = "smm-tip"; document.body.appendChild(_tipEl); }
    _tipEl.textContent = el.getAttribute("data-tip") || "";
    const r = el.getBoundingClientRect();
    _tipEl.style.left = (r.left + r.width / 2) + "px";
    _tipEl.style.top = r.top + "px";
    _tipEl.classList.add("show");
  }
  function _hideTip() { if (_tipEl) _tipEl.classList.remove("show"); }
  function _onTipOver(e) { const el = e.target.closest && e.target.closest("[data-tip]"); if (el) { clearTimeout(_tipTimer); _positionTip(el); } }
  function _onTipOut(e) { const el = e.target.closest && e.target.closest("[data-tip]"); if (el) _hideTip(); }
  function _onTipClick(e) {
    const el = e.target.closest && e.target.closest("[data-tip]");
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();                 // don't open the post/row behind the star
    _positionTip(el);
    clearTimeout(_tipTimer);
    _tipTimer = setTimeout(_hideTip, 2200); // auto-dismiss (covers tap, where there's no mouseout)
  }

  /* Modal's own controls (close + tabs), bound once on the injected shell. */
  function _onModalClick(e) {
    const backdrop = document.getElementById("member-modal-backdrop");
    if (e.target === backdrop) { close(e); return; }
    if (e.target.closest(".member-modal-close")) { close(); return; }
    const tabBtn = e.target.closest(".member-modal-tab");
    if (tabBtn) { switchTab(tabBtn.getAttribute("data-mm-tab"), tabBtn); return; }
  }

  /* ───────────────────────────── public API ───────────────────────────────── */
  window.initMemberModal = function (opts) {
    opts = opts || {};
    _db = opts.db;
    _myEmail = opts.myEmail || null;
    _onPostClick = (typeof opts.onPostClick === "function")
      ? opts.onPostClick
      : function (id) { window.location.href = "community.html?post=" + encodeURIComponent(id); };
    if (_booted) return;
    if (!document.getElementById("smm-styles")) {
      const s = document.createElement("style");
      s.id = "smm-styles";
      s.textContent = _CSS;
      document.head.appendChild(s);
    }
    if (!document.getElementById("member-modal-backdrop")) {
      const wrap = document.createElement("div");
      wrap.innerHTML = _HTML.trim();
      const node = wrap.firstElementChild;
      document.body.appendChild(node);
      node.addEventListener("click", _onModalClick);
    }
    document.addEventListener("click", _onTipClick, true);   // before avatar handler
    document.addEventListener("mouseover", _onTipOver);
    document.addEventListener("mouseout", _onTipOut);
    document.addEventListener("scroll", _hideTip, true);
    document.addEventListener("click", _onDocClickCapture, true);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.getElementById("member-modal-backdrop").style.display === "flex") close();
    });
    _booted = true;
  };

  window.MemberModal = {
    open,
    close,
    switchTab,
    _postClick: function (id) { close(); _onPostClick(id); },
  };
})();
