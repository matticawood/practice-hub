-- Allow the reactivation scheduled function (service role, no user JWT) to read
-- the dormant cohort, in addition to the owner. Same body as before, guard widened.

CREATE OR REPLACE FUNCTION dormant_members(days integer DEFAULT 14)
RETURNS TABLE(member_email text, last_active_date date, silent_days integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (lower(coalesce(auth.jwt() ->> 'email', '')) = 'matthew@matthewcawood.com'
          OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'not authorised';
  END IF;

  RETURN QUERY
  WITH acts AS (
    SELECT lower(u.email) AS em, max(u.d) AS last_active
    FROM (
      SELECT email, session_date::date AS d FROM practice_sessions
      UNION ALL SELECT email, day::date          FROM feature_usage
      UNION ALL SELECT email, created_at::date   FROM community_posts
      UNION ALL SELECT email, created_at::date   FROM community_post_comments
      UNION ALL SELECT email, created_at::date   FROM community_post_likes
      UNION ALL SELECT email, created_at::date   FROM activity_comments
      UNION ALL SELECT email, created_at::date   FROM content_feed_comments
      UNION ALL SELECT email, created_at::date   FROM passage_games
      UNION ALL SELECT email, created_at::date   FROM note_game_scores
      UNION ALL SELECT email, created_at::date   FROM chord_game_scores
      UNION ALL SELECT email, joined_at::date    FROM event_attendance
    ) u
    WHERE u.email IS NOT NULL
    GROUP BY lower(u.email)
  )
  SELECT lower(ae.email) AS member_email,
         a.last_active   AS last_active_date,
         (CASE WHEN a.last_active IS NULL THEN 9999
               ELSE (current_date - a.last_active) END)::int AS silent_days
  FROM allowed_emails ae
  LEFT JOIN acts a ON a.em = lower(ae.email)
  WHERE lower(ae.email) NOT IN (
          'matthew@matthewcawood.com','mcawoodcanada@gmail.com',
          'reviewer@matthewcawood.com','enquiries@matthewcawood.com',
          'system@thepracticeroom.app')
    AND (a.last_active IS NULL OR (current_date - a.last_active) > days)
  ORDER BY a.last_active NULLS FIRST;
END $$;

REVOKE ALL ON FUNCTION dormant_members(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION dormant_members(integer) TO authenticated;
