-- ================================================================
-- Replace streak leaderboard with best (all-time) streak
-- Generated 2026-05-24
--
-- Previously the streak leaderboard showed current_streak — meaning
-- members dropped off or fell in rank when they broke their streak.
--
-- The new version computes each member's longest consecutive streak
-- they have EVER achieved (gaps-and-islands on practice_sessions),
-- so members keep their best streak permanently and only improve when
-- they surpass their own record.
-- ================================================================

DROP FUNCTION IF EXISTS get_streak_leaderboard();

CREATE OR REPLACE FUNCTION get_streak_leaderboard()
RETURNS TABLE(
  email       text,
  name        text,
  best_streak bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH
  -- One row per (email, date) — deduplicate multi-session days
  practice_dates AS (
    SELECT DISTINCT
      ps.email,
      ps.session_date::date AS d
    FROM practice_sessions ps
    WHERE ps.session_date IS NOT NULL
      AND ps.email IS NOT NULL
  ),
  -- Assign each date to a group using gaps-and-islands:
  -- (date - row_number) is constant for a consecutive run of days.
  -- PostgreSQL: date - integer = date, so this works directly.
  grps AS (
    SELECT
      email,
      d,
      d - ROW_NUMBER() OVER (PARTITION BY email ORDER BY d)::integer AS grp
    FROM practice_dates
  ),
  -- Count the length of each consecutive run
  streak_lengths AS (
    SELECT
      email,
      grp,
      COUNT(*) AS len
    FROM grps
    GROUP BY email, grp
  ),
  -- Pick the longest run per member
  best AS (
    SELECT
      email,
      MAX(len) AS best_streak
    FROM streak_lengths
    GROUP BY email
  )
  SELECT
    ae.email,
    ae.name,
    COALESCE(b.best_streak, 0)::bigint AS best_streak
  FROM allowed_emails ae
  LEFT JOIN best b ON ae.email = b.email
  WHERE ae.email IS NOT NULL
    AND COALESCE(b.best_streak, 0) > 0
  ORDER BY best_streak DESC;
$$;
