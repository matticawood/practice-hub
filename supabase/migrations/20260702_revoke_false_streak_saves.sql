-- Revoke streak-save achievements (sv1/sv3/sv5) that were falsely granted.
--
-- Root cause (fixed in shared-achievements.js this same change): the member's OWN
-- dashboard computed "saves used" as total_earned - balance. balance is capped at
-- 15 (MAX_SAVES) while total_earned grows without bound, so anyone past a ~75-day
-- streak who NEVER missed a day had earned-balance > 0 and was granted Safety Net /
-- Resilient / Never Give Up. The earlier 20260629 reconcile removed them once, but
-- the buggy client kept re-recording them on the member's next login.
--
-- Now that the client reads the genuine used-count (jsonb_array_length(saved_dates),
-- which the derive only appends to on a real spend), run the reconcile once more.
-- This time it sticks, because the fixed client no longer re-grants. Idempotent and
-- safe to re-run: it only deletes rows the member no longer qualifies for.
DO $reconcile$
DECLARE rec record;
BEGIN
  FOR rec IN SELECT * FROM (VALUES ('sv1',1),('sv3',3),('sv5',5)) AS v(aid, thresh) LOOP
    DELETE FROM achievement_events ae
    USING (
      SELECT ae2.email FROM achievement_events ae2
      LEFT JOIN streak_tokens st ON st.email = ae2.email
      WHERE ae2.achievement_id = rec.aid
        AND COALESCE(jsonb_array_length(st.saved_dates), 0) < rec.thresh
    ) gone
    WHERE ae.achievement_id = rec.aid AND ae.email = gone.email;

    DELETE FROM notifications
    WHERE source_id = 'ach_' || rec.aid
      AND email NOT IN (SELECT email FROM achievement_events WHERE achievement_id = rec.aid);
  END LOOP;
END $reconcile$;
