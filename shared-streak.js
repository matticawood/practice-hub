// shared-streak.js — THE single source of truth for practice streaks + streak saves.
// One deterministic replay from raw practice dates. Mirrored exactly by the SQL
// function derive_streak_state(). Do NOT fork this logic anywhere else.
//
// Rules (replay day-by-day from first practice day to the member's LOCAL today):
//   - practiced day: streak++
//   - fully-elapsed missed day (date < local-today): spend a save if balance>0
//     (balance--, record saved date, streak++), else streak resets to 0
//   - today, not yet practiced: leave streak alone (never burn a save for today)
//   - on each counted day, every 5th day awards a token (total_earned++, balance++ capped at 15)
//   - best_streak = max streak seen (bridged days included, so the leaderboard counts saves)
// saves_used == saved_dates.length by construction (a save is only recorded on a real spend).
(function (root) {
  "use strict";
  var MAX_SAVES = 15;

  function toDateStr(d) {
    var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }
  // The member's local calendar date ("today") in an IANA timezone.
  function todayInTz(tz, now) {
    now = now || new Date();
    try {
      var parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
      var o = {}; for (var i = 0; i < parts.length; i++) o[parts[i].type] = parts[i].value;
      return o.year + "-" + o.month + "-" + o.day;
    } catch (e) { return toDateStr(now); }
  }
  // Add n days to a 'YYYY-MM-DD' string (noon anchor avoids DST edge cases).
  function addDays(ds, n) { var d = new Date(ds + "T12:00:00"); d.setDate(d.getDate() + n); return toDateStr(d); }

  // practiceDates: iterable of distinct 'YYYY-MM-DD' strings. tz: IANA name. now: optional Date.
  function deriveStreakState(practiceDates, tz, now) {
    var days = new Set(practiceDates);
    if (days.size === 0) return { current_streak: 0, best_streak: 0, balance: 0, total_earned: 0, saved_dates: [] };
    var today = todayInTz(tz, now);
    var sorted = Array.from(days).sort();
    var cur = sorted[0];
    var streak = 0, balance = 0, earned = 0, best = 0, saved = [];
    while (cur <= today) {
      var counted = false;
      if (days.has(cur)) {
        streak++; counted = true;
      } else if (cur < today) {            // a day that is fully over and was not practiced
        if (balance > 0) { balance--; saved.push(cur); streak++; counted = true; }
        else { streak = 0; }
      }                                    // cur === today and unlogged: do nothing, today is still open
      if (counted && streak % 5 === 0) { earned++; if (balance < MAX_SAVES) balance++; }
      if (streak > best) best = streak;
      cur = addDays(cur, 1);
    }
    return { current_streak: streak, best_streak: best, balance: balance, total_earned: earned, saved_dates: saved };
  }

  function captureTimezone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) { return "UTC"; } }

  var api = { deriveStreakState: deriveStreakState, todayInTz: todayInTz, toDateStr: toDateStr, addDays: addDays, captureTimezone: captureTimezone, MAX_SAVES: MAX_SAVES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.StreakCalc = api;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : null));
