/* live-session.js — the running practice session, shared by every member page.

   A live session SURVIVES navigation, and keeps COUNTING through it only if the
   member has asked for that by pressing play on the chip.

   Losing a timed session because someone tapped through to the community page
   is unacceptable, so the session lives in localStorage and is still there when
   they come back. But the clock only runs while the live session WINDOW is
   open. Closing that window is the same act whether they minimise it and stay
   on the practice log or navigate away entirely — either way they have gone to
   do something else.

   That matters because everywhere else in the app already logs its own time:
   course lessons, articles and practice tools each write their own practice
   entry through shared-practice-autolog.js. A clock that kept running across
   those pages would count the same practice twice. Stopping it makes double
   counting impossible by construction rather than by arithmetic, and leaves
   the timer doing the job only it can do: measuring time at the piano, which
   the app cannot see.

   The practice log owns the session while it is loaded and decides when the
   clock runs, so this module does nothing on that page beyond lending it the
   storage and the maths. Elsewhere it stops the clock and shows the way back.

   Three rules make it work:

   1. Elapsed time is DERIVED from timestamps, never counted by an interval. A
      sleeping tab, a locked phone propped on the music stand, a browser closed
      and reopened — all come back with the right number, because nothing was
      relying on a timer having kept ticking. This is what lets the clock run
      through a dark screen at the piano while still stopping dead on navigation.
   2. Leaving the app's other pages is detected on ARRIVAL, not on exit. Unload
      events are unreliable on iOS, so instead this script pauses the session
      when it loads on any page that is not the practice log. The second or two
      of lag is noise. (Within the practice log, closing the window is the
      signal and needs no such trick.) A session the member set counting from
      the chip is exempt: see rule 4.
   3. An automatic pause is marked as such, so returning to the log resumes it
      while a pause the member chose themselves is left alone.
   4. Pressing play on the chip marks the session `chipRun`, and a chipRun clock
      is never paused by arriving somewhere. Any pause clears the mark, so the
      permission lasts exactly as long as the member's own decision does.
      NOTE: the other pages log their own time (lessons, articles and tools each
      write their own entry), so a clock deliberately left counting across them
      can count the same minutes twice. That is the member's call to make, which
      is why it takes a deliberate press.
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
    /* A `storage` event only reaches OTHER tabs, so this is how the chip on this
       page learns that a game (or anything else) has just changed the session. */
    try { window.dispatchEvent(new CustomEvent("rmlive:changed")); } catch (e) {}
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
    // Whatever permission to run across pages they gave by pressing play, they
    // have just taken back.
    s.chipRun = false;
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
  //
  // Unless the member pressed play on the chip. That is them saying "count this
  // wherever I am", and a clock that stopped at the next page would make the
  // button pointless. So a chip-started clock crosses pages, and only a pause -
  // theirs, or closing the session window - ends the permission.
  function autoPause(s) {
    s = s || read();
    if (!isRunning(s)) return s;
    if (s.chipRun) return s;
    return pause(s, true);
  }

  /* SOMETHING ELSE IS COUNTING THIS TIME. A game round logs its own minute, and
     a lesson or article credits its own estimate, so the session clock stands
     down for exactly as long as that lasts. Nothing is deducted afterwards
     because the two are never counting at the same time — the same reason the
     clock stopped on navigation in the first place, now applied to the activity
     rather than to the whole app.

     A hold is not a pause. The member did not ask for it, so it undoes itself
     the moment the activity is over, and only for a clock they had set running. */
  // `key` is what release() matches on; `note` is the sentence the member reads.
  function hold(key, note) {
    var s = read();
    if (!s || s.itemStart == null) return s;
    /* Only a RUNNING clock can be held. Saying "session paused" to somebody
       whose session was already paused would claim we took something from them
       that they had not started. */
    if (s.pausedAt) return s;
    s.pausedAt = Date.now(); s.autoPaused = true;
    s.heldBy = key || "activity";
    s.heldNote = note || "";
    write(s);
    return s;
  }

  // `reason` guards against releasing somebody else's hold: a game ending must
  // not start a clock that a lesson page is holding.
  function release(reason) {
    var s = read();
    if (!s || !s.heldBy) return s;
    if (reason && s.heldBy !== reason) return s;
    s.heldBy = null;
    s.heldNote = "";
    // Only give back a clock that was actually taken away mid-count.
    if (s.pausedAt && s.chipRun) {
      s.pausedMs = (s.pausedMs || 0) + (Date.now() - s.pausedAt);
      s.pausedAt = null;
      s.autoPaused = false;
    }
    write(s);
    return s;
  }

  /* Kept as the hook for a page that logs the member's time without being asked.
     Holds now come from the pages themselves, which know what the member is
     actually doing. */
  function selfLoggingPage() {
    /* Nothing is held by the PAGE any more. The two things that log without
       being asked are a lesson video running to the end (courses.html holds the
       clock while a lesson is open) and a tool round (tools.html holds it for
       the sixty seconds). The article reader only logs when the member presses
       Finish, which is a decision rather than something that happens to them,
       so the clock keeps running there. */
    return null;
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
    hold: hold, release: release, selfLoggingPage: selfLoggingPage,
    autoPause: autoPause, autoResume: autoResume, isLogPage: isLogPage,
    fmt: fmt, currentEmail: currentEmail, isForeign: isForeign
  };
})();

/* ---------- what happens on every page --------------------------------------
   On the practice log: resume a session that navigation paused, and stay out of
   the way — that page owns the session and draws its own chip (#live-fab).

   Everywhere else: stop the clock and show what is waiting, with a way back -
   and a way to start it again. It pauses on arrival so a session cannot be
   forgotten in another tab, but a member who has come to the Passage Fixer or
   the metronome on purpose can press play on the chip and have the time
   counted where they are.
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
      "#rm-live-go{width:26px;height:26px;flex:0 0 auto;border:0;border-radius:50%;cursor:pointer;",
        "display:grid;place-items:center;background:rgba(255,255,255,.1);color:#e8e2d7;padding:0}",
      "#rm-live-go:hover{background:rgba(255,255,255,.18)}",
      // Held means something else is counting, so there is nothing to press.
      "#rm-live-go[disabled]{opacity:.4;cursor:default;background:rgba(255,255,255,.06)}",
      // display lives on the icons themselves; a shared `#rm-live-go svg` rule
      // would outrank them and leave both showing at once.
      "#rm-live-go svg{width:13px;height:13px}",
      "#rm-live-ic-play{display:block}",
      "#rm-live-ic-pause{display:none}",
      "#rm-live-chip.running #rm-live-go{background:#e5484d;color:#fff}",
      "#rm-live-chip.running #rm-live-ic-play{display:none}",
      "#rm-live-chip.running #rm-live-ic-pause{display:block}",
      "#rm-live-t{font-variant-numeric:tabular-nums}",
      /* While something else is logging there is nothing to press, so this
         REPLACES the chip: it explains rather than offering a control, and it
         cannot be clicked, which is what keeps it clear of a game in play. */
      "#rm-live-note{position:fixed;bottom:28px;right:28px;z-index:110;display:none;",
        "max-width:250px;background:#1a1a1a;color:#e8e2d7;border:1px solid #3a3320;",
        "border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.3);font-family:inherit;",
        "padding:11px 15px;pointer-events:none;line-height:1.35}",
      "#rm-live-note b{display:block;font-size:.82rem;font-weight:800;margin-bottom:2px}",
      "#rm-live-note span{display:block;font-size:.78rem;font-weight:600;color:#a49a8c}",
      "body.rm-immersive #rm-live-note{display:none !important}",
      "@media (max-width:768px),(orientation:portrait) and (max-width:1024px){",
        "#rm-live-note{bottom:calc(76px + env(safe-area-inset-bottom,0px))}}",
      "@media (max-width:640px){#rm-live-note{right:16px;max-width:210px}}",
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

  /* A running clock has to be seen to run, or the member cannot tell whether
     the tools are counting. One second is plenty: the value is derived from
     timestamps, so this only redraws it. */
  var ticker = null;
  function tick() {
    if (ticker) { clearInterval(ticker); ticker = null; }
    var s = L.read();
    if (!s || !L.isRunning(s)) return;
    ticker = setInterval(function () {
      var cur = L.read();
      if (!cur || !L.isRunning(cur)) { clearInterval(ticker); ticker = null; paint(); return; }
      var t = chip && chip.querySelector("#rm-live-t");
      if (t) t.textContent = L.fmt(L.sessionMs(cur));
    }, 1000);
  }

  /* A line the chip says for a few seconds instead of its state, so a member who
     watched the clock stand down for a game is told why when it comes back. */
  var noteText = "", noteUntil = 0;
  // Anything on this page changing the session redraws the chip at once.
  window.addEventListener("rmlive:changed", function () { paint(); tick(); });
  window.addEventListener("rmlive:note", function (e) {
    var d = (e && e.detail) || {};
    noteText = d.text || "";
    noteUntil = Date.now() + (d.ms || 4500);
    paint();
    setTimeout(paint, (d.ms || 4500) + 60);
  });

  var note = null;
  function showNote(text) {
    if (!note) {
      styles();
      note = document.createElement("div");
      note.id = "rm-live-note";
      note.setAttribute("aria-live", "polite");
      document.body.appendChild(note);
    }
    note.innerHTML = "<b>Session paused</b><span></span>";
    note.querySelector("span").textContent = text || "This is being logged for you.";
    note.style.display = "block";
  }
  function hideNote() { if (note) note.style.display = "none"; }

  function paint() {
    var s = L.read();
    // Nothing running, or it belongs to someone else on a shared device.
    if (!s || L.isForeign(s)) { if (chip) chip.style.display = "none"; hideNote(); return; }
    /* Something else is logging this time. Say so where the chip would have
       been, and take the control away rather than leave one that cannot be
       used sitting on top of a round in play. */
    if (s.heldBy) {
      if (chip) chip.style.display = "none";
      showNote(s.heldNote);
      return;
    }
    hideNote();
    if (!chip) {
      styles();
      chip = document.createElement("div");
      chip.id = "rm-live-chip";
      chip.setAttribute("role", "button");
      chip.setAttribute("tabindex", "0");
      chip.title = "Back to your practice session";
      chip.innerHTML = '<button id="rm-live-go" type="button" aria-label="Start or pause the clock">' +
                         '<svg id="rm-live-ic-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
                         '<svg id="rm-live-ic-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>' +
                       '</button>' +
                       '<span id="rm-live-t"></span>' +
                       '<span id="rm-live-lbl">paused</span>';
      var go = function () { location.href = "/practice-log.html?live=1"; };
      chip.addEventListener("click", go);
      /* The clock can be run from here. Kept apart from the chip's own click,
         which is still the way back to the log. */
      chip.querySelector("#rm-live-go").addEventListener("click", function (e) {
        e.stopPropagation();
        var cur = L.read();
        if (!cur) return;
        if (L.isRunning(cur)) {
          L.pause(cur);
        } else {
          var r = L.resume(cur);
          // Started from here, so it is meant to keep counting from here on.
          if (r) { r.chipRun = true; L.write(r); }
        }
        paint(); tick();
      });
      chip.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
      });
      document.body.appendChild(chip);
    }
    chip.style.display = "flex";
    chip.querySelector("#rm-live-t").textContent = L.fmt(L.sessionMs(s));
    /* the chip says what is true, and offers the other state */
    var running = L.isRunning(s);
    chip.classList.toggle("running", running);
    var lbl = chip.querySelector("#rm-live-lbl");
    if (lbl) {
      lbl.textContent = (noteText && Date.now() < noteUntil) ? noteText
                      : running ? "running" : "paused";
    }
  }

  function start() {
    // The log page owns the session and decides for itself when the clock runs
    // — which is only while the session WINDOW is open, not merely while that
    // page is loaded. So nothing is resumed here beyond ending a hold the page
    // they came from had put on it, which runs before that page reads storage.
    if (L.isLogPage()) { L.release(); return; }
    /* LEAVING PAUSES A CLOCK NOBODY ASKED TO KEEP RUNNING, because a clock
       nobody can see is a clock somebody forgets. But once the member has
       pressed play on the chip, it keeps counting from page to page: they went
       to the Passage Fixer or the metronome ON PURPOSE and want the time. See
       RMLive.autoPause. Reported by a member who could not use the fixer
       without losing the session. */
    /* Somewhere that logs its own time holds the clock for as long as the member
       is there; anywhere else, a hold from the page they just left is over. */
    var holdReason = L.selfLoggingPage();
    if (holdReason) { L.hold(holdReason); }
    else { L.release(); L.autoPause(); }
    paint();
    tick();
    // Another tab ending or changing the session must show up here too.
    window.addEventListener("storage", function (e) {
      if (!e || e.key === L.KEY || e.key === null) paint();
    });
    // Returning to a backgrounded tab: it may have been ended elsewhere, and the
    // clock must not have crept on while this tab was hidden.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) return;
      /* A session running on THIS page is running because the member started
         it here, so coming back to the tab must not take that away. */
      var cur = L.read();
      if (!cur || !L.isRunning(cur)) L.autoPause();
      paint(); tick();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else { start(); }
})();
