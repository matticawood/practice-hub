-- ──────────────────────────────────────────────────────────────────────────────
-- Streak saves keep landing on dates that have a real session. Same shape as
-- the 2026-05-12 connieuitsu / lucaskinzo fix. Two parts:
--
--   1. Sweep every streak_tokens row: if any saved_date matches an actual
--      practice_sessions.session_date for that user, drop the bogus saved_date
--      and restore one token to balance. Revoke any sv1/sv3/sv5 achievements
--      whose holder no longer has enough real saves_used (= total_earned -
--      balance after the cleanup) to satisfy the achievement check.
--
--   2. Add a trigger on practice_sessions so a session inserted (or updated to
--      a different date) automatically removes that date from saved_dates and
--      bumps balance. Prevents future races where the autoApplyStreakSaves
--      client function bridges a gap moments before the user logs the day.
-- ──────────────────────────────────────────────────────────────────────────────

-- ── 1. Sweep & repair ─────────────────────────────────────────────────────────
WITH bad AS (
  SELECT
    st.email,
    saved_date::date AS bad_date
  FROM streak_tokens st
  CROSS JOIN LATERAL jsonb_array_elements_text(st.saved_dates) AS saved_date
  WHERE EXISTS (
    SELECT 1 FROM practice_sessions ps
    WHERE ps.email = st.email
      AND ps.session_date = saved_date::date
  )
),
counted AS (
  SELECT email, COUNT(*)::int AS bad_count
  FROM bad
  GROUP BY email
)
UPDATE streak_tokens st
SET
  saved_dates = COALESCE((
    SELECT jsonb_agg(d ORDER BY d)
    FROM jsonb_array_elements_text(st.saved_dates) AS d
    WHERE NOT EXISTS (
      SELECT 1 FROM bad b
      WHERE b.email = st.email AND b.bad_date::text = d
    )
  ), '[]'::jsonb),
  balance     = st.balance + c.bad_count,
  updated_at  = now()
FROM counted c
WHERE st.email = c.email;

-- ── 2. Revoke any sv1/sv3/sv5 that no longer qualify ──────────────────────────
DELETE FROM achievement_events ae
USING streak_tokens st
WHERE ae.email = st.email
  AND ae.achievement_id IN ('sv1','sv3','sv5')
  AND (
    (ae.achievement_id = 'sv1' AND GREATEST(0, st.total_earned - st.balance) < 1) OR
    (ae.achievement_id = 'sv3' AND GREATEST(0, st.total_earned - st.balance) < 3) OR
    (ae.achievement_id = 'sv5' AND GREATEST(0, st.total_earned - st.balance) < 5)
  );

DELETE FROM notifications n
WHERE n.source_id IN ('ach_sv1','ach_sv3','ach_sv5')
  AND NOT EXISTS (
    SELECT 1 FROM achievement_events ae
    WHERE ae.email = n.email
      AND ae.achievement_id = REPLACE(n.source_id, 'ach_', '')
  );

-- ── 3. Trigger: a real session always clears a save on the same date ─────────
CREATE OR REPLACE FUNCTION clear_streak_save_on_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed_count int;
BEGIN
  -- Remove NEW.session_date from saved_dates and bump balance by however many
  -- rows we strip (defensive — should always be 0 or 1).
  WITH old AS (
    SELECT saved_dates FROM streak_tokens WHERE email = NEW.email FOR UPDATE
  ),
  filtered AS (
    SELECT COALESCE(jsonb_agg(d ORDER BY d), '[]'::jsonb) AS new_saved,
           SUM(CASE WHEN d = NEW.session_date::text THEN 1 ELSE 0 END)::int AS hits
    FROM old, jsonb_array_elements_text(old.saved_dates) AS d
  )
  UPDATE streak_tokens st
  SET saved_dates = (SELECT new_saved FROM filtered),
      balance     = st.balance + COALESCE((SELECT hits FROM filtered), 0),
      updated_at  = now()
  WHERE st.email = NEW.email
    AND COALESCE((SELECT hits FROM filtered), 0) > 0;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clear_streak_save_on_session ON practice_sessions;
CREATE TRIGGER trg_clear_streak_save_on_session
AFTER INSERT OR UPDATE OF session_date ON practice_sessions
FOR EACH ROW EXECUTE FUNCTION clear_streak_save_on_session();

NOTIFY pgrst, 'reload schema';
