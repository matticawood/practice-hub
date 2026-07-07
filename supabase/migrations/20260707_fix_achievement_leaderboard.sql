-- ================================================================
-- Fix get_achievement_leaderboard — count ALL earned achievements
-- Generated 2026-07-07
--
-- The badge leaderboard was undercounting: a member's card (which reads
-- achievement_events directly) showed e.g. 69 badges while the leaderboard
-- showed 37. Root cause: the old function embedded its own hardcoded list of
-- "countable" achievement ids, which had drifted stale — newer achievements
-- (games, ear training, roadmap stages, courses, reading) were never counted.
-- That is the same duplicate-catalogue drift we removed on the front end.
--
-- New version is drift-proof: it counts DISTINCT earned achievement_id straight
-- from achievement_events, so the leaderboard always matches the member card and
-- notifications. No hardcoded id list to maintain.
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql
-- ================================================================

-- Drop ANY existing overload (the old one may take arguments), so the recreate
-- below is the only definition — otherwise a stale signature keeps being called.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT oid::regprocedure AS sig FROM pg_proc WHERE proname = 'get_achievement_leaderboard' LOOP
    EXECUTE 'DROP FUNCTION ' || r.sig || ' CASCADE';
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION get_achievement_leaderboard()
RETURNS TABLE(
  email             text,
  name              text,
  achievement_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    evt.email,
    m.name,
    COUNT(DISTINCT evt.achievement_id) AS achievement_count
  -- INNER JOIN gates the leaderboard to CURRENT members only. Ex-members keep
  -- their old achievement_events rows but are no longer in allowed_emails, so
  -- they (and their nameless entries) drop off the board.
  FROM achievement_events evt
  JOIN allowed_emails m ON m.email = evt.email
  WHERE evt.email IS NOT NULL
  GROUP BY evt.email, m.name
  ORDER BY achievement_count DESC;
$$;

GRANT EXECUTE ON FUNCTION get_achievement_leaderboard() TO authenticated, anon;

NOTIFY pgrst, 'reload schema';
