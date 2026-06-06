-- ──────────────────────────────────────────────────────────────────────────────
-- Goal reminders at a sensible LOCAL time (fixes "notified at weird times").
--
-- Before: send_scheduled_notifications computed dates in UTC and fired the
-- instant the UTC date rolled over (00:00 UTC = ~01:00 BST), so UK members got
-- "due tomorrow"/"overdue" pushes in the middle of the night.
--
-- After: each goal reminder is computed in the member's OWN timezone (captured
-- per device in device_tokens.timezone, falling back to Europe/London) and only
-- fires in the 08:00–08:14 local window. The function still runs every 15 min
-- via pg_cron, so exactly one tick per day lands in that window → one morning
-- reminder, on the correct local date. Event reminders are unchanged.
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Store the device timezone (the app upserts this at token registration).
ALTER TABLE device_tokens ADD COLUMN IF NOT EXISTS timezone text;

-- 2. Timezone-aware rewrite.
CREATE OR REPLACE FUNCTION send_scheduled_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Goals due tomorrow — delivered ~08:00 in the member's local timezone.
  INSERT INTO notifications (email, type, title, body, link_url, source_id, read)
  SELECT
    g.email,
    'goal_reminder',
    'Goal due tomorrow',
    COALESCE(g.piece_label, 'A goal you set') || ' is due tomorrow',
    '/practice-log.html?goto=goals',
    'goal_due_' || g.id::text,
    false
  FROM piece_goals g
  CROSS JOIN LATERAL (
    -- Member's most recently seen device timezone, validated against the tz
    -- database; anything missing/invalid falls back to Europe/London.
    SELECT COALESCE(
      (SELECT dt.timezone FROM device_tokens dt
        WHERE dt.email = g.email
          AND dt.timezone IS NOT NULL
          AND EXISTS (SELECT 1 FROM pg_timezone_names z WHERE z.name = dt.timezone)
        ORDER BY dt.last_seen_at DESC
        LIMIT 1),
      'Europe/London') AS tz
  ) m
  WHERE g.target_date = ((now() AT TIME ZONE m.tz)::date + 1)
    AND extract(hour   FROM (now() AT TIME ZONE m.tz)) = 8
    AND extract(minute FROM (now() AT TIME ZONE m.tz)) < 15
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.email = g.email
        AND n.source_id = 'goal_due_' || g.id::text
    );

  -- 2. Goals just gone overdue — fire once, ~08:00 local the morning after.
  INSERT INTO notifications (email, type, title, body, link_url, source_id, read)
  SELECT
    g.email,
    'goal_reminder',
    'Goal overdue',
    COALESCE(g.piece_label, 'A goal you set') || ' is now overdue',
    '/practice-log.html?goto=goals',
    'goal_overdue_' || g.id::text,
    false
  FROM piece_goals g
  CROSS JOIN LATERAL (
    SELECT COALESCE(
      (SELECT dt.timezone FROM device_tokens dt
        WHERE dt.email = g.email
          AND dt.timezone IS NOT NULL
          AND EXISTS (SELECT 1 FROM pg_timezone_names z WHERE z.name = dt.timezone)
        ORDER BY dt.last_seen_at DESC
        LIMIT 1),
      'Europe/London') AS tz
  ) m
  WHERE g.target_date < (now() AT TIME ZONE m.tz)::date
    AND extract(hour   FROM (now() AT TIME ZONE m.tz)) = 8
    AND extract(minute FROM (now() AT TIME ZONE m.tz)) < 15
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.email = g.email
        AND n.source_id = 'goal_overdue_' || g.id::text
    );

  -- 3. Live events starting in 45–75 minutes — notify everyone who's RSVP'd.
  -- Unchanged: runs every cron tick (needs 15-min granularity).
  INSERT INTO notifications (email, type, title, body, link_url, source_id, read)
  SELECT
    r.email,
    'event_reminder',
    COALESCE(e.title, 'A live event') || ' starts in 1 hour',
    'Tap to head to the event page',
    '/events.html?event=' || e.id::text,
    'event_remind_' || e.id::text || '_' || r.email,
    false
  FROM live_events e
  JOIN event_rsvps r ON r.event_id = e.id
  WHERE e.scheduled_at BETWEEN (now() + interval '45 minutes')
                           AND (now() + interval '75 minutes')
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.email = r.email
        AND n.source_id = 'event_remind_' || e.id::text || '_' || r.email
    );
END;
$$;

NOTIFY pgrst, 'reload schema';
