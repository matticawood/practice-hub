// shared-achievements.js — achievement engine shared by practice-log.html and tools.html
// Classic (non-module) script. Extracted VERBATIM from practice-log.html.
// Top-level declarations become page globals shared across classic scripts on a page.

function _achTotalMins(s) {
  return s.reduce((t, ss) => t + (ss.duration_minutes || 0), 0);
}
function _achMaxStreak(s) {
  const dates = [...new Set(s.map(ss => ss.session_date))].filter(Boolean).sort();
  if (!dates.length) return 0;
  // Save-inclusive best streak — matches the dashboard/leaderboard. A streak kept
  // alive by a streak-save still counts toward these badges. Falls back to the raw
  // consecutive-day count only if the shared streak module isn't loaded.
  if (typeof window !== "undefined" && window.StreakCalc) {
    try { return window.StreakCalc.deriveStreakState(dates, window.StreakCalc.captureTimezone()).best_streak; }
    catch (e) {}
  }
  let max = 1, cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round(
      (new Date(dates[i] + "T12:00:00") - new Date(dates[i-1] + "T12:00:00")) / 86400000
    );
    if (diff === 1) { cur++; if (cur > max) max = cur; }
    else if (diff > 1) cur = 1;
  }
  return max;
}
function _achUniquePieces(s) {
  const set = new Set();
  s.forEach(ss => (ss.practice_items || []).forEach(i => {
    if (i.item_type === "piece" && i.label) set.add(i.label.toLowerCase().trim());
  }));
  return set.size;
}
// Max minutes logged for a single piece across all sessions
function _achMaxPieceMins(s) {
  const totals = {};
  s.forEach(ss => {
    const items = ss.practice_items || [];
    const sessMins = ss.duration_minutes || 0;
    items.forEach(i => {
      if (i.item_type !== "piece" || !i.label) return;
      const key = i.label.toLowerCase().trim();
      let mins = 0;
      if (ss.timing_mode === "per_item") {
        mins = i.duration_minutes || 0;
      } else {
        const pieceCount = items.filter(x => x.item_type === "piece").length;
        mins = pieceCount > 0 ? sessMins / pieceCount : 0;
      }
      totals[key] = (totals[key] || 0) + mins;
    });
  });
  return Object.values(totals).reduce((m, v) => Math.max(m, v), 0);
}
// Number of unique scales/techniques practised
function _achUniqueScales(s) {
  const set = new Set();
  s.forEach(ss => (ss.practice_items || []).forEach(i => {
    if (i.item_type === "technique" && i.label) {
      i.label.split(",").forEach(t => { const tr = t.trim().toLowerCase(); if (tr) set.add(tr); });
    }
  }));
  return set.size;
}
// Max sessions on a single scale/technique
function _achMaxScaleSessions(s) {
  const counts = {};
  s.forEach(ss => {
    const seen = new Set();
    (ss.practice_items || []).forEach(i => {
      if (i.item_type === "technique" && i.label) {
        i.label.split(",").forEach(t => {
          const tr = t.trim().toLowerCase();
          if (tr && !seen.has(tr)) { seen.add(tr); counts[tr] = (counts[tr] || 0) + 1; }
        });
      }
    });
  });
  return Object.values(counts).reduce((m, v) => Math.max(m, v), 0);
}

// Count sessions that include at least one item of a given type
function _achItemTypeSessions(s, type) {
  return s.filter(ss => (ss.practice_items || []).some(i => i.item_type === type)).length;
}

// Total minutes spent on a given item_type across all sessions
function _achItemTypeMins(s, type) {
  let total = 0;
  s.forEach(ss => {
    const items = ss.practice_items || [];
    const matching = items.filter(i => i.item_type === type);
    if (matching.length === 0) return;
    if (ss.timing_mode === "per_item") {
      matching.forEach(i => { total += i.duration_minutes || 0; });
    } else {
      const sessMins = ss.duration_minutes || 0;
      const count = items.length;
      total += count > 0 ? (matching.length / count) * sessMins : 0;
    }
  });
  return Math.round(total);
}

// Max number of distinct item_types logged in a single session
function _achMaxVarietyTypes(s) {
  return s.reduce((m, ss) => {
    const types = new Set((ss.practice_items || []).map(i => i.item_type).filter(Boolean));
    return Math.max(m, types.size);
  }, 0);
}

// True if any session has piece + technique + at least one of theory/ear/improv/sight
function _achHasCompleteSession(s) {
  const EXTRAS = new Set(["theory", "eartraining", "improvisation", "sightreading"]);
  return s.some(ss => {
    const types = new Set((ss.practice_items || []).map(i => i.item_type));
    return types.has("piece") && types.has("technique") && [...types].some(t => EXTRAS.has(t));
  });
}

// Max number of distinct days practiced in any single calendar month
function _achMaxMonthDays(s) {
  const byMonth = {};
  s.forEach(ss => {
    if (!ss.session_date) return;
    const month = ss.session_date.slice(0, 7);
    if (!byMonth[month]) byMonth[month] = new Set();
    byMonth[month].add(ss.session_date);
  });
  return Object.values(byMonth).reduce((m, set) => Math.max(m, set.size), 0);
}

// Most minutes practised within a single calendar month
function _achMaxMonthMins(s) {
  const byMonth = {};
  s.forEach(ss => {
    if (!ss.session_date) return;
    const month = ss.session_date.slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + (ss.duration_minutes || 0);
  });
  return Object.values(byMonth).reduce((m, v) => Math.max(m, v), 0);
}

// ISO-8601 week key (Mon–Sun) for a YYYY-MM-DD string, e.g. "2026-W22"
function _isoWeekKey(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = (dt.getUTCDay() + 6) % 7;           // Mon=0 … Sun=6
  dt.setUTCDate(dt.getUTCDate() - day + 3);        // Thursday of this week
  const firstThu = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((dt - firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  return dt.getUTCFullYear() + "-W" + week;
}
// True if any calendar week (Mon–Sun) has all 7 days practised
function _achHasPerfectWeek(s) {
  const byWeek = {};
  s.forEach(ss => {
    if (!ss.session_date) return;
    const k = _isoWeekKey(ss.session_date);
    (byWeek[k] = byWeek[k] || new Set()).add(ss.session_date);
  });
  return Object.values(byWeek).some(set => set.size >= 7);
}
// How many of the 7 core practice types the user has touched at least once
function _achRenaissanceCount(s) {
  return [
    _achUniquePieces(s) >= 1,
    _achUniqueScales(s) >= 1,
    _achItemTypeSessions(s, "sightreading")  >= 1,
    _achItemTypeSessions(s, "improvisation") >= 1,
    _achItemTypeSessions(s, "theory")        >= 1,
    _achItemTypeSessions(s, "eartraining")   >= 1,
    _achItemTypeSessions(s, "book")          >= 1,
  ].filter(Boolean).length;
}
// True if any Saturday and its following Sunday were both practised
function _achHasWeekendWarrior(s) {
  const dates = new Set(s.map(x => x.session_date).filter(Boolean));
  for (const ds of dates) {
    const [y, m, d] = ds.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    if (dt.getDay() !== 6) continue;               // Saturday only
    const nx = new Date(y, m - 1, d + 1);
    const nk = `${nx.getFullYear()}-${String(nx.getMonth() + 1).padStart(2, "0")}-${String(nx.getDate()).padStart(2, "0")}`;
    if (dates.has(nk)) return true;
  }
  return false;
}

// Category colours: [bg, border, fill]
const ACH_COLOURS = {
  sessions: ["rgba(59,130,246,.14)", "rgba(59,130,246,.35)",  "#3b82f6"],
  time:     ["rgba(245,158,11,.13)", "rgba(245,158,11,.35)",  "#f59e0b"],
  streak:   ["rgba(249,115,22,.14)", "rgba(249,115,22,.35)",  "#f97316"],
  pieces:   ["rgba(139,92,246,.14)", "rgba(139,92,246,.35)",  "#8b5cf6"],
  depth:    ["rgba(6,182,212,.12)",  "rgba(6,182,212,.32)",   "#06b6d4"],
  reading:  ["rgba(16,185,129,.13)", "rgba(16,185,129,.35)",  "#10b981"],
  library:  ["rgba(168,85,247,.14)", "rgba(168,85,247,.35)",  "#a855f7"],
  game:     ["rgba(236,72,153,.13)", "rgba(236,72,153,.35)",  "#ec4899"],
  noterec:  ["rgba(132,204,22,.13)", "rgba(132,204,22,.35)", "#84cc16"],
  scales:      ["rgba(20,184,166,.13)",  "rgba(20,184,166,.35)",  "#14b8a6"],
  sightread:   ["rgba(14,165,233,.13)",  "rgba(14,165,233,.35)",  "#0ea5e9"],
  improv:      ["rgba(251,146,60,.13)",  "rgba(251,146,60,.35)",  "#fb923c"],
  theorycat:   ["rgba(99,102,241,.13)",  "rgba(99,102,241,.35)",  "#6366f1"],
  eartraining: ["rgba(244,63,94,.13)",   "rgba(244,63,94,.35)",   "#f43f5e"],
  courses:     ["rgba(16,185,129,.13)",  "rgba(16,185,129,.35)",  "#10b981"],
  books:       ["rgba(234,179,8,.13)",   "rgba(234,179,8,.35)",   "#eab308"],
  variety:     ["rgba(34,197,94,.13)",   "rgba(34,197,94,.35)",   "#22c55e"],
  saves:       ["rgba(168,85,247,.13)",  "rgba(168,85,247,.35)",  "#a855f7"],
  chordrec:    ["rgba(217,70,239,.13)",  "rgba(217,70,239,.35)",  "#d946ef"],
  earrec:      ["rgba(6,182,212,.13)",   "rgba(6,182,212,.35)",   "#06b6d4"],
  community:   ["rgba(2,132,199,.13)",   "rgba(2,132,199,.35)",   "#0284c7"],
  live:        ["rgba(225,29,72,.13)",   "rgba(225,29,72,.35)",   "#e11d48"],
  roadmap:     ["rgba(240,165,0,.15)",   "rgba(240,165,0,.40)",   "#f0a500"],
};

// ── Per-achievement unique SVG icon inner-paths ───────────────────────────
// Each value is the inner content of a 24×24 viewBox SVG.
// Fill icons include fill="currentColor" stroke="none" on the element.
const _AI = {
  NOTE:    `<path fill="currentColor" stroke="none" d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>`,
  CLOCK:   `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
  TIMER:   `<path d="M10 2h4"/><circle cx="12" cy="13" r="8"/><polyline points="12 9 12 13 15 15"/>`,
  CALCK:   `<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 14 11 16 15 12"/>`,
  MEDAL:   `<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>`,
  TROPHY:  `<path d="M6 9H4.5a2.5 2.5 0 0 0 0 5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>`,
  CROWN:   `<path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><line x1="2" y1="20" x2="22" y2="20"/>`,
  GLASS:   `<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 1 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>`,
  STAR:    `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
  STARF:   `<polygon fill="currentColor" stroke="none" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
  GEM:     `<path d="M6 3h12l4 6-10 13L2 9z"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="3" x2="7" y2="9"/><line x1="12" y1="3" x2="17" y2="9"/>`,
  FLAME:   `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>`,
  SHIELD:  `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
  SHIELDC: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>`,
  MOON:    `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`,
  SUN:     `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`,
  SUNRISE: `<path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="3" y1="22" x2="21" y2="22"/>`,
  GLOBE:   `<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`,
  TARGET:  `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>`,
  LAYERS:  `<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`,
  MAGNIFY: `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
  EYE:     `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
  SCOPE:   `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>`,
  BOOK:    `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,
  BOOKS:   `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>`,
  LIGHTB:  `<line x1="9" y1="21" x2="15" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M12 2a7 7 0 0 1 5.196 11.9 5 5 0 0 0-2.196 4.1H9a5 5 0 0 0-2.196-4.1A7 7 0 0 1 12 2z"/>`,
  BOLT:    `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
  SPARKLE: `<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>`,
  WAVE:    `<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>`,
  REFRESH: `<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>`,
  GEAR:    `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
  WAVEFRM: `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`,
  NOTES2:  `<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>`,
  WRENCH:  `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`,
  INFINITY:`<path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/>`,
  STEPS:   `<polyline points="4 19 4 15 8 15 8 11 12 11 12 7 16 7 16 3 20 3"/>`,
  PIANO:   `<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M6 3v10M10 3v10M14 3v10M18 3v10"/><rect fill="currentColor" stroke="none" x="4" y="3" width="3" height="7" rx="0.5"/><rect fill="currentColor" stroke="none" x="8" y="3" width="3" height="7" rx="0.5"/><rect fill="currentColor" stroke="none" x="13" y="3" width="3" height="7" rx="0.5"/><rect fill="currentColor" stroke="none" x="17" y="3" width="3" height="7" rx="0.5"/>`,
  STAGE:   `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>`,
  COMPASS: `<circle cx="12" cy="12" r="10"/><polygon fill="currentColor" stroke="none" points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>`,
  MAP:     `<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>`,
  SWORDS:  `<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/>`,
  BINOS:   `<circle cx="7" cy="14" r="5"/><circle cx="17" cy="14" r="5"/><path d="M7 9V6h10v3"/><line x1="12" y1="14" x2="12" y2="9"/>`,
  HEADPH:  `<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>`,
  PALETTE: `<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>`,
  ZAPP:    `<circle cx="12" cy="12" r="10"/><polygon fill="currentColor" stroke="none" points="10 8 16 12 10 16 10 8"/>`,
  REPEAT:  `<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>`,
  BELL:    `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,
  AWARD:   `<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/><circle cx="12" cy="8" r="2" fill="currentColor" stroke="none"/>`,
};

// Map each achievement id to its icon paths
const ACH_ICON_MAP = {
  // Sessions
  s1:_AI.NOTE, s10:_AI.CLOCK, s50:_AI.CALCK, s100:_AI.MEDAL, s250:_AI.TROPHY, s500:_AI.CROWN,
  // Time
  t1:_AI.GLASS, t10:_AI.TIMER, t50:_AI.STAR, t100:_AI.STARF, t500:_AI.GEM,
  // Streak
  k3:_AI.FLAME, k7:_AI.SHIELD, k14:_AI.SHIELDC, k30:_AI.MOON, k60:_AI.SUN,
  k100:_AI.SUNRISE, k180:_AI.SPARKLE, k365:_AI.GLOBE,
  // Pieces — repertoire
  p1:_AI.NOTE, p5:_AI.NOTES2, p15:_AI.BOOK, p30:_AI.PIANO, p50:_AI.STAGE,
  // Pieces — depth
  pd1:_AI.TARGET, pd5:_AI.LAYERS, pd10:_AI.MAGNIFY, pd20:_AI.GEM,
  // Scales — variety
  sc1:_AI.STEPS, sc5:_AI.REFRESH, sc15:_AI.WAVEFRM,
  // Scales — sessions
  ss5:_AI.REPEAT, ss10:_AI.GEAR, ss25:_AI.SWORDS, ss50:_AI.CROWN,
  // Sight reading — sessions
  sr1:_AI.EYE, sr10:_AI.BINOS, sr30:_AI.SCOPE,
  // Sight reading — time
  srt1:_AI.CLOCK, srt5:_AI.BOOK, srt25:_AI.COMPASS, srt50:_AI.STARF,
  // Improvisation — sessions
  im1:_AI.LIGHTB, im10:_AI.BOLT, im30:_AI.SPARKLE,
  // Improvisation — time
  imt1:_AI.WAVE, imt5:_AI.PALETTE, imt25:_AI.FLAME, imt50:_AI.INFINITY,
  // Theory
  th1:_AI.BOOK, th10:_AI.BOOKS, th30:_AI.AWARD,
  tht1:_AI.CLOCK, tht5:_AI.BOOKS, tht25:_AI.GLOBE, tht50:_AI.STARF,
  // Ear training
  et1:_AI.HEADPH, et10:_AI.WAVE, et30:_AI.BELL,
  ett1:_AI.CLOCK, ett5:_AI.HEADPH, ett25:_AI.NOTES2, ett50:_AI.CROWN,
  // Long sessions
  d60:_AI.CLOCK, d120:_AI.TROPHY, d180:_AI.GEM,
  // Monthly
  mo20:_AI.CALCK,
  // Books
  bk1:_AI.BOOK, bk10:_AI.BOOKS, bk30:_AI.MEDAL,
  bkt5:_AI.CLOCK, bkt25:_AI.TROPHY,
  // Variety
  vcomp:_AI.LAYERS, v4:_AI.SPARKLE,
  // Streak saves
  sv1:_AI.SHIELD, sv3:_AI.SHIELDC, sv5:_AI.CROWN,
  // Reading
  r1:_AI.BOOK, r5:_AI.BOOKS, r10:_AI.MEDAL, r25:_AI.GLOBE,
  // Library
  c1:_AI.NOTE, c5:_AI.NOTES2, c10:_AI.BOOKS, c25:_AI.CROWN,
  c5l:_AI.LAYERS, c3a:_AI.STAR, c10a:_AI.STARF,
  c1c:_AI.CALCK, c3c:_AI.TROPHY, c5c:_AI.TROPHY, c10c:_AI.CROWN,
  // Game / Passage Fixer
  g1:_AI.WRENCH, g5t:_AI.WRENCH, g25t:_AI.GEAR,
  g1c:_AI.BOLT, g10c:_AI.BOLT, g50c:_AI.WAVE,
  g1p:_AI.GEM, g5p:_AI.GEM,
  g3d:_AI.COMPASS, g10d:_AI.MAP,
  g5:_AI.STARF,
  // Note Recognition Game
  nrg1:_AI.NOTES2, nrg10:_AI.PIANO, nrg50:_AI.STAGE,
  nrs5:_AI.NOTE, nrs10:_AI.EYE, nrs20:_AI.BINOS, nrs30:_AI.SCOPE, nrs50:_AI.STARF,
  nrtreb:_AI.EYE, nrb10:_AI.WAVE, nrmix:_AI.LAYERS, nracc:_AI.SPARKLE,
  nrkey:_AI.STEPS, nrkey3:_AI.COMPASS,
  // Chord Recognition Game
  crg1:_AI.PIANO, crg10:_AI.LAYERS, crg50:_AI.STAGE,
  crs10:_AI.TARGET, crs20:_AI.BINOS, crs30:_AI.STARF,
  crtreb:_AI.EYE, crbass:_AI.WAVE, crkey:_AI.STEPS,
  // Chord Ear Training Game
  earg1:_AI.HEADPH, earg10:_AI.WAVE, earg50:_AI.STAGE,
  ears10:_AI.TARGET, ears20:_AI.BINOS, ears30:_AI.STARF,
  earex:_AI.PIANO, earkey:_AI.STEPS, earext:_AI.LAYERS,
  // Community — posts
  cmp1:_AI.SPARKLE, cmp10:_AI.NOTES2, cmp25:_AI.AWARD, cmp50:_AI.CROWN,
  // Community — comments
  cmc1:_AI.BELL, cmc10:_AI.LAYERS, cmc50:_AI.STAR, cmc100:_AI.STARF,
  // Community — reactions
  cmr1:_AI.SPARKLE, cmr25:_AI.GEM, cmr100:_AI.CROWN,
  // Live streams
  lv1:_AI.BOLT, lv5:_AI.STAR, lv10:_AI.TROPHY,
  // Consistency / variety / profile additions
  tmo25:_AI.CALCK, pweek:_AI.CALCK, wkwarr:_AI.SUNRISE, renais:_AI.PALETTE,
  cmcs:_AI.BELL, cmav:_AI.SPARKLE,
  // Courses
  course_first_lesson:_AI.BOOK, course_theory_level1:_AI.MEDAL, course_theory_level2:_AI.TROPHY,
};

function achBadgeIcon(id) {
  const paths = ACH_ICON_MAP[id] || _AI.STAR;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="26" height="26">${paths}</svg>`;
}

// ── Award-style badge SVG system ────────────────────────────────
// Shape element attributes for 54×54 viewBox (no fill/stroke yet)
const _BADGE_SHAPE = {
  circle:  `<circle cx="27" cy="27" r="24.5"`,
  hex:     `<polygon points="27,3 48,15.5 48,38.5 27,51 6,38.5 6,15.5"`,
  shield:  `<path d="M27 3L49 13v21q0 14-22 17Q5 48 5 34V13z"`,
  star:    `<polygon points="27,2 33.2,18.5 50.8,19.3 37,30.3 41.7,47.2 27,37.5 12.3,47.2 17,30.3 3.2,19.3 20.8,18.5"`,
  diamond: `<polygon points="27,3 51,27 27,51 3,27"`,
};
// Top-highlight sheen per shape
const _BADGE_SHINE = {
  circle:  `<path d="M10 14Q27 3 44 14Q27 23 10 14Z" fill="rgba(255,255,255,.14)"/>`,
  hex:     `<path d="M14 16L27 6 40 16Q27 24 14 16Z" fill="rgba(255,255,255,.14)"/>`,
  shield:  `<path d="M11 14L27 6 43 14Q27 22 11 14Z" fill="rgba(255,255,255,.14)"/>`,
  star:    `<path d="M18 18L27 5 36 18Q27 25 18 18Z" fill="rgba(255,255,255,.14)"/>`,
  diamond: `<path d="M16 18L27 4 38 18Q27 26 16 18Z" fill="rgba(255,255,255,.14)"/>`,
};
// Badge shape per category
const _BADGE_CAT_SHAPE = {
  sessions:'circle', time:'hex', streak:'shield', pieces:'diamond',
  scales:'hex', sightread:'circle', improv:'star', theorycat:'circle',
  eartraining:'hex', depth:'star', books:'circle', variety:'star',
  saves:'shield', reading:'shield', community:'circle', game:'hex',
  library:'diamond', noterec:'star', chordrec:'diamond', earrec:'hex', live:'star',
  roadmap:'circle', courses:'shield',
};
// Colour palette per category [light, mid, dark] — interpolated by tier
const _BADGE_PALETTE = {
  sessions:    ['#93c5fd','#2563eb','#1d4ed8'],  // sky → vivid → rich blue
  time:        ['#fde68a','#f59e0b','#b45309'],  // pale gold → amber → dark amber
  streak:      ['#fca5a5','#ef4444','#b91c1c'],  // light red → vivid → rich red
  pieces:      ['#c4b5fd','#7c3aed','#5b21b6'],  // lavender → vivid → rich purple
  scales:      ['#6ee7b7','#059669','#047857'],  // light emerald → vivid → rich emerald
  sightread:   ['#67e8f9','#0891b2','#0e7490'],  // light cyan → vivid → rich cyan
  improv:      ['#fdba74','#ea580c','#c2410c'],  // peach → vivid orange → deep orange
  theorycat:   ['#86efac','#16a34a','#15803d'],  // light green → vivid → rich green
  eartraining: ['#d8b4fe','#9333ea','#7e22ce'],  // soft violet → vivid → rich violet
  courses:     ['#6ee7b7','#10b981','#047857'],  // theory course green (#10b981). When other courses ship, split into per-course cats (course_theory green / course_ear pink #ec4899 / course_improv orange #f97316) so each badge matches its course colour.
  depth:       ['#fca5a5','#dc2626','#991b1b'],  // light red → vivid → rich crimson
  books:       ['#a5b4fc','#4338ca','#3730a3'],  // periwinkle → vivid → rich indigo
  variety:     ['#f9a8d4','#db2777','#be185d'],  // soft pink → vivid hot pink → deep rose
  saves:       ['#fde68a','#ca8a04','#a16207'],  // pale gold → vivid gold → deep gold
  reading:     ['#5eead4','#0d9488','#0f766e'],  // light teal → vivid → rich teal
  community:   ['#7dd3fc','#0284c7','#0369a1'],  // sky → vivid → rich sky
  game:        ['#fdba74','#c2410c','#9a3412'],  // peach → vivid orange-red → deep
  library:     ['#f9a8d4','#be185d','#9d174d'],  // soft pink → vivid rose → deep rose
  noterec:     ['#d9f99d','#65a30d','#3f6212'],  // light lime → vivid → deep green
  chordrec:    ['#f0abfc','#c026d3','#86198f'],  // light fuchsia → vivid → deep magenta
  earrec:      ['#a5f3fc','#06b6d4','#0e7490'],  // light cyan → vivid → deep cyan
  live:        ['#fda4af','#e11d48','#9f1239'],  // soft rose → vivid → deep crimson
  roadmap:     ['#fde68a','#f0a500','#9a6a00'],  // pale gold → trophy gold → deep bronze
};
function _lerpHex(h1, h2, t) {
  const p = s => parseInt(s, 16);
  const r = Math.round(p(h1.slice(1,3)) + (p(h2.slice(1,3)) - p(h1.slice(1,3))) * t);
  const g = Math.round(p(h1.slice(3,5)) + (p(h2.slice(3,5)) - p(h1.slice(3,5))) * t);
  const b = Math.round(p(h1.slice(5,7)) + (p(h2.slice(5,7)) - p(h1.slice(5,7))) * t);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
let _bdgUID = 0; // unique ID per badge render — prevents gradient ID conflicts when multiple grids are in the DOM
function achBadgeSVG(ach, earned, size = 54) {
  const uid   = ++_bdgUID;
  const cat   = ach.cat;
  const shape = _BADGE_CAT_SHAPE[cat] || 'circle';
  const el    = _BADGE_SHAPE[shape];

  // Roadmap trophies use the level's STATUE artwork as the badge: full colour when
  // earned (with the same idle bob + sheen + grounding as the roadmap/dashboard
  // trophies), the veiled statue when still locked.
  if (ach.img) {
    if (!earned) {
      return `<img src="${ACH_TROPHY_VEILED}" width="${size}" height="${size}" alt="" draggable="false" loading="lazy"
        style="display:block;object-fit:contain;opacity:.78;filter:drop-shadow(0 2px 4px rgba(30,18,4,.35))">`;
    }
    return `<span class="ach-trophy" style="width:${size}px;height:${size}px;--trophy:url('${ach.img}')"><img src="${ach.img}" width="${size}" height="${size}" alt="" draggable="false" loading="lazy"><span class="ach-trophy-shimmer"></span></span>`;
  }

  if (!earned) {
    // lock icon — colour inherits from parent via CSS variable so it matches muted text
    return `<svg viewBox="0 0 54 54" width="${size}" height="${size}" style="color:var(--text-muted)">
      ${el} fill="var(--ach-lock-fill, rgba(255,255,255,.07))" stroke="var(--ach-lock-stroke, rgba(255,255,255,.18))" stroke-width="1.5"/>
      <g transform="translate(16,16)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></g>
    </svg>`;
  }

  const pal = _BADGE_PALETTE[cat] || _BADGE_PALETTE.sessions;
  const catAchs = ACHIEVEMENTS.filter(a => a.cat === cat);
  const ti = Math.max(0, catAchs.findIndex(a => a.id === ach.id));
  const t  = catAchs.length > 1 ? ti / (catAchs.length - 1) : 0;
  const topC = t <= 0.5 ? _lerpHex(pal[0], pal[1], t * 2) : pal[1];
  const botC = t <= 0.5 ? pal[2] : _lerpHex(pal[2], pal[1], (1 - t) * 2);

  const iconPaths = ACH_ICON_MAP[ach.id] || _AI.STAR;
  // Use a self-contained gradient via SVG paint server defined locally in each SVG.
  // The 'gradientUnits="userSpaceOnUse"' approach uses coordinates, not IDs that
  // could collide across multiple SVGs in the same document.
  return `<svg viewBox="0 0 54 54" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g${uid}" x1="27" y1="2" x2="27" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${topC}"/>
        <stop offset="100%" stop-color="${botC}"/>
      </linearGradient>
      <linearGradient id="s${uid}" x1="0" y1="0" x2="1" y2="0.4">
        <stop offset="0.38" stop-color="#fff" stop-opacity="0"/>
        <stop offset="0.5" stop-color="#fff" stop-opacity="0.5"/>
        <stop offset="0.62" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <clipPath id="c${uid}">${el}/></clipPath>
    </defs>
    ${el} fill="url(#g${uid})" stroke="rgba(255,255,255,.28)" stroke-width="1.5"/>
    ${_BADGE_SHINE[shape]}
    <g clip-path="url(#c${uid})"><rect class="ach-sheen-rect" x="-54" y="0" width="162" height="54" fill="url(#s${uid})" transform="translate(150 0)"/></g>
    <g transform="translate(15,15)"><svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.95)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" style="color:rgba(255,255,255,.95)">${iconPaths}</svg></g>
  </svg>`;
}

// SVG icons per achievement category (replaces emoji ach.icon)
const ACH_CAT_SVG = {
  sessions:    `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>`,
  time:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  streak:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  pieces:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  scales:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  sightread:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  improv:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  theorycat:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  eartraining: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  courses:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2.5 3 6 3s6-2 6-3v-5"/><path d="M22 10v6"/></svg>`,
  books:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  variety:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  saves:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  roadmap:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
};
function achIconSVG(cat) { return ACH_CAT_SVG[cat] || ACH_CAT_SVG.sessions; }

// ── Roadmap trophies ────────────────────────────────────────────────────────
// Each roadmap stage's badge is the level's STATUE artwork (not an SVG icon),
// and locked ones show the veiled statue. Keep ids/order in sync with the maps
// duplicated in community.html and shared-member-modal.js.
const ACH_TROPHY_IMG = {
  rm1: "/statue-l1.webp", rm2: "/statue-l2.webp", rm3: "/statue-l3.webp", rm4: "/statue-l4.webp",
  rm5: "/statue-l5.webp", rm6: "/statue-l6.webp", rm7: "/statue-l7.webp", rm8: "/statue-l8.webp",
};
const ACH_TROPHY_VEILED = "/statue-veiled.webp";
// Cumulative practice MINUTES to reach each stage (= ROADMAP.levels.total hours).
// A trophy only broadcasts when reached by climbing ABOVE your prior-hours level,
// i.e. baselineMins < threshold; anything your prior hours already cover is shown
// but never recorded/broadcast (the "starting line").
const ACH_ROADMAP_MINS = {
  rm1: 0, rm2: 3000, rm3: 9000, rm4: 21000, rm5: 42000, rm6: 72000, rm7: 120000, rm8: 210000,
};

// Count unique practice days (multiple sessions on the same day count as one)
const _achUniqueDays = s => new Set(s.map(x => x.session_date)).size;
// Total practice minutes INCLUDING the user's manually-added prior-hours baseline,
// so roadmap trophies match the level shown on their map.
const _achRoadmapMins = (s, x) => _achTotalMins(s) + ((x && x.baselineMins) || 0);

const ACHIEVEMENTS = [
  // Sessions — counted by unique practice days, not raw session count
  { id:"s1",  cat:"sessions", icon:"🎹", name:"First Note",       desc:"Log your first practice day",            check:s=>_achUniqueDays(s)>=1,    prog:s=>[_achUniqueDays(s),1]   },
  { id:"s10", cat:"sessions", icon:"🎵", name:"Getting Started",  desc:"Practice on 10 different days",          check:s=>_achUniqueDays(s)>=10,   prog:s=>[_achUniqueDays(s),10]  },
  { id:"s50", cat:"sessions", icon:"🎶", name:"Regular",          desc:"Practice on 50 different days",          check:s=>_achUniqueDays(s)>=50,   prog:s=>[_achUniqueDays(s),50]  },
  { id:"s100",cat:"sessions", icon:"💯", name:"Century",          desc:"Practice on 100 different days",         check:s=>_achUniqueDays(s)>=100,  prog:s=>[_achUniqueDays(s),100] },
  { id:"s250",cat:"sessions", icon:"🏅", name:"Dedicated",        desc:"Practice on 250 different days",         check:s=>_achUniqueDays(s)>=250,  prog:s=>[_achUniqueDays(s),250] },
  { id:"s500",cat:"sessions", icon:"👑", name:"Elite",            desc:"Practice on 500 different days",         check:s=>_achUniqueDays(s)>=500,  prog:s=>[_achUniqueDays(s),500] },
  // Time
  { id:"t1",  cat:"time",     icon:"⏱️", name:"First Hour",       desc:"Practise for 1 hour total",              check:s=>_achTotalMins(s)>=60,    prog:s=>[_achTotalMins(s),60]    },
  { id:"t10", cat:"time",     icon:"⌚", name:"Ten Hours",        desc:"Practise for 10 hours total",            check:s=>_achTotalMins(s)>=600,   prog:s=>[_achTotalMins(s),600]   },
  { id:"t50", cat:"time",     icon:"⭐", name:"Fifty Hours",      desc:"Practise for 50 hours total",            check:s=>_achTotalMins(s)>=3000,  prog:s=>[_achTotalMins(s),3000]  },
  { id:"t100",cat:"time",     icon:"🌟", name:"100 Hours",        desc:"Practise for 100 hours total",           check:s=>_achTotalMins(s)>=6000,  prog:s=>[_achTotalMins(s),6000]  },
  { id:"t500",cat:"time",     icon:"💫", name:"500 Hours",        desc:"Practise for 500 hours total",           check:s=>_achTotalMins(s)>=30000, prog:s=>[_achTotalMins(s),30000] },
  { id:"tmo25",cat:"time",    icon:"📆", name:"Big Month",        desc:"Log 25 hours of practice in a single calendar month", check:s=>_achMaxMonthMins(s)>=1500, prog:s=>[Math.round(_achMaxMonthMins(s)),1500] },
  // Streak
  { id:"k3",  cat:"streak",   icon:"🔥", name:"On a Roll",        desc:"Achieve a 3-day streak",                 check:s=>_achMaxStreak(s)>=3,    prog:s=>[_achMaxStreak(s),3]   },
  { id:"k7",  cat:"streak",   icon:"🔥", name:"Week Warrior",     desc:"Achieve a 7-day streak",                 check:s=>_achMaxStreak(s)>=7,    prog:s=>[_achMaxStreak(s),7]   },
  { id:"k14", cat:"streak",   icon:"🔥", name:"Fortnight",        desc:"Achieve a 14-day streak",                check:s=>_achMaxStreak(s)>=14,   prog:s=>[_achMaxStreak(s),14]  },
  { id:"k30", cat:"streak",   icon:"🔥", name:"Monthly",          desc:"Achieve a 30-day streak",                check:s=>_achMaxStreak(s)>=30,   prog:s=>[_achMaxStreak(s),30]  },
  { id:"k60", cat:"streak",   icon:"🌋", name:"Two Months",       desc:"Achieve a 60-day streak",                check:s=>_achMaxStreak(s)>=60,   prog:s=>[_achMaxStreak(s),60]  },
  { id:"k100",cat:"streak",   icon:"💯", name:"100 Days",         desc:"Achieve a 100-day streak",               check:s=>_achMaxStreak(s)>=100,  prog:s=>[_achMaxStreak(s),100] },
  { id:"k180",cat:"streak",   icon:"🌙", name:"Six Months",       desc:"Achieve a 180-day streak",               check:s=>_achMaxStreak(s)>=180,  prog:s=>[_achMaxStreak(s),180] },
  { id:"k365",cat:"streak",   icon:"🌍", name:"Full Year",        desc:"Achieve a 365-day streak",               check:s=>_achMaxStreak(s)>=365,  prog:s=>[_achMaxStreak(s),365] },
  // Pieces
  { id:"p1",  cat:"pieces",   icon:"🎵", name:"First Piece",      desc:"Practise a piece for the first time",    check:s=>_achUniquePieces(s)>=1,   prog:s=>[_achUniquePieces(s),1]  },
  { id:"p5",  cat:"pieces",   icon:"🎼", name:"Repertoire",       desc:"Practise 5 different pieces",            check:s=>_achUniquePieces(s)>=5,   prog:s=>[_achUniquePieces(s),5]  },
  { id:"p15", cat:"pieces",   icon:"📚", name:"Growing Library",  desc:"Practise 15 different pieces",           check:s=>_achUniquePieces(s)>=15,  prog:s=>[_achUniquePieces(s),15] },
  { id:"p30", cat:"pieces",   icon:"🎭", name:"Expanding Repertoire", desc:"Practise 30 different pieces",          check:s=>_achUniquePieces(s)>=30,  prog:s=>[_achUniquePieces(s),30] },
  { id:"p50", cat:"pieces",   icon:"🎪", name:"Recital Ready",    desc:"Practise 50 different pieces",           check:s=>_achUniquePieces(s)>=50,  prog:s=>[_achUniquePieces(s),50] },
  // Piece depth
  { id:"pd1", cat:"pieces",   icon:"🎯", name:"Committed",        desc:"Log 1 hour on a single piece",           check:s=>_achMaxPieceMins(s)>=60,   prog:s=>[Math.round(_achMaxPieceMins(s)),60]   },
  { id:"pd5", cat:"pieces",   icon:"🏅", name:"Deep Work",        desc:"Log 5 hours on a single piece",          check:s=>_achMaxPieceMins(s)>=300,  prog:s=>[Math.round(_achMaxPieceMins(s)),300]  },
  { id:"pd10",cat:"pieces",   icon:"⭐", name:"Dedicated",        desc:"Log 10 hours on a single piece",         check:s=>_achMaxPieceMins(s)>=600,  prog:s=>[Math.round(_achMaxPieceMins(s)),600]  },
  { id:"pd20",cat:"pieces",   icon:"💎", name:"Mastery",          desc:"Log 20 hours on a single piece",         check:s=>_achMaxPieceMins(s)>=1200, prog:s=>[Math.round(_achMaxPieceMins(s)),1200] },
  // Scales & technique
  { id:"sc1", cat:"scales",   icon:"🎹", name:"Scale Up",         desc:"Practise your first scale or technique",           check:s=>_achUniqueScales(s)>=1,   prog:s=>[_achUniqueScales(s),1]   },
  { id:"sc5", cat:"scales",   icon:"🎶", name:"Well-Rounded",     desc:"Practise 5 different scales or techniques",         check:s=>_achUniqueScales(s)>=5,   prog:s=>[_achUniqueScales(s),5]   },
  { id:"sc15",cat:"scales",   icon:"🌊", name:"Technical Depth",  desc:"Practise 15 different scales or techniques",        check:s=>_achUniqueScales(s)>=15,  prog:s=>[_achUniqueScales(s),15]  },
  { id:"ss5", cat:"scales",   icon:"🔁", name:"Persistent",       desc:"Return to the same scale or technique 5 times",     check:s=>_achMaxScaleSessions(s)>=5,   prog:s=>[_achMaxScaleSessions(s),5]   },
  { id:"ss10",cat:"scales",   icon:"⚙️", name:"Drilled",          desc:"Return to the same scale or technique 10 times",    check:s=>_achMaxScaleSessions(s)>=10,  prog:s=>[_achMaxScaleSessions(s),10]  },
  { id:"ss25",cat:"scales",   icon:"🏋️", name:"Iron Fingers",     desc:"Return to the same scale or technique 25 times",    check:s=>_achMaxScaleSessions(s)>=25,  prog:s=>[_achMaxScaleSessions(s),25]  },
  { id:"ss50",cat:"scales",   icon:"👑", name:"Scale Master",     desc:"Return to the same scale or technique 50 times",    check:s=>_achMaxScaleSessions(s)>=50,  prog:s=>[_achMaxScaleSessions(s),50]  },
  // Sight Reading — sessions
  { id:"sr1",   cat:"sightread",   icon:"👁️",  name:"First Glance",      desc:"Log your first sight-reading session",              check:s=>_achItemTypeSessions(s,"sightreading")>=1,   prog:s=>[_achItemTypeSessions(s,"sightreading"),1]    },
  { id:"sr10",  cat:"sightread",   icon:"👀",  name:"Quick Reader",       desc:"Log 10 sight-reading sessions",                    check:s=>_achItemTypeSessions(s,"sightreading")>=10,  prog:s=>[_achItemTypeSessions(s,"sightreading"),10]   },
  { id:"sr30",  cat:"sightread",   icon:"📄",  name:"Sharp Eyes",         desc:"Log 30 sight-reading sessions",                    check:s=>_achItemTypeSessions(s,"sightreading")>=30,  prog:s=>[_achItemTypeSessions(s,"sightreading"),30]   },
  // Sight Reading — time
  { id:"srt1",  cat:"sightread",   icon:"⏱️",  name:"Reading Hour",       desc:"Spend 1 hour on sight-reading",                    check:s=>_achItemTypeMins(s,"sightreading")>=60,      prog:s=>[_achItemTypeMins(s,"sightreading"),60]       },
  { id:"srt5",  cat:"sightread",   icon:"📖",  name:"Dedicated Reader",   desc:"Spend 5 hours on sight-reading",                   check:s=>_achItemTypeMins(s,"sightreading")>=300,     prog:s=>[_achItemTypeMins(s,"sightreading"),300]      },
  { id:"srt25", cat:"sightread",   icon:"🔭",  name:"Sight Reader",       desc:"Spend 25 hours on sight-reading",                  check:s=>_achItemTypeMins(s,"sightreading")>=1500,    prog:s=>[_achItemTypeMins(s,"sightreading"),1500]     },
  { id:"srt50", cat:"sightread",   icon:"🌟",  name:"Music Reader",       desc:"Spend 50 hours on sight-reading",                  check:s=>_achItemTypeMins(s,"sightreading")>=3000,    prog:s=>[_achItemTypeMins(s,"sightreading"),3000]     },
  // Improvisation — sessions
  { id:"im1",   cat:"improv",      icon:"💡",  name:"Free Spirit",        desc:"Log your first improvisation session",              check:s=>_achItemTypeSessions(s,"improvisation")>=1,  prog:s=>[_achItemTypeSessions(s,"improvisation"),1]   },
  { id:"im10",  cat:"improv",      icon:"🎸",  name:"Improviser",         desc:"Log 10 improvisation sessions",                    check:s=>_achItemTypeSessions(s,"improvisation")>=10, prog:s=>[_achItemTypeSessions(s,"improvisation"),10]  },
  { id:"im30",  cat:"improv",      icon:"🎺",  name:"Jazz Hands",         desc:"Log 30 improvisation sessions",                    check:s=>_achItemTypeSessions(s,"improvisation")>=30, prog:s=>[_achItemTypeSessions(s,"improvisation"),30]  },
  // Improvisation — time
  { id:"imt1",  cat:"improv",      icon:"⏱️",  name:"In the Flow",        desc:"Spend 1 hour on improvisation",                    check:s=>_achItemTypeMins(s,"improvisation")>=60,     prog:s=>[_achItemTypeMins(s,"improvisation"),60]      },
  { id:"imt5",  cat:"improv",      icon:"🎵",  name:"Creative Hours",     desc:"Spend 5 hours on improvisation",                   check:s=>_achItemTypeMins(s,"improvisation")>=300,    prog:s=>[_achItemTypeMins(s,"improvisation"),300]     },
  { id:"imt25", cat:"improv",      icon:"🌀",  name:"Jam Master",         desc:"Spend 25 hours on improvisation",                  check:s=>_achItemTypeMins(s,"improvisation")>=1500,   prog:s=>[_achItemTypeMins(s,"improvisation"),1500]    },
  { id:"imt50", cat:"improv",      icon:"🌟",  name:"Free Form",          desc:"Spend 50 hours on improvisation",                  check:s=>_achItemTypeMins(s,"improvisation")>=3000,   prog:s=>[_achItemTypeMins(s,"improvisation"),3000]    },
  // Theory — sessions
  { id:"th1",   cat:"theorycat",   icon:"📐",  name:"By the Book",        desc:"Log your first theory session",                    check:s=>_achItemTypeSessions(s,"theory")>=1,         prog:s=>[_achItemTypeSessions(s,"theory"),1]          },
  { id:"th10",  cat:"theorycat",   icon:"📝",  name:"Studious",           desc:"Log 10 theory sessions",                           check:s=>_achItemTypeSessions(s,"theory")>=10,        prog:s=>[_achItemTypeSessions(s,"theory"),10]         },
  { id:"th30",  cat:"theorycat",   icon:"🎓",  name:"Deep Thinker",       desc:"Log 30 theory sessions",                           check:s=>_achItemTypeSessions(s,"theory")>=30,        prog:s=>[_achItemTypeSessions(s,"theory"),30]         },
  // Theory — time
  { id:"tht1",  cat:"theorycat",   icon:"⏱️",  name:"Theory Hour",        desc:"Spend 1 hour on theory",                           check:s=>_achItemTypeMins(s,"theory")>=60,            prog:s=>[_achItemTypeMins(s,"theory"),60]             },
  { id:"tht5",  cat:"theorycat",   icon:"📚",  name:"Dedicated Student",  desc:"Spend 5 hours on theory",                          check:s=>_achItemTypeMins(s,"theory")>=300,           prog:s=>[_achItemTypeMins(s,"theory"),300]            },
  { id:"tht25", cat:"theorycat",   icon:"🏛️",  name:"Music Theorist",     desc:"Spend 25 hours on theory",                         check:s=>_achItemTypeMins(s,"theory")>=1500,          prog:s=>[_achItemTypeMins(s,"theory"),1500]           },
  { id:"tht50", cat:"theorycat",   icon:"🌟",  name:"Theorist",           desc:"Spend 50 hours on theory",                         check:s=>_achItemTypeMins(s,"theory")>=3000,          prog:s=>[_achItemTypeMins(s,"theory"),3000]           },
  // Ear Training — sessions
  { id:"et1",   cat:"eartraining", icon:"👂",  name:"First Listen",       desc:"Log your first ear training session",               check:s=>_achItemTypeSessions(s,"eartraining")>=1,    prog:s=>[_achItemTypeSessions(s,"eartraining"),1]     },
  { id:"et10",  cat:"eartraining", icon:"🎧",  name:"Sharp Ears",         desc:"Log 10 ear training sessions",                     check:s=>_achItemTypeSessions(s,"eartraining")>=10,   prog:s=>[_achItemTypeSessions(s,"eartraining"),10]    },
  { id:"et30",  cat:"eartraining", icon:"🔊",  name:"Keen Ear",           desc:"Log 30 ear training sessions",                     check:s=>_achItemTypeSessions(s,"eartraining")>=30,   prog:s=>[_achItemTypeSessions(s,"eartraining"),30]    },
  // Ear Training — time
  { id:"ett1",  cat:"eartraining", icon:"⏱️",  name:"Listening Hour",     desc:"Spend 1 hour on ear training",                     check:s=>_achItemTypeMins(s,"eartraining")>=60,       prog:s=>[_achItemTypeMins(s,"eartraining"),60]        },
  { id:"ett5",  cat:"eartraining", icon:"🎵",  name:"Tuned In",           desc:"Spend 5 hours on ear training",                    check:s=>_achItemTypeMins(s,"eartraining")>=300,      prog:s=>[_achItemTypeMins(s,"eartraining"),300]       },
  { id:"ett25", cat:"eartraining", icon:"🎶",  name:"Golden Ear",         desc:"Spend 25 hours on ear training",                   check:s=>_achItemTypeMins(s,"eartraining")>=1500,     prog:s=>[_achItemTypeMins(s,"eartraining"),1500]      },
  { id:"ett50", cat:"eartraining", icon:"👑",  name:"Perfect Pitch",      desc:"Spend 50 hours on ear training",                   check:s=>_achItemTypeMins(s,"eartraining")>=3000,     prog:s=>[_achItemTypeMins(s,"eartraining"),3000]      },
  // Courses — lesson + level completion (driven by lesson_progress, not practice logging).
  // Extend as levels/courses ship: add course_theory_level2, course_eartraining_level1, etc.
  { id:"course_first_lesson",  cat:"courses", icon:"📖", name:"First Lesson",     desc:"Complete your first course lesson",             check:(s,x)=>(x.lessonsCompleted||0)>=1,  prog:(s,x)=>[x.lessonsCompleted||0,1] },
  { id:"course_theory_level1", cat:"courses", icon:"🎓", name:"Theory: Level 1",  desc:"Complete every lesson in Music Theory Level 1",  check:(s,x)=>(x.theoryL1Total||0)>0 && (x.theoryL1Done||0)>=(x.theoryL1Total||0),  prog:(s,x)=>[x.theoryL1Done||0, x.theoryL1Total||13] },
  // Level 2 is being drip-released. Guard against early-firing: only earn once the FULL
  // planned level (theoryL2Planned) is published AND all of it is done. Until then
  // theoryL2Total (published count) is below the planned total, so it cannot fire.
  { id:"course_theory_level2", cat:"courses", icon:"🏆", name:"Theory: Level 2",  desc:"Complete every lesson in Music Theory Level 2",  check:(s,x)=>(x.theoryL2Total||0) >= (x.theoryL2Planned||12) && (x.theoryL2Done||0) >= (x.theoryL2Total||0),  prog:(s,x)=>[x.theoryL2Done||0, x.theoryL2Planned||12] },
  // Long sessions
  { id:"d60", cat:"depth",    icon:"🎯", name:"Deep Practice",    desc:"Complete a session of 1 hour or more",   check:s=>s.some(ss=>(ss.duration_minutes||0)>=60)  },
  { id:"d120",cat:"depth",    icon:"🏋️", name:"Marathon",         desc:"Complete a session of 2 hours or more",  check:s=>s.some(ss=>(ss.duration_minutes||0)>=120) },
  { id:"d180",cat:"depth",    icon:"🌋", name:"In the Zone",      desc:"Complete a session of 3 hours or more",  check:s=>s.some(ss=>(ss.duration_minutes||0)>=180) },
  // Monthly consistency
  { id:"mo20",cat:"sessions", icon:"📅", name:"Monthly Commitment", desc:"Practice 20 or more days in a single calendar month", check:s=>_achMaxMonthDays(s)>=20, prog:s=>[_achMaxMonthDays(s),20] },
  { id:"pweek",cat:"streak",  icon:"🗓️", name:"Perfect Week",       desc:"Practise all 7 days of a single calendar week",       check:s=>_achHasPerfectWeek(s) },
  { id:"wkwarr",cat:"sessions",icon:"🌅", name:"Weekend Warrior",    desc:"Practise on both Saturday and Sunday of the same weekend", check:s=>_achHasWeekendWarrior(s) },
  // Books / Method books — sessions
  { id:"bk1",  cat:"books",  icon:"📗", name:"First Chapter",    desc:"Log your first method book session",               check:s=>_achItemTypeSessions(s,"book")>=1,   prog:s=>[_achItemTypeSessions(s,"book"),1]   },
  { id:"bk10", cat:"books",  icon:"📘", name:"Methodical",       desc:"Log 10 method book sessions",                     check:s=>_achItemTypeSessions(s,"book")>=10,  prog:s=>[_achItemTypeSessions(s,"book"),10]  },
  { id:"bk30", cat:"books",  icon:"📙", name:"By the Method",    desc:"Log 30 method book sessions",                     check:s=>_achItemTypeSessions(s,"book")>=30,  prog:s=>[_achItemTypeSessions(s,"book"),30]  },
  // Books / Method books — time
  { id:"bkt5",  cat:"books", icon:"⏱️", name:"Method Hours",     desc:"Spend 5 hours working through method books",      check:s=>_achItemTypeMins(s,"book")>=300,     prog:s=>[_achItemTypeMins(s,"book"),300]     },
  { id:"bkt25", cat:"books", icon:"🏆", name:"Textbook",         desc:"Spend 25 hours working through method books",     check:s=>_achItemTypeMins(s,"book")>=1500,    prog:s=>[_achItemTypeMins(s,"book"),1500]    },
  // Variety / Well-Rounded
  { id:"vcomp",cat:"variety", icon:"🎨", name:"Complete Session",  desc:"Log a session with a piece, technique, and theory/ear training/improvisation/sight-reading", check:s=>_achHasCompleteSession(s) },
  { id:"v4",   cat:"variety", icon:"🌈", name:"Well-Rounded",     desc:"Include 4 or more different practice types in a single session",                              check:s=>_achMaxVarietyTypes(s)>=4, prog:s=>[_achMaxVarietyTypes(s),4] },
  { id:"renais",cat:"variety", icon:"🎨", name:"Renaissance Musician", desc:"Practise every type: piece, technique, sight-reading, improvisation, theory, ear training and method book", check:s=>_achRenaissanceCount(s)>=7, prog:s=>[_achRenaissanceCount(s),7] },
  // Streak saves
  { id:"sv1",  cat:"saves",  icon:"🛡️", name:"Safety Net",       desc:"Use your first streak save token",                check:(s,x)=>(x.streakSaves||0)>=1, prog:(s,x)=>[(x.streakSaves||0),1] },
  { id:"sv3",  cat:"saves",  icon:"🔄", name:"Resilient",        desc:"Save your streak 3 times",                        check:(s,x)=>(x.streakSaves||0)>=3, prog:(s,x)=>[(x.streakSaves||0),3] },
  { id:"sv5",  cat:"saves",  icon:"💪", name:"Never Give Up",    desc:"Save your streak 5 times",                        check:(s,x)=>(x.streakSaves||0)>=5, prog:(s,x)=>[(x.streakSaves||0),5] },
  // Reading (Piano Practice Daily)
  { id:"r1",  cat:"reading",  icon:"📖", name:"First Read",       desc:"Save your first theory sheet",                     check:(s,x)=>(x.savedCount||0)>=1,    prog:(s,x)=>[(x.savedCount||0),1]    },
  { id:"r5",  cat:"reading",  icon:"📚", name:"Keen Reader",      desc:"Save 5 theory sheets to your reading list",         check:(s,x)=>(x.savedCount||0)>=5,    prog:(s,x)=>[(x.savedCount||0),5]    },
  { id:"r10", cat:"reading",  icon:"🎓", name:"Music Scholar",    desc:"Finish reading 10 theory sheets",                   check:(s,x)=>(x.readCount||0)>=10,    prog:(s,x)=>[(x.readCount||0),10]    },
  { id:"r25", cat:"reading",  icon:"🏛️", name:"Deep Dive",        desc:"Finish reading 25 theory sheets",                   check:(s,x)=>(x.readCount||0)>=25,    prog:(s,x)=>[(x.readCount||0),25]    },
  // Pieces Library
  { id:"c1",   cat:"library", icon:"🎵", name:"Collector",        desc:"Add your first piece to your collection",              check:(s,x)=>(x.colTotal||0)>=1,          prog:(s,x)=>[(x.colTotal||0),1]          },
  { id:"c5",   cat:"library", icon:"🎼", name:"Curator",          desc:"Have 5 pieces in your collection",                     check:(s,x)=>(x.colTotal||0)>=5,          prog:(s,x)=>[(x.colTotal||0),5]          },
  { id:"c10",  cat:"library", icon:"📀", name:"Aficionado",       desc:"Build a collection of 10 pieces",                      check:(s,x)=>(x.colTotal||0)>=10,         prog:(s,x)=>[(x.colTotal||0),10]         },
  { id:"c25",  cat:"library", icon:"🎹", name:"Connoisseur",      desc:"Amass a collection of 25 pieces",                      check:(s,x)=>(x.colTotal||0)>=25,         prog:(s,x)=>[(x.colTotal||0),25]         },
  { id:"c5l",  cat:"library", icon:"📝", name:"Busy Hands",       desc:"Have 5 pieces on the go at once",                      check:(s,x)=>(x.colLearning||0)>=5,       prog:(s,x)=>[(x.colLearning||0),5]       },
  { id:"c3a",  cat:"library", icon:"🌠", name:"Dream Big",        desc:"Add 3 pieces to your aspire list",                     check:(s,x)=>(x.colAspire||0)>=3,         prog:(s,x)=>[(x.colAspire||0),3]         },
  { id:"c10a", cat:"library", icon:"✨", name:"Sky's the Limit",  desc:"Have 10 pieces on your aspire list",                   check:(s,x)=>(x.colAspire||0)>=10,        prog:(s,x)=>[(x.colAspire||0),10]        },
  { id:"c1c",  cat:"library", icon:"✅", name:"First Finish",     desc:"Mark your first piece as completed",                   check:(s,x)=>(x.colCompleted||0)>=1,      prog:(s,x)=>[(x.colCompleted||0),1]      },
  { id:"c3c",  cat:"library", icon:"🥉", name:"Hat Trick",        desc:"Complete 3 pieces in your collection",                 check:(s,x)=>(x.colCompleted||0)>=3,      prog:(s,x)=>[(x.colCompleted||0),3]      },
  { id:"c5c",  cat:"library", icon:"🏆", name:"Completionist",    desc:"Complete 5 pieces in your collection",                 check:(s,x)=>(x.colCompleted||0)>=5,      prog:(s,x)=>[(x.colCompleted||0),5]      },
  { id:"c10c", cat:"library", icon:"👑", name:"Grandmaster",      desc:"Complete 10 pieces in your collection",                check:(s,x)=>(x.colCompleted||0)>=10,     prog:(s,x)=>[(x.colCompleted||0),10]     },
  // Passage Fixer
  { id:"g1",   cat:"game",    icon:"🎯", name:"Fixer",            desc:"Play your first Passage Fixer game",                   check:(s,x)=>(x.gamesTotal||0)>=1,        prog:(s,x)=>[(x.gamesTotal||0),1]        },
  { id:"g5t",  cat:"game",    icon:"🔧", name:"Getting Into It",  desc:"Play 5 Passage Fixer games",                           check:(s,x)=>(x.gamesTotal||0)>=5,        prog:(s,x)=>[(x.gamesTotal||0),5]        },
  { id:"g25t", cat:"game",    icon:"🛠️", name:"Regular Fixer",    desc:"Play 25 Passage Fixer games",                          check:(s,x)=>(x.gamesTotal||0)>=25,       prog:(s,x)=>[(x.gamesTotal||0),25]       },
  { id:"g1c",  cat:"game",    icon:"💥", name:"Cleared!",         desc:"Clear your first passage",                             check:(s,x)=>(x.gamesCleared||0)>=1,      prog:(s,x)=>[(x.gamesCleared||0),1]      },
  { id:"g10c", cat:"game",    icon:"⚡", name:"Passage Master",   desc:"Clear 10 passages",                                    check:(s,x)=>(x.gamesCleared||0)>=10,     prog:(s,x)=>[(x.gamesCleared||0),10]     },
  { id:"g50c", cat:"game",    icon:"🌊", name:"Unstoppable",      desc:"Clear 50 passages total",                              check:(s,x)=>(x.gamesCleared||0)>=50,     prog:(s,x)=>[(x.gamesCleared||0),50]     },
  { id:"g1p",  cat:"game",    icon:"💎", name:"Clean Run",        desc:"Clear a passage without a single mistake",             check:(s,x)=>(x.gamesPerfect||0)>=1,      prog:(s,x)=>[(x.gamesPerfect||0),1]      },
  { id:"g5p",  cat:"game",    icon:"🌟", name:"Perfectionist",    desc:"Clear 5 passages without any mistakes",                check:(s,x)=>(x.gamesPerfect||0)>=5,      prog:(s,x)=>[(x.gamesPerfect||0),5]      },
  { id:"g3d",  cat:"game",    icon:"🗺️", name:"Explorer",         desc:"Work on 3 different passages",                         check:(s,x)=>(x.uniquePassages||0)>=3,    prog:(s,x)=>[(x.uniquePassages||0),3]    },
  { id:"g10d", cat:"game",    icon:"🧭", name:"Passage Explorer", desc:"Work on 10 different passages",                        check:(s,x)=>(x.uniquePassages||0)>=10,   prog:(s,x)=>[(x.uniquePassages||0),10]   },
  { id:"g5",   cat:"game",    icon:"🔑", name:"Level 5",          desc:"Reach level 5 on a single passage",                   check:(s,x)=>(x.maxGameLevel||0)>=5                                              },
  { id:"g10",  cat:"game",    icon:"🚀", name:"Level 10",         desc:"Reach level 10 on a single passage",                  check:(s,x)=>(x.maxGameLevel||0)>=10                                             },
  // Note Recognition Game
  { id:"nrg1",  cat:"noterec", icon:"🎵", name:"First Game",       desc:"Play your first note recognition game",               check:(s,x)=>(x.nrGamesPlayed||0)>=1,   prog:(s,x)=>[(x.nrGamesPlayed||0),1]   },
  { id:"nrg10", cat:"noterec", icon:"🎵", name:"Keen Player",      desc:"Play 10 note recognition games",                      check:(s,x)=>(x.nrGamesPlayed||0)>=10,  prog:(s,x)=>[(x.nrGamesPlayed||0),10]  },
  { id:"nrg50", cat:"noterec", icon:"🎵", name:"Note Enthusiast",  desc:"Play 50 note recognition games",                      check:(s,x)=>(x.nrGamesPlayed||0)>=50,  prog:(s,x)=>[(x.nrGamesPlayed||0),50]  },
  { id:"nrs5",  cat:"noterec", icon:"🎵", name:"First Notes",      desc:"Score 5 correct in a single game",                    check:(s,x)=>(x.nrBestScore||0)>=5,     prog:(s,x)=>[(x.nrBestScore||0),5]     },
  { id:"nrs10", cat:"noterec", icon:"🎵", name:"Note Spotter",     desc:"Score 10 correct in a single game",                   check:(s,x)=>(x.nrBestScore||0)>=10,    prog:(s,x)=>[(x.nrBestScore||0),10]    },
  { id:"nrs20", cat:"noterec", icon:"🎵", name:"Sharp Eyes",       desc:"Score 20 correct in a single game",                   check:(s,x)=>(x.nrBestScore||0)>=20,    prog:(s,x)=>[(x.nrBestScore||0),20]    },
  { id:"nrs30", cat:"noterec", icon:"🎵", name:"Note Ace",         desc:"Score 30 correct in a single game",                   check:(s,x)=>(x.nrBestScore||0)>=30,    prog:(s,x)=>[(x.nrBestScore||0),30]    },
  { id:"nrs50", cat:"noterec", icon:"🎵", name:"Note Master",      desc:"Score 50 correct in a single game",                   check:(s,x)=>(x.nrBestScore||0)>=50,    prog:(s,x)=>[(x.nrBestScore||0),50]    },
  { id:"nrtreb",cat:"noterec", icon:"🎵", name:"Treble Reader",    desc:"Score 10 correct in the treble clef",                 check:(s,x)=>(x.nrBestTreble||0)>=10,   prog:(s,x)=>[(x.nrBestTreble||0),10]   },
  { id:"nrb10", cat:"noterec", icon:"🎵", name:"Bass Reader",      desc:"Score 10 correct in the bass clef",                   check:(s,x)=>(x.nrBestBass||0)>=10,     prog:(s,x)=>[(x.nrBestBass||0),10]     },
  { id:"nrmix", cat:"noterec", icon:"🎵", name:"Mixed Master",     desc:"Score 10 correct with mixed clef",                    check:(s,x)=>(x.nrBestMixed||0)>=10,    prog:(s,x)=>[(x.nrBestMixed||0),10]    },
  { id:"nracc", cat:"noterec", icon:"🎵", name:"Sharps & Flats",   desc:"Score 10 correct with accidentals enabled",            check:(s,x)=>(x.nrBestAcc||0)>=10,      prog:(s,x)=>[(x.nrBestAcc||0),10]      },
  // Note Recognition — key-signature mode (new key selector)
  { id:"nrkey", cat:"noterec", icon:"🎵", name:"In Key",           desc:"Score 10 correct in key-signature mode",               check:(s,x)=>(x.nrBestKey||0)>=10,      prog:(s,x)=>[(x.nrBestKey||0),10]      },
  { id:"nrkey3",cat:"noterec", icon:"🎵", name:"Key Explorer",     desc:"Play key-signature mode in 3 different keys",          check:(s,x)=>(x.nrKeysPlayed||0)>=3,    prog:(s,x)=>[(x.nrKeysPlayed||0),3]    },
  // Chord Recognition Game — games played
  { id:"crg1",  cat:"chordrec", icon:"🎹", name:"First Chord",      desc:"Play your first chord recognition game",               check:(s,x)=>(x.crGamesPlayed||0)>=1,   prog:(s,x)=>[(x.crGamesPlayed||0),1]   },
  { id:"crg10", cat:"chordrec", icon:"🎹", name:"Chord Keen",       desc:"Play 10 chord recognition games",                      check:(s,x)=>(x.crGamesPlayed||0)>=10,  prog:(s,x)=>[(x.crGamesPlayed||0),10]  },
  { id:"crg50", cat:"chordrec", icon:"🎹", name:"Chord Enthusiast", desc:"Play 50 chord recognition games",                      check:(s,x)=>(x.crGamesPlayed||0)>=50,  prog:(s,x)=>[(x.crGamesPlayed||0),50]  },
  // Chord Recognition Game — best score
  { id:"crs10", cat:"chordrec", icon:"🎹", name:"Chord Spotter",    desc:"Score 10 correct in a single chord game",              check:(s,x)=>(x.crBestScore||0)>=10,    prog:(s,x)=>[(x.crBestScore||0),10]    },
  { id:"crs20", cat:"chordrec", icon:"🎹", name:"Triad Tracker",    desc:"Score 20 correct in a single chord game",              check:(s,x)=>(x.crBestScore||0)>=20,    prog:(s,x)=>[(x.crBestScore||0),20]    },
  { id:"crs30", cat:"chordrec", icon:"🎹", name:"Chord Master",     desc:"Score 30 correct in a single chord game",              check:(s,x)=>(x.crBestScore||0)>=30,    prog:(s,x)=>[(x.crBestScore||0),30]    },
  // Chord Recognition Game — clef / mode
  { id:"crtreb",cat:"chordrec", icon:"🎹", name:"Treble Chords",    desc:"Score 10 correct in the treble clef",                  check:(s,x)=>(x.crBestTreble||0)>=10,   prog:(s,x)=>[(x.crBestTreble||0),10]   },
  { id:"crbass",cat:"chordrec", icon:"🎹", name:"Bass Chords",      desc:"Score 10 correct in the bass clef",                    check:(s,x)=>(x.crBestBass||0)>=10,     prog:(s,x)=>[(x.crBestBass||0),10]     },
  { id:"crkey", cat:"chordrec", icon:"🎹", name:"Key Aware",        desc:"Score 10 correct in key-signature mode",               check:(s,x)=>(x.crBestKey||0)>=10,      prog:(s,x)=>[(x.crBestKey||0),10]      },

  // Chord Ear Training Game — games played
  { id:"earg1",  cat:"earrec", icon:"👂", name:"First Ear",       desc:"Play your first chord ear-training game",          check:(s,x)=>(x.earGamesPlayed||0)>=1,  prog:(s,x)=>[(x.earGamesPlayed||0),1]  },
  { id:"earg10", cat:"earrec", icon:"👂", name:"Ear Trainer",     desc:"Play 10 chord ear-training games",                 check:(s,x)=>(x.earGamesPlayed||0)>=10, prog:(s,x)=>[(x.earGamesPlayed||0),10] },
  { id:"earg50", cat:"earrec", icon:"👂", name:"Dedicated Ear",   desc:"Play 50 chord ear-training games",                 check:(s,x)=>(x.earGamesPlayed||0)>=50, prog:(s,x)=>[(x.earGamesPlayed||0),50] },
  // Chord Ear Training Game — best score
  { id:"ears10", cat:"earrec", icon:"👂", name:"Ear Spotter",     desc:"Score 10 correct in a single ear-training game",   check:(s,x)=>(x.earBestScore||0)>=10,   prog:(s,x)=>[(x.earBestScore||0),10]   },
  { id:"ears20", cat:"earrec", icon:"👂", name:"Sharp Listener",  desc:"Score 20 correct in a single ear-training game",   check:(s,x)=>(x.earBestScore||0)>=20,   prog:(s,x)=>[(x.earBestScore||0),20]   },
  { id:"ears30", cat:"earrec", icon:"👂", name:"Ear Master",      desc:"Score 30 correct in a single ear-training game",   check:(s,x)=>(x.earBestScore||0)>=30,   prog:(s,x)=>[(x.earBestScore||0),30]   },
  // Chord Ear Training Game — modes
  { id:"earex",  cat:"earrec", icon:"👂", name:"Name That Chord", desc:"Score 10 identifying the exact chord by ear",      check:(s,x)=>(x.earBestExact||0)>=10,   prog:(s,x)=>[(x.earBestExact||0),10]   },
  { id:"earkey", cat:"earrec", icon:"👂", name:"Diatonic Ear",    desc:"Score 10 in a key by ear",                         check:(s,x)=>(x.earBestKey||0)>=10,     prog:(s,x)=>[(x.earBestKey||0),10]     },
  { id:"earext", cat:"earrec", icon:"👂", name:"Extended Ear",    desc:"Score 10 on the extensions set by ear",            check:(s,x)=>(x.earBestExt||0)>=10,     prog:(s,x)=>[(x.earBestExt||0),10]     },
  // Community — posts
  { id:"cmp1",  cat:"community", icon:"📣", name:"First Post",       desc:"Share your first post with the community",             check:(s,x)=>(x.postCount||0)>=1,       prog:(s,x)=>[(x.postCount||0),1]       },
  { id:"cmp10", cat:"community", icon:"📣", name:"Contributor",      desc:"Share 10 posts with the community",                    check:(s,x)=>(x.postCount||0)>=10,      prog:(s,x)=>[(x.postCount||0),10]      },
  { id:"cmp25", cat:"community", icon:"📣", name:"Active Voice",     desc:"Share 25 posts with the community",                    check:(s,x)=>(x.postCount||0)>=25,      prog:(s,x)=>[(x.postCount||0),25]      },
  { id:"cmp50", cat:"community", icon:"📣", name:"Community Pillar", desc:"Share 50 posts with the community",                    check:(s,x)=>(x.postCount||0)>=50,      prog:(s,x)=>[(x.postCount||0),50]      },
  // Community — comments
  { id:"cmc1",  cat:"community", icon:"💬", name:"First Comment",    desc:"Leave your first comment",                             check:(s,x)=>(x.commentCount||0)>=1,    prog:(s,x)=>[(x.commentCount||0),1]    },
  { id:"cmc10", cat:"community", icon:"💬", name:"Conversationalist",desc:"Leave 10 comments",                                    check:(s,x)=>(x.commentCount||0)>=10,   prog:(s,x)=>[(x.commentCount||0),10]   },
  { id:"cmc50", cat:"community", icon:"💬", name:"Engaged",          desc:"Leave 50 comments",                                    check:(s,x)=>(x.commentCount||0)>=50,   prog:(s,x)=>[(x.commentCount||0),50]   },
  { id:"cmc100",cat:"community", icon:"💬", name:"Always Chatting",  desc:"Leave 100 comments",                                   check:(s,x)=>(x.commentCount||0)>=100,  prog:(s,x)=>[(x.commentCount||0),100]  },
  // Community — reactions given
  { id:"cmr1",  cat:"community", icon:"❤️", name:"Show Some Love",   desc:"Give your first reaction",                             check:(s,x)=>(x.reactionCount||0)>=1,   prog:(s,x)=>[(x.reactionCount||0),1]   },
  { id:"cmr25", cat:"community", icon:"❤️", name:"Supportive",       desc:"Give 25 reactions",                                    check:(s,x)=>(x.reactionCount||0)>=25,  prog:(s,x)=>[(x.reactionCount||0),25]  },
  { id:"cmr100",cat:"community", icon:"❤️", name:"Hype Squad",       desc:"Give 100 reactions",                                   check:(s,x)=>(x.reactionCount||0)>=100, prog:(s,x)=>[(x.reactionCount||0),100] },
  // Community — receiving engagement / profile
  { id:"cmcs",  cat:"community", icon:"🗣️", name:"Conversation Starter", desc:"Have one of your posts attract 5 or more comments",  check:(s,x)=>(x.maxPostComments||0)>=5, prog:(s,x)=>[(x.maxPostComments||0),5] },
  { id:"cmav",  cat:"community", icon:"📸", name:"Say Cheese",        desc:"Add a profile photo",                                  check:(s,x)=>!!x.hasAvatar },
  // Live streams — attended live
  { id:"lv1",   cat:"live",      icon:"📺", name:"Tuned In Live",    desc:"Join your first live stream",                          check:(s,x)=>(x.liveAttended||0)>=1,    prog:(s,x)=>[(x.liveAttended||0),1]    },
  { id:"lv5",   cat:"live",      icon:"📺", name:"Front Row",        desc:"Join 5 live streams",                                  check:(s,x)=>(x.liveAttended||0)>=5,    prog:(s,x)=>[(x.liveAttended||0),5]    },
  { id:"lv10",  cat:"live",      icon:"📺", name:"Devoted Viewer",   desc:"Join 10 live streams",                                 check:(s,x)=>(x.liveAttended||0)>=10,   prog:(s,x)=>[(x.liveAttended||0),10]   },

  // ── Roadmap stage trophies (badge = the level's statue) ──────────────────────
  // check counts logged + prior-hours; prog shows total minutes vs the threshold.
  { id:"rm1", cat:"roadmap", img:"/statue-l1.webp", name:"First Steps",  desc:"Begin your roadmap journey",       check:(s,x)=>_achRoadmapMins(s,x)>=0,      prog:(s,x)=>[Math.round(_achRoadmapMins(s,x)),0]      },
  { id:"rm2", cat:"roadmap", img:"/statue-l2.webp", name:"Beginner",     desc:"Reach the Beginner stage (50h)",   check:(s,x)=>_achRoadmapMins(s,x)>=3000,   prog:(s,x)=>[Math.round(_achRoadmapMins(s,x)),3000]   },
  { id:"rm3", cat:"roadmap", img:"/statue-l3.webp", name:"Foundations",  desc:"Reach the Foundations stage (150h)",check:(s,x)=>_achRoadmapMins(s,x)>=9000,   prog:(s,x)=>[Math.round(_achRoadmapMins(s,x)),9000]   },
  { id:"rm4", cat:"roadmap", img:"/statue-l4.webp", name:"Intermediate", desc:"Reach the Intermediate stage (350h)",check:(s,x)=>_achRoadmapMins(s,x)>=21000,  prog:(s,x)=>[Math.round(_achRoadmapMins(s,x)),21000]  },
  { id:"rm5", cat:"roadmap", img:"/statue-l5.webp", name:"Confident",    desc:"Reach the Confident stage (700h)", check:(s,x)=>_achRoadmapMins(s,x)>=42000,  prog:(s,x)=>[Math.round(_achRoadmapMins(s,x)),42000]  },
  { id:"rm6", cat:"roadmap", img:"/statue-l6.webp", name:"Advanced",     desc:"Reach the Advanced stage (1,200h)",check:(s,x)=>_achRoadmapMins(s,x)>=72000,  prog:(s,x)=>[Math.round(_achRoadmapMins(s,x)),72000]  },
  { id:"rm7", cat:"roadmap", img:"/statue-l7.webp", name:"Performer",    desc:"Reach the Performer stage (2,000h)",check:(s,x)=>_achRoadmapMins(s,x)>=120000, prog:(s,x)=>[Math.round(_achRoadmapMins(s,x)),120000] },
  { id:"rm8", cat:"roadmap", img:"/statue-l8.webp", name:"Artist",       desc:"Reach the Artist stage (3,500h)",  check:(s,x)=>_achRoadmapMins(s,x)>=210000, prog:(s,x)=>[Math.round(_achRoadmapMins(s,x)),210000] },
];

// Extra achievement data (reading list, collection, passage games)
let _achExtras = {
  savedCount:0, readCount:0,
  colTotal:0, colCompleted:0, colLearning:0, colAspire:0,
  gamesTotal:0, gamesCleared:0, gamesPerfect:0, maxGameLevel:0, uniquePassages:0,
  nrGamesPlayed:0, nrBestScore:0, nrBestTreble:0, nrBestBass:0, nrBestMixed:0, nrBestAcc:0, nrBestKey:0, nrKeysPlayed:0,
  crGamesPlayed:0, crBestScore:0, crBestTreble:0, crBestBass:0, crBestKey:0,
  earGamesPlayed:0, earBestScore:0, earBestExact:0, earBestKey:0, earBestExt:0,
  postCount:0, commentCount:0, reactionCount:0, liveAttended:0,
  maxPostComments:0, hasAvatar:false, baselineMins:0,
};

async function loadAchievementExtras() {
  const email = (typeof viewingEmail !== "undefined" && viewingEmail) || myEmail;
  const isOwn = email === myEmail;

  const [readResult, gamesResult, colResult, nrResult, crResult, earResult] = await Promise.all([
    isOwn
      ? db.from("reading_list").select("status").eq("email", email)
      : db.rpc("get_user_reading_list", { p_email: email }),
    isOwn
      ? db.from("passage_games").select("outcome, level, incorrect_count, passage_label").eq("email", email)
      : db.rpc("get_user_passage_games", { p_email: email }),
    isOwn
      ? db.from("user_collections").select("piece_id, status").eq("email", email)
      : db.rpc("get_user_collection", { p_email: email }),
    db.from("note_game_scores").select("score,clef,accidentals,key_signature").eq("email", email),
    // Chord game scores are stored with a lowercased email and are world-readable.
    db.from("chord_game_scores").select("score,clef,mode").eq("email", (email || "").toLowerCase()),
    db.from("ear_game_scores").select("score,answer_type,chord_set,key_signature").eq("email", (email || "").toLowerCase())
  ]);

  const readRows  = readResult.data  || [];
  const gameRows  = gamesResult.data || [];
  const colRows   = colResult.data   || [];
  const nrRows    = nrResult.data    || [];
  const crRows    = crResult.data    || [];
  const earRows   = earResult.data   || [];

  _achExtras.savedCount     = readRows.length;
  _achExtras.readCount      = readRows.filter(r => r.status === "read").length;

  _achExtras.gamesTotal     = gameRows.length;
  _achExtras.gamesCleared   = gameRows.filter(g => g.outcome === "cleared").length;
  _achExtras.gamesPerfect   = gameRows.filter(g => g.outcome === "cleared" && (g.incorrect_count || 0) === 0).length;
  _achExtras.maxGameLevel   = gameRows.reduce((m, g) => Math.max(m, g.level || 0), 0);
  _achExtras.uniquePassages = new Set(gameRows.map(g => g.passage_label).filter(Boolean)).size;

  _achExtras.colTotal       = colRows.length;
  _achExtras.colCompleted   = colRows.filter(r => r.status === "completed").length;
  _achExtras.colLearning    = colRows.filter(r => r.status === "learning").length;
  _achExtras.colAspire      = colRows.filter(r => r.status === "aspire").length;

  _achExtras.nrGamesPlayed  = nrRows.length;
  _achExtras.nrBestScore    = nrRows.reduce((m, r) => Math.max(m, r.score || 0), 0);
  _achExtras.nrBestTreble   = nrRows.filter(r => r.clef === "treble" && !r.accidentals).reduce((m, r) => Math.max(m, r.score || 0), 0);
  _achExtras.nrBestBass     = nrRows.filter(r => r.clef === "bass"  && !r.accidentals).reduce((m, r) => Math.max(m, r.score || 0), 0);
  _achExtras.nrBestMixed    = nrRows.filter(r => r.clef === "mixed").reduce((m, r) => Math.max(m, r.score || 0), 0);
  _achExtras.nrBestAcc      = nrRows.filter(r => r.accidentals).reduce((m, r) => Math.max(m, r.score || 0), 0);
  // Key-signature mode (note game's new key selector): best score in key mode + how many distinct keys played
  _achExtras.nrBestKey      = nrRows.filter(r => r.key_signature).reduce((m, r) => Math.max(m, r.score || 0), 0);
  _achExtras.nrKeysPlayed   = new Set(nrRows.filter(r => r.key_signature).map(r => r.key_signature)).size;

  // Chord recognition game
  _achExtras.crGamesPlayed  = crRows.length;
  _achExtras.crBestScore    = crRows.reduce((m, r) => Math.max(m, r.score || 0), 0);
  _achExtras.crBestTreble   = crRows.filter(r => r.clef === "treble").reduce((m, r) => Math.max(m, r.score || 0), 0);
  _achExtras.crBestBass     = crRows.filter(r => r.clef === "bass").reduce((m, r) => Math.max(m, r.score || 0), 0);
  _achExtras.crBestKey      = crRows.filter(r => r.mode === "key").reduce((m, r) => Math.max(m, r.score || 0), 0);

  // Chord ear-training game
  _achExtras.earGamesPlayed = earRows.length;
  _achExtras.earBestScore   = earRows.reduce((m, r) => Math.max(m, r.score || 0), 0);
  _achExtras.earBestExact   = earRows.filter(r => r.answer_type === "exact").reduce((m, r) => Math.max(m, r.score || 0), 0);
  _achExtras.earBestKey     = earRows.filter(r => r.key_signature).reduce((m, r) => Math.max(m, r.score || 0), 0);
  _achExtras.earBestExt     = earRows.filter(r => r.chord_set === "extensions").reduce((m, r) => Math.max(m, r.score || 0), 0);

  // Community engagement + live attendance. These span several tables, so we
  // sum cheap head-only count queries. Each is wrapped so a missing table or a
  // tighter RLS policy degrades to 0 rather than breaking the whole page.
  // Email casing is inconsistent across legacy rows, so match case-insensitively.
  const _cnt = async (table, col, val) => {
    try {
      const { count } = await db.from(table)
        .select("*", { count: "exact", head: true }).ilike(col, val);
      return count || 0;
    } catch { return 0; }
  };
  const _eventIds = async (table) => {
    try {
      const { data } = await db.from(table).select("event_id").ilike("email", email);
      return (data || []).map(r => r.event_id);
    } catch { return []; }
  };
  const [postCount, commentCounts, reactionCounts, chatEvents, qaEvents, attendEvents] = await Promise.all([
    _cnt("community_posts", "email", email),
    Promise.all([
      _cnt("community_post_comments",       "email", email),
      _cnt("activity_comments",             "email", email),
      _cnt("content_feed_comments",         "email", email),
      _cnt("practice_room_update_comments", "email", email),
    ]),
    Promise.all([
      _cnt("community_post_likes",          "email", email),
      _cnt("activity_reactions",            "email", email),
      _cnt("content_feed_likes",            "email", email),
      _cnt("practice_room_update_likes",    "email", email),
      _cnt("community_chat_reactions",      "email", email),
    ]),
    _eventIds("event_chat"),
    _eventIds("event_qa"),
    _eventIds("event_attendance"),
  ]);
  _achExtras.postCount     = postCount;
  _achExtras.commentCount  = commentCounts.reduce((a, b) => a + b, 0);
  _achExtras.reactionCount = reactionCounts.reduce((a, b) => a + b, 0);
  // "Attended live" = joined (recorded in event_attendance) OR participated
  // (chat / Q&A) in a distinct live event. The attendance rows are the reliable
  // signal; chat/Q&A are kept so historical participation still counts.
  _achExtras.liveAttended  = new Set([...attendEvents, ...chatEvents, ...qaEvents].filter(Boolean)).size;

  // Manually-added "practice from before" baseline, in minutes — added to logged
  // minutes so roadmap trophies reflect total playing experience (matching the map).
  try {
    const { data: bl } = await db.from("practice_baseline")
      .select("total_minutes").ilike("email", email).maybeSingle();
    _achExtras.baselineMins = Number(bl?.total_minutes) || 0;
  } catch { _achExtras.baselineMins = 0; }

  // Profile photo set? (Say Cheese)
  try {
    const { data: ae } = await db.from("allowed_emails")
      .select("avatar_url").ilike("email", email).maybeSingle();
    _achExtras.hasAvatar = !!(ae && ae.avatar_url);
  } catch { _achExtras.hasAvatar = false; }

  // Most comments on any single one of the user's own posts (Conversation Starter)
  try {
    const { data: myPosts } = await db.from("community_posts")
      .select("id").ilike("email", email);
    const postIds = (myPosts || []).map(p => p.id);
    if (postIds.length) {
      const { data: cmts } = await db.from("community_post_comments")
        .select("post_id").in("post_id", postIds);
      const tally = {};
      (cmts || []).forEach(c => { tally[c.post_id] = (tally[c.post_id] || 0) + 1; });
      _achExtras.maxPostComments = Object.values(tally).reduce((m, v) => Math.max(m, v), 0);
    } else {
      _achExtras.maxPostComments = 0;
    }
  } catch { _achExtras.maxPostComments = 0; }

  // Streak saves USED = the number of missed days actually bridged by spending a
  // token = saved_dates.length. The rebuilt derive (20260629_streak_recompute)
  // only appends to saved_dates when balance>0 bridges a genuinely missed day, so
  // its length is the true used-count, and get_user_streak_saves returns exactly
  // that (jsonb_array_length(saved_dates)).
  //
  // DO NOT use `total_earned - balance`: balance is capped at 15 (MAX_SAVES) while
  // total_earned grows unbounded, so any member past a ~75-day streak who NEVER
  // missed a day shows earned-balance > 0 and gets Safety Net/Resilient/Never Give
  // Up falsely. That capping bug is why this kept regressing. saved_dates.length
  // is the only correct source. See [[streak-saves-architecture]].
  if (isOwn) {
    _achExtras.streakSaves = Array.isArray(streakData?.saved_dates) ? streakData.saved_dates.length : 0;
  } else {
    try {
      const { data: savesCount } = await db.rpc("get_user_streak_saves", { p_email: email });
      _achExtras.streakSaves = savesCount || 0;
    } catch(e) { _achExtras.streakSaves = 0; }
  }

  // Course / lesson completion (for Courses achievements). Counts completed lessons
  // and, for the level badge, how many of the published Music Theory L1 lessons are done.
  try {
    const { data: lp } = await db.from("lesson_progress").select("lesson_id").eq("email", email).eq("completed", true);
    const doneIds = new Set((lp || []).map(r => r.lesson_id));
    _achExtras.lessonsCompleted = doneIds.size;
    const { data: t1 } = await db.from("lessons").select("id").eq("course", "theory").eq("level", 1).eq("status", "published");
    const t1ids = (t1 || []).map(r => r.id);
    _achExtras.theoryL1Total = t1ids.length;
    _achExtras.theoryL1Done  = t1ids.filter(id => doneIds.has(id)).length;
    const { data: t2 } = await db.from("lessons").select("id").eq("course", "theory").eq("level", 2).eq("status", "published");
    const t2ids = (t2 || []).map(r => r.id);
    _achExtras.theoryL2Total   = t2ids.length;
    _achExtras.theoryL2Done    = t2ids.filter(id => doneIds.has(id)).length;
    _achExtras.theoryL2Planned = 12; // full planned Level 2 lesson count — bump if it changes
  } catch(e) { _achExtras.lessonsCompleted = 0; _achExtras.theoryL1Total = 0; _achExtras.theoryL1Done = 0; _achExtras.theoryL2Total = 0; _achExtras.theoryL2Done = 0; _achExtras.theoryL2Planned = 12; }
}

function computeAchievements(sessions, dbEarned = new Set()) {
  return ACHIEVEMENTS.map(a => {
    const earned = a.check(sessions, _achExtras) || dbEarned.has(a.id);
    const prog   = (!earned && a.prog) ? a.prog(sessions, _achExtras) : null;
    return { ...a, earned, prog };
  });
}

// Check for newly earned achievements and toast them
async function checkNewAchievements() {
  // Only run for the logged-in user — when viewing another user's profile,
  // allSessions/_achExtras contain their data and would trigger false toasts.
  if (typeof viewingEmail !== "undefined" && viewingEmail && viewingEmail !== myEmail) return;
  const storageKey = `ach_earned_${myEmail}`;
  const known      = new Set(JSON.parse(localStorage.getItem(storageKey) || "[]"));
  const results    = computeAchievements(allSessions);
  const nowEarned  = results.filter(a => a.earned).map(a => a.id);
  let   newOnes    = nowEarned.filter(id => !known.has(id));

  // Save local state immediately so subsequent calls this session are fast
  localStorage.setItem(storageKey, JSON.stringify(nowEarned));

  // Cross-check any "new" ones against the DB — prevents re-toasting after
  // localStorage is cleared or the user logs in on a different device/browser
  if (newOnes.length > 0) {
    const { data: dbRows } = await db.from("achievement_events")
      .select("achievement_id").eq("email", myEmail);
    const dbKnown = new Set((dbRows || []).map(r => r.achievement_id));
    newOnes = newOnes.filter(id => !dbKnown.has(id));
  }

  // ── Roadmap "starting line" ────────────────────────────────────────────────
  // A roadmap trophy whose threshold is already covered by the user's manually
  // entered prior-hours baseline is shown as earned (via its check) but never
  // recorded or broadcast — it's their declared starting point, not an in-app
  // achievement. Only trophies reached by climbing ABOVE the baseline level get
  // recorded + posted to the feed. Result: editing your prior-hours number can
  // never push a trophy into the activity feed. This is deterministic from
  // baselineMins, so it's consistent across devices.
  const _baseMins = (_achExtras && _achExtras.baselineMins) || 0;
  newOnes = newOnes.filter(id => {
    const t = ACH_ROADMAP_MINS[id];
    return (t === undefined) ? true : (_baseMins < t);
  });

  // ── Silent introduction of the achievements expansion ──────────────────────
  // These IDs were added in a batch. Existing members who already qualify would
  // otherwise get a burst of toasts + bell + push notifications and flood the
  // shared activity feed the moment this ships. So the FIRST time we detect any
  // of them for a member, we grant them silently: the badge already shows as
  // earned on the grid via its check() function, so we simply skip recording an
  // achievement_events row (keeps them out of the feed) and skip all
  // notifications. localStorage already marks them "known" (above), so they
  // never re-trigger. Any of these earned AFTER this one-time intro notify
  // normally like every other badge.
  const SILENT_INTRO_IDS = new Set([
    "crg1","crg10","crg50","crs10","crs20","crs30","crtreb","crbass","crkey",
    "cmp1","cmp10","cmp25","cmp50","cmc1","cmc10","cmc50","cmc100",
    "cmr1","cmr25","cmr100","cmcs","cmav",
    "lv1","lv5","lv10","nrtreb","nrkey","nrkey3",
    "tmo25","pweek","wkwarr","renais",
    "rm1","rm2","rm3","rm4","rm5","rm6","rm7","rm8",
  ]);
  const _introKey = "ach_silentintro_v1_" + myEmail;
  if (!localStorage.getItem(_introKey)) {
    newOnes = newOnes.filter(id => !SILENT_INTRO_IDS.has(id));
    localStorage.setItem(_introKey, "1");
  }

  // Only write achievements that are genuinely newly earned (not already in DB).
  // This prevents re-inserting manually revoked achievements on next login.
  if (newOnes.length > 0) {
    const { error: achErr } = await db.rpc("record_achievements", {
      p_email: myEmail,
      achievement_ids: newOnes
    });
    if (achErr) console.warn("record_achievements failed:", achErr.message);
  }

  // One-time backfill: seed notifications for all earned achievements when none exist yet.
  // Inserted as read:true — these are historical, not genuinely new alerts.
  const _backfillKey = "ach_notif_backfill_" + myEmail;
  if (!localStorage.getItem(_backfillKey) && nowEarned.length > 0) {
    console.log("Notification backfill: seeding", nowEarned.length, "achievements as read…");
    for (const id of nowEarned) {
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (!ach) continue;
      const sourceId = "ach_" + id;
      const row = {
        email: myEmail, type: "achievement",
        title: `Achievement unlocked: ${ach.name}`,
        body: ach.desc || null, link_url: "/practice-log.html?goto=achievements",
        source_id: sourceId,
        metadata: { achievement_id: id, badge_svg: achBadgeSVG(ach, true, 40), badge_col: ACH_COLOURS[ach.cat] || ACH_COLOURS.time },
        read: true
      };
      await db.from("notifications").insert(row).select("id,created_at").single();
    }
    localStorage.setItem(_backfillKey, "1");
    console.log("Notification backfill done");
    await window._shLoadNotifs?.();
  }

  if (newOnes.length > 0) {
    _feedLoaded = false; // invalidate feed cache
    newOnes.forEach((id, i) => {
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) {
        setTimeout(() => showAchToast(ach), i * 2200);
        // Persist notification (deduped by achievement id)
        insertNotification(
          "achievement",
          `Achievement unlocked: ${ach.name}`,
          ach.desc,
          "/practice-log.html?goto=achievements",
          "ach_" + id,
          { achievement_id: id, badge_svg: achBadgeSVG(ach, true, 40), badge_col: ACH_COLOURS[ach.cat] || ACH_COLOURS.time }
        );
      }
    });
  }
}

let _achToastTimer = null;
function showAchToast(ach) {
  const toast = document.getElementById("ach-toast");
  if (!toast) return;
  document.getElementById("ach-toast-icon").innerHTML = achBadgeIcon(ach.id);
  document.getElementById("ach-toast-name").textContent = ach.name;
  document.getElementById("ach-toast-desc").textContent = ach.desc;
  toast.classList.add("visible");
  clearTimeout(_achToastTimer);
  _achToastTimer = setTimeout(() => toast.classList.remove("visible"), 4000);
}

// Insert a notification for the current user (duplicate inserts are blocked by DB unique constraint)
async function insertNotification(type, title, body, linkUrl, sourceId, metadata) {
  if (!myEmail) return;

  // Build row without optional columns first, add them if the table supports them
  const baseRow = { email: myEmail, type, title, body: body || null, link_url: linkUrl || null };
  const fullRow = { ...baseRow, source_id: sourceId || null, metadata: metadata || {} };

  // Try full insert first; if it fails (schema mismatch) try base row
  let data, error;
  ({ data, error } = await db.from("notifications").insert(fullRow).select("id,created_at").single());
  if (error) {
    // Retry without optional columns that may not exist in older table schemas
    ({ data, error } = await db.from("notifications").insert(baseRow).select("id,created_at").single());
  }
  if (error) {
    if (error.code !== "23505" && !error.message?.includes("unique")) {
      console.error("insertNotification ERROR:", error.code, error.message, error.details);
    }
    return;
  }
  // Refresh shared-header notification badge
  await window._shLoadNotifs?.();
}


/* ──────────────────────────────────────────────────────────────────────────────
 * Universal achievement check — call window.tcCheckAchievements() from ANY page
 * after an action that could earn an achievement (mark a piece complete, post a
 * comment, attend a live event, set an avatar, etc.). It loads the full data set
 * the engine needs (sessions + streak + extras) so detection is accurate and
 * never clobbers the "earned" set, then notifies any newly-earned achievements.
 *
 * Debounced: at most once per 15s (loadAchievementExtras runs ~15 queries), so
 * rapid actions (e.g. several reactions) don't hammer the database.
 * Pass { force: true } to bypass the debounce.
 * ────────────────────────────────────────────────────────────────────────────── */
let _tcAchCheckTs = 0;
async function tcCheckAchievements(opts) {
  try {
    if (typeof db === "undefined" || !db) return;
    if (typeof myEmail === "undefined" || !myEmail) return;
    const force = opts && opts.force;
    const now = Date.now();
    if (!force && now - _tcAchCheckTs < 15000) return;
    _tcAchCheckTs = now;
    const s = await db.rpc("get_my_sessions", { p_email: myEmail });
    if (!s.error) allSessions = s.data || [];
    const st = await db.from("streak_tokens").select("*").eq("email", myEmail).maybeSingle();
    if (!st.error) streakData = st.data;
    await loadAchievementExtras();
    await checkNewAchievements();
  } catch (e) { console.warn("tcCheckAchievements failed:", e); }
}
window.tcCheckAchievements = tcCheckAchievements;
