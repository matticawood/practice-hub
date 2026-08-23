/* shared-clinic-qa.js — the questions featured during a live clinic, with the
 * moment in the replay where each one was taken.
 *
 * A clinic is streamed live and questions are put on screen as they are
 * answered. `event_qa_features` records one row per window a question was
 * featured for, and `live_events.stream_started_at` is the moment the recording
 * began, so the two together give an offset into the replay. That is what makes
 * a replay skippable: you can jump straight to the question you care about.
 *
 * The clinic page has its own copy of this, grown into that page's globals and
 * its player. This is the version anything else uses, and the one the clinic
 * page should eventually be moved onto so there is a single implementation.
 *
 * Usage:
 *   const qa = await ClinicQA.load(db, eventId);   // null when there is nothing
 *   el.innerHTML = ClinicQA.html(qa);
 *   ClinicQA.wire(el, secs => player.currentTime = secs);
 */
window.ClinicQA = (function () {
  "use strict";

  const esc = s => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  function offset(secs) {
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${m}:${String(s).padStart(2, "0")}`;
  }

  async function load(db, eventId) {
    if (!db || !eventId) return null;
    try {
      const [ev, fw] = await Promise.all([
        db.from("live_events").select("stream_started_at").eq("id", eventId).maybeSingle(),
        db.from("event_qa_features")
          .select("id,qa_id,featured_at,event_qa(id,question,name,email)")
          .eq("event_id", eventId).order("featured_at", { ascending: true }),
      ]);
      // Without a recording start there is no t=0, and an offset computed
      // without one is raw epoch seconds, which would seek years past the end.
      const startedAt = ev.data && ev.data.stream_started_at;
      if (!startedAt) return null;
      const start = new Date(startedAt).getTime();

      const seen = new Set();
      const questions = [];
      (fw.data || []).forEach(w => {
        if (!w.event_qa) return;
        // Featured before the stream began means featured backstage, which is
        // not a moment that exists in the replay.
        const at = new Date(w.featured_at).getTime();
        if (at < start) return;
        const secs = Math.max(0, Math.round((at - start) / 1000));
        const prev = seen.has(w.qa_id) ? questions.find(q => q.id === w.qa_id) : null;
        if (prev) { prev.times.push(secs); return; }   // asked again later in the session
        seen.add(w.qa_id);
        questions.push({
          id: w.qa_id, question: w.event_qa.question,
          asker: w.event_qa.name || (w.event_qa.email || "").split("@")[0] || "Anonymous",
          times: [secs],
        });
      });
      return questions.length ? questions : null;
    } catch (e) {
      return null;                                     // never block the player
    }
  }

  function html(questions) {
    if (!questions || !questions.length) return "";
    return '<div class="cqa">'
      + '<div class="cqa-title">Questions answered in this session</div>'
      + questions.map(q =>
          '<div class="cqa-row">'
          + '<div class="cqa-times">'
          + q.times.map(t => '<button type="button" class="cqa-ts" data-secs="' + t
              + '" title="Jump to this moment">' + offset(t) + "</button>").join("")
          + "</div>"
          + '<div class="cqa-body"><div class="cqa-q">' + esc(q.question) + "</div>"
          + '<div class="cqa-asker">' + esc(q.asker) + "</div></div>"
          + "</div>").join("")
      + "</div>";
  }

  /* One listener on the container rather than one per button, so re-rendering
     the list cannot leave handlers behind. */
  function wire(root, seek) {
    if (!root || typeof seek !== "function") return;
    root.addEventListener("click", e => {
      const b = e.target.closest(".cqa-ts");
      if (!b || !root.contains(b)) return;
      e.preventDefault();
      const secs = Number(b.dataset.secs);
      if (Number.isFinite(secs)) seek(secs);
    });
  }

  return { load, html, wire, offset };
})();
