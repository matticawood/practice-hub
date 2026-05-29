-- ──────────────────────────────────────────────────────────────────────────────
-- Streak save policy clarification
--
-- Rule: a streak save is non-refundable. Once consumed (saved_dates entry +
-- balance decrement + sv1/sv3/sv5 achievement), it stays consumed. If the
-- user later backdates a session onto a saved date, both records co-exist —
-- the save was used at the time, and the achievement remains valid.
--
-- The bug we're fixing is the *root cause*: the client used to call
-- autoApplyStreakSaves() on every page load, pre-emptively burning saves on
-- days the user might still log themselves. That created `saved_dates` rows
-- the user never "earned" the chance to spend (the gap they were bridging
-- wasn't real yet — they hadn't missed those days, they just hadn't logged
-- them yet). The corresponding sv1 achievements are bogus.
--
-- This migration only cleans up rows where we know the save was created
-- bogusly. It does NOT install a trigger that refunds saves when sessions
-- backdate onto saved dates — that's legitimate use.
-- ──────────────────────────────────────────────────────────────────────────────

-- Drop any trigger/function from earlier drafts of this migration so re-runs
-- are clean.
DROP TRIGGER  IF EXISTS trg_clear_streak_save_on_session ON practice_sessions;
DROP FUNCTION IF EXISTS clear_streak_save_on_session();

-- ── 1. Sweep current saved_dates that overlap real sessions ──────────────────
-- Treat these as bogus (created by the now-removed page-load auto-apply).
-- Restore the token to balance and trim the saved_dates entry. Going forward
-- backdating won't trigger a refund — but these specific rows were never
-- legitimately consumed, so restoring them is correct.
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

-- ── 2. Revoke sv1/sv3/sv5 that no longer qualify after the cleanup ───────────
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

NOTIFY pgrst, 'reload schema';
