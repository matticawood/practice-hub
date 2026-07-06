/* shared-practice-autolog.js
 * The single place that turns in-app activity (course lessons, practice-tool
 * games, articles) into a practice_session + practice_item, deduplicated by
 * (email, source, origin_ref) so the same real thing can only ever be logged
 * once. Mirrors the server-side unique index from 20260706_practice_entry_source.
 *
 * Attached as a global (window.PracticeAutolog) so courses.html / practice-log.html
 * can call it without a module system, the same way shared-streak.js works.
 *
 * Roadmap note: the roadmap totals from practice_items.duration_minutes mapped by
 * item_type (piece/book->repertoire, technique->technique, sightreading->sight_reading,
 * theory/eartraining/improvisation->musicianship). So the caller picks item_type to
 * put the minutes on the right track; an untracked type (e.g. 'other') lands in the
 * roadmap TOTAL only (that's how quick-log stays unattributed).
 */
(function (w) {
  function localDateStr(d) {
    d = d || new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  // Log an in-app activity exactly once.
  // opts: { email, source, originRef, minutes, itemType, label?, notes?, date? }
  // Returns { logged, minutes, existed?, error? } — logged=false if it already
  // existed or minutes<=0 (so the caller never double-counts or logs nothing).
  async function logAppActivity(db, o) {
    const minutes = Math.round(Number(o.minutes) || 0);
    if (minutes <= 0 || !o || !o.email || !o.source || !o.originRef) {
      return { logged: false, minutes: 0 };
    }
    // Dedup: has this exact activity already been logged?
    const { data: existing } = await db.from("practice_sessions")
      .select("id")
      .eq("email", o.email).eq("source", o.source).eq("origin_ref", o.originRef)
      .limit(1);
    if (existing && existing.length) return { logged: false, minutes, existed: true, sessionId: existing[0].id };

    const { data: sess, error } = await db.from("practice_sessions").insert({
      email: o.email,
      session_date: o.date || localDateStr(),
      duration_minutes: minutes,
      timing_mode: "per_item",
      notes: o.notes || null,
      source: o.source,
      origin_ref: o.originRef,
    }).select("id").single();
    // Unique index may reject a race (already inserted a heartbeat ago) — that's a
    // successful dedup, not a real error.
    if (error) return { logged: false, minutes, error };

    await db.from("practice_items").insert({
      session_id: sess.id,
      item_type: o.itemType,
      duration_minutes: minutes,
      label: o.label || null,
      sort_order: 0,
    });
    return { logged: true, minutes, sessionId: sess.id };
  }

  // Accumulate minutes onto a rolling per-day entry (used by practice-tool games:
  // each play adds a minute to one row per tool per day, keyed by an origin_ref
  // like "game:note:2026-07-06"). Creates the row on the first play of the day,
  // then increments the session + its single item on every play after.
  // opts: { email, source, originRef, addMinutes, itemType, label?, notes?, date? }
  // Returns { logged, minutes, created?, sessionId?, error? }.
  async function accumulateAppActivity(db, o) {
    const add = Math.round(Number(o.addMinutes) || 0);
    if (add <= 0 || !o || !o.email || !o.source || !o.originRef) {
      return { logged: false, minutes: 0 };
    }
    // Existing rolling row for this tool + day?
    const { data: existing } = await db.from("practice_sessions")
      .select("id,duration_minutes")
      .eq("email", o.email).eq("source", o.source).eq("origin_ref", o.originRef)
      .limit(1);
    if (existing && existing.length) {
      return _bump(db, o, existing[0], add);
    }
    // First play of the day: create the row.
    const { data: sess, error } = await db.from("practice_sessions").insert({
      email: o.email,
      session_date: o.date || localDateStr(),
      duration_minutes: add,
      timing_mode: "per_item",
      notes: o.notes || null,
      source: o.source,
      origin_ref: o.originRef,
    }).select("id").single();
    if (error) {
      // Lost a race with a concurrent first play — the unique index rejected us,
      // so re-read the row that won and bump it instead of dropping the minute.
      const { data: again } = await db.from("practice_sessions")
        .select("id,duration_minutes")
        .eq("email", o.email).eq("source", o.source).eq("origin_ref", o.originRef)
        .limit(1);
      if (again && again.length) return _bump(db, o, again[0], add);
      return { logged: false, minutes: 0, error };
    }
    await db.from("practice_items").insert({
      session_id: sess.id, item_type: o.itemType,
      duration_minutes: add, label: o.label || null, sort_order: 0,
    });
    return { logged: true, minutes: add, created: true, sessionId: sess.id };
  }

  // Increment an existing rolling session + its item by `add` minutes.
  async function _bump(db, o, sess, add) {
    const newMins = (sess.duration_minutes || 0) + add;
    await db.from("practice_sessions").update({ duration_minutes: newMins }).eq("id", sess.id);
    const { data: items } = await db.from("practice_items")
      .select("id,duration_minutes").eq("session_id", sess.id).order("id").limit(1);
    if (items && items.length) {
      await db.from("practice_items")
        .update({ duration_minutes: (items[0].duration_minutes || 0) + add })
        .eq("id", items[0].id);
    } else {
      await db.from("practice_items").insert({
        session_id: sess.id, item_type: o.itemType,
        duration_minutes: add, label: o.label || null, sort_order: 0,
      });
    }
    return { logged: true, minutes: newMins, created: false, sessionId: sess.id };
  }

  // Remove a previously auto-logged activity (e.g. un-marking a lesson). Deletes
  // its item(s) then the session. No-op if nothing matches.
  async function removeAppActivity(db, o) {
    if (!o || !o.email || !o.source || !o.originRef) return { removed: 0 };
    const { data: rows } = await db.from("practice_sessions")
      .select("id")
      .eq("email", o.email).eq("source", o.source).eq("origin_ref", o.originRef);
    let n = 0;
    for (const r of (rows || [])) {
      await db.from("practice_items").delete().eq("session_id", r.id);
      await db.from("practice_sessions").delete().eq("id", r.id);
      n++;
    }
    return { removed: n };
  }

  w.PracticeAutolog = { logAppActivity, accumulateAppActivity, removeAppActivity, localDateStr };
})(window);
