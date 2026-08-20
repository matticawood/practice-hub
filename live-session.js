/* live-session.js — the running practice session, shared by every member page.

   A live session SURVIVES navigation but does not KEEP COUNTING through it.

   Losing a timed session because someone tapped through to the community page
   is unacceptable, so the session lives in localStorage and is still there when
   they come back. But the clock stops the moment they leave the practice log,
   because everywhere else in the app already logs its own time: course lessons,
   articles and practice tools each write their own practice entry through
   shared-practice-autolog.js. A clock that kept running across those pages
   would count the same practice twice.

   That makes double counting impossible by construction rather than by
   arithmetic — the pages that auto-log are exactly the pages where this clock
   is stopped — and it leaves the timer doing the job only it can do: measuring
   time at the piano, which the app cannot see.

   Three rules make it work:

   1. Elapsed time is DERIVED from timestamps, never counted by an interval. A
      sleeping tab, a locked phone propped on the music stand, a browser closed
      and reopened — all come back with the right number, because nothing was
      relying on a timer having kept ticking. This is what lets the clock run
      through a dark screen at the piano while still stopping dead on navigation.
   2. Leaving is detected on ARRIVAL, not on exit. Unload events are unreliable
      on iOS, so instead this script pauses the session when it loads on any
      page that is not the practice log. The second or two of lag is noise.
   3. An automatic pause is marked as such, so returning to the log resumes it
      while a pause the member chose themselves is left alone.
*/
(function () {
  "use strict";

  var KEY      = "rm_live_session";
  var VERSION  = 2;
  var SB_KEY   = "sb-gyskfutmncprqxazgatv-auth-token";

  // A single unbroken activity beyond this is almost certainly a clock someone
  // forgot about rather than practice. It is never silently trimmed — the log
  // page asks on return. See RMLive.isOverrun.
  var OVERRUN_MS = 3 * 60 * 60 * 1000;

  /* ---------- storage ---------------------------------------------------- */

  function read() {
    var raw;
    try { raw = localStorage.getItem(KEY); } catch (e) { return null; }
    if (!raw) return null;
    var s;
    try { s = JSON.parse(raw); } catch (e) { clear(); return null; }
    // An older or half-written shape is not worth guessing at.
    if (!s || s.v !== VERSION || !s.on) { clear(); return null; }
    return s;
  }

  function write(s) {
    if (!s || !s.on) { clear(); return; }
    s.v = VERSION;
    s.stamp = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  function clear() { try { localStorage.removeItem(KEY); } catch (e) {} }

  /* ---------- time ------------------------------------------------------- */

  // Time on the CURRENT activity. Paused time is excluded, and while paused the
  // clock is read at the moment it was paused rather than now.
  function itemMs(s, now) {
    if (!s || s.itemStart == null) return 0;
    var end = s.pausedAt || (now || Date.now());
    return Math.max(0, end - s.itemStart - (s.pausedMs || 0));
  }

  // Whole session: everything already banked into finished activities, plus the
  // one in progress.
  function sessionMs(s, now) {
    if (!s) return 0;
    return (s.bankedMs || 0) + itemMs(s, now);
  }

  function isRunning(s) { return !!(s && s.itemStart != null && !s.pausedAt); }
  function isPaused(s)  { return !!(s && s.itemStart != null && s.pausedAt); }
  function isOverrun(s, now) { return itemMs(s, now) > OVERRUN_MS; }

  function fmt(ms) {
    var t = Math.floor(ms / 1000);
    var h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
    var mm = h ? (m < 10 ? "0" + m : "" + m) : "" + m;
    return (h ? h + ":" : "") + mm + ":" + (sec < 10 ? "0" + sec : "" + sec);
  }

  /* ---------- pause / resume, usable from any page ----------------------- */

  function pause(s, auto) {
    s = s || read();
    if (!s || s.itemStart == null || s.pausedAt) return s;
    s.pausedAt = Date.now();
    // A pause the member chose is theirs to undo; only an automatic one is
    // allowed to undo itself when they come back.
    s.autoPaused = !!auto;
    write(s);
    return s;
  }

  function resume(s) {
    s = s || read();
    if (!s || !s.pausedAt) return s;
    s.pausedMs = (s.pausedMs || 0) + (Date.now() - s.pausedAt);
    s.pausedAt = null;
    s.autoPaused = false;
    write(s);
    return s;
  }

  // Leaving the practice log stops the clock, because every other page logs its
  // own time. Only touches a session that was actually running.
  function autoPause(s) {
    s = s || read();
    if (!isRunning(s)) return s;
    return pause(s, true);
  }

  // Coming back resumes it — but only if leaving is what stopped it.
  function autoResume(s) {
    s = s || read();
    if (!s || !s.pausedAt || !s.autoPaused) return s;
    return resume(s);
  }

  // Netlify serves these without the .html, so both spellings are the log page.
  function isLogPage() {
    var p = (location.pathname || "").replace(/\/+$/, "").toLowerCase();
    return p === "/practice-log" || p === "/practice-log.html";
  }

  function togglePause(s) {
    s = s || read();
    if (!s) return s;
    return s.pausedAt ? resume(s) : pause(s);
  }

  /* ---------- who is logged in ------------------------------------------ */

  // Read synchronously from the Supabase token so the chip can paint on first
  // frame instead of waiting on auth. A miss returns null and is treated as
  // "cannot tell", never as "wrong member".
  function currentEmail() {
    try {
      var raw = localStorage.getItem(SB_KEY);
      if (!raw) return null;
      var t = JSON.parse(raw);
      var e = (t && t.user && t.user.email) || (t && t[0] && t[0].user && t[0].user.email);
      return e ? String(e).toLowerCase() : null;
    } catch (e) { return null; }
  }

  // Belongs to somebody else on a shared device.
  function isForeign(s) {
    var me = currentEmail();
    return !!(s && s.email && me && s.email !== me);
  }

  window.RMLive = {
    KEY: KEY, VERSION: VERSION, OVERRUN_MS: OVERRUN_MS,
    read: read, write: write, clear: clear,
    itemMs: itemMs, sessionMs: sessionMs,
    isRunning: isRunning, isPaused: isPaused, isOverrun: isOverrun,
    pause: pause, resume: resume, togglePause: togglePause,
    autoPause: autoPause, autoResume: autoResume, isLogPage: isLogPage,
    fmt: fmt, currentEmail: currentEmail, isForeign: isForeign
  };
})();

/* ---------- what happens on every page --------------------------------------
   On the practice log: resume a session that navigation paused, and stay out of
   the way — that page owns the session and draws its own chip (#live-fab).

   Everywhere else: stop the clock and show what is waiting, with a way back.
   The chip deliberately reads as PAUSED rather than running, because on these
   pages the app is doing its own logging and the timer genuinely is not
   counting.
*/
(function () {
  "use strict";

  var L = window.RMLive;
  var chip = null;

  function styles() {
    if (document.getElementById("rm-live-css")) return;
    var css = document.createElement("style");
    css.id = "rm-live-css";
    css.textContent = [
      "#rm-live-chip{position:fixed;bottom:28px;right:28px;z-index:110;display:none;",
        "align-items:center;gap:10px;background:#1a1a1a;color:#fff;border:1px solid #3a3320;",
        "border-radius:50px;box-shadow:0 4px 20px rgba(0,0,0,.3);font-family:inherit;",
        "font-size:.88rem;font-weight:700;padding:12px 19px;cursor:pointer;line-height:1.15}",
      "#rm-live-chip:hover{opacity:.92}",
      "#rm-live-dot{width:8px;height:8px;border-radius:50%;background:#7a736a;flex:0 0 auto}",
      "#rm-live-t{font-variant-numeric:tabular-nums}",
      "#rm-live-lbl{color:#a49a8c;font-weight:600;font-size:.78rem}",
      "body.rm-immersive #rm-live-chip{display:none !important}",
      // Matches #log-fab's own position at every breakpoint, so the chip lands
      // where members already look for the practice button.
      "@media (max-width:768px),(orientation:portrait) and (max-width:1024px){",
        "#rm-live-chip{bottom:calc(76px + env(safe-area-inset-bottom,0px))}}",
      "@media (max-width:640px){#rm-live-chip{right:16px}}"
    ].join("");
    document.head.appendChild(css);
  }

  function paint() {
    var s = L.read();
    // Nothing running, or it belongs to someone else on a shared device.
    if (!s || L.isForeign(s)) { if (chip) chip.style.display = "none"; return; }
    if (!chip) {
      styles();
      chip = document.createElement("div");
      chip.id = "rm-live-chip";
      chip.setAttribute("role", "button");
      chip.setAttribute("tabindex", "0");
      chip.title = "Back to your practice session";
      chip.innerHTML = '<span id="rm-live-dot"></span><span id="rm-live-t"></span>' +
                       '<span id="rm-live-lbl">paused</span>';
      var go = function () { location.href = "/practice-log.html?live=1"; };
      chip.addEventListener("click", go);
      chip.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
      });
      document.body.appendChild(chip);
    }
    chip.style.display = "flex";
    chip.querySelector("#rm-live-t").textContent = L.fmt(L.sessionMs(s));
  }

  function start() {
    // The log page takes it from here — but never lift the pause on a session
    // belonging to someone else who used this device.
    if (L.isLogPage()) { if (!L.isForeign(L.read())) L.autoResume(); return; }
    L.autoPause();                                    // arriving here means they left
    paint();
    // Another tab ending or changing the session must show up here too.
    window.addEventListener("storage", function (e) {
      if (!e || e.key === L.KEY || e.key === null) paint();
    });
    // Returning to a backgrounded tab: it may have been ended elsewhere, and the
    // clock must not have crept on while this tab was hidden.
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) { L.autoPause(); paint(); }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else { start(); }
})();
