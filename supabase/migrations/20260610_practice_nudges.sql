-- ──────────────────────────────────────────────────────────────────────────────
-- Practice nudges: time-sensitive insight notifications (bell + push).
--
-- A SEPARATE function from send_scheduled_notifications (which stays untouched).
-- Inserts into notifications, so the existing notifications→push trigger delivers
-- both the in-app bell item AND the push. Timezone-aware: only fires in the
-- 08:00–08:14 window in the member's own timezone (device_tokens.timezone,
-- falling back to Europe/London), exactly like the goal reminders.
--
-- Frequency is deliberately gentle: each nudge can fire AT MOST ONCE PER ISO WEEK
-- (the source_id carries an IYYY"W"IW bucket), and the neglected-goal nudge is
-- limited to ONE per member per week via DISTINCT ON. So a drifting member gets
-- at most ~3 nudges in a week, usually fewer.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION send_practice_nudges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Been away ~a week — gentle "come back" nudge (last session 7–13 days ago).
  --    Stops before the 14-day mark so it doesn't overlap the reactivation emails.
  INSERT INTO notifications (email, type, title, body, link_url, source_id, read)
  SELECT
    a.email,
    'practice_nudge',
    'Time for a little practice?',
    'It''s been about a week since your last session. Even ten focused minutes keeps the habit alive.',
    '/practice-log.html',
    'away_' || a.email || '_' || to_char(m.ld, 'IYYY"W"IW'),
    false
  FROM allowed_emails a
  CROSS JOIN LATERAL (
    SELECT t.tz,
           (now() AT TIME ZONE t.tz)::date          AS ld,
           extract(hour   FROM (now() AT TIME ZONE t.tz)) AS lh,
           extract(minute FROM (now() AT TIME ZONE t.tz)) AS lmin
    FROM (
      SELECT COALESCE(
        (SELECT dt.timezone FROM device_tokens dt
          WHERE dt.email = a.email AND dt.timezone IS NOT NULL
            AND EXISTS (SELECT 1 FROM pg_timezone_names z WHERE z.name = dt.timezone)
          ORDER BY dt.last_seen_at DESC LIMIT 1),
        'Europe/London') AS tz
    ) t
  ) m
  CROSS JOIN LATERAL (
    SELECT max(s.session_date) AS last_date
    FROM practice_sessions s WHERE s.email = a.email
  ) ls
  WHERE m.lh = 8 AND m.lmin < 15
    AND ls.last_date IS NOT NULL
    AND (m.ld - ls.last_date) BETWEEN 7 AND 13
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.email = a.email
        AND n.source_id = 'away_' || a.email || '_' || to_char(m.ld, 'IYYY"W"IW')
    );

  -- 2. Weekly time goal still well short, late in the week (Sat/Sun, < 70% of goal).
  INSERT INTO notifications (email, type, title, body, link_url, source_id, read)
  SELECT
    a.email,
    'practice_nudge',
    'Your weekly goal is within reach',
    'A session or two before the week is out gets you there.',
    '/practice-log.html?goto=goals',
    'weekgoal_' || a.email || '_' || to_char(m.ld, 'IYYY"W"IW'),
    false
  FROM allowed_emails a
  CROSS JOIN LATERAL (
    SELECT t.tz,
           (now() AT TIME ZONE t.tz)::date          AS ld,
           extract(hour   FROM (now() AT TIME ZONE t.tz)) AS lh,
           extract(minute FROM (now() AT TIME ZONE t.tz)) AS lmin
    FROM (
      SELECT COALESCE(
        (SELECT dt.timezone FROM device_tokens dt
          WHERE dt.email = a.email AND dt.timezone IS NOT NULL
            AND EXISTS (SELECT 1 FROM pg_timezone_names z WHERE z.name = dt.timezone)
          ORDER BY dt.last_seen_at DESC LIMIT 1),
        'Europe/London') AS tz
    ) t
  ) m
  CROSS JOIN LATERAL (
    SELECT COALESCE(sum(s.duration_minutes), 0) AS wk_mins
    FROM practice_sessions s
    WHERE s.email = a.email
      AND s.session_date >= date_trunc('week', m.ld)::date
  ) wk
  WHERE a.weekly_goal_minutes IS NOT NULL AND a.weekly_goal_minutes > 0
    AND m.lh = 8 AND m.lmin < 15
    AND extract(dow FROM m.ld) IN (0, 6)              -- Saturday or Sunday
    AND wk.wk_mins < a.weekly_goal_minutes * 0.7
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.email = a.email
        AND n.source_id = 'weekgoal_' || a.email || '_' || to_char(m.ld, 'IYYY"W"IW')
    );

  -- 3. A goal piece gone quiet — practised before, but not in the last 10 days,
  --    and not overdue (overdue is handled by send_scheduled_notifications).
  --    One per member per week (DISTINCT ON), choosing the nearest-deadline goal.
  INSERT INTO notifications (email, type, title, body, link_url, source_id, read)
  SELECT DISTINCT ON (g.email)
    g.email,
    'goal_nudge',
    'Pick ' || COALESCE(g.piece_label, 'your goal') || ' back up?',
    'It''s been a while since you practised it. Ten minutes today keeps it moving.',
    '/practice-log.html?goto=goals',
    'neglect_' || g.email || '_' || to_char(m.ld, 'IYYY"W"IW'),
    false
  FROM piece_goals g
  CROSS JOIN LATERAL (
    SELECT t.tz,
           (now() AT TIME ZONE t.tz)::date          AS ld,
           extract(hour   FROM (now() AT TIME ZONE t.tz)) AS lh,
           extract(minute FROM (now() AT TIME ZONE t.tz)) AS lmin
    FROM (
      SELECT COALESCE(
        (SELECT dt.timezone FROM device_tokens dt
          WHERE dt.email = g.email AND dt.timezone IS NOT NULL
            AND EXISTS (SELECT 1 FROM pg_timezone_names z WHERE z.name = dt.timezone)
          ORDER BY dt.last_seen_at DESC LIMIT 1),
        'Europe/London') AS tz
    ) t
  ) m
  WHERE g.piece_label IS NOT NULL
    AND m.lh = 8 AND m.lmin < 15
    AND (g.target_date IS NULL OR g.target_date >= m.ld)
    AND EXISTS (
      SELECT 1 FROM practice_items i
      JOIN practice_sessions s ON s.id = i.session_id
      WHERE s.email = g.email
        AND lower(trim(COALESCE(i.piece_label, i.label))) = lower(trim(g.piece_label))
    )
    AND NOT EXISTS (
      SELECT 1 FROM practice_items i
      JOIN practice_sessions s ON s.id = i.session_id
      WHERE s.email = g.email
        AND lower(trim(COALESCE(i.piece_label, i.label))) = lower(trim(g.piece_label))
        AND s.session_date >= m.ld - 10
    )
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.email = g.email
        AND n.source_id = 'neglect_' || g.email || '_' || to_char(m.ld, 'IYYY"W"IW')
    )
  ORDER BY g.email, g.target_date NULLS LAST;
END;
$$;

-- Schedule every 15 minutes (drop any existing schedule by the same name first).
SELECT cron.unschedule('send_practice_nudges')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send_practice_nudges');

SELECT cron.schedule(
  'send_practice_nudges',
  '*/15 * * * *',
  $$ SELECT send_practice_nudges(); $$
);

NOTIFY pgrst, 'reload schema';
