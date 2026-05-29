-- ──────────────────────────────────────────────────────────────────────────────
-- Scheduled notifications via pg_cron
--
-- Three nudges, all idempotent (won't double-send the same notification):
--   1. Goal due tomorrow            — type 'goal_reminder',  source_id 'goal_due_<id>'
--   2. Goal overdue                 — type 'goal_reminder',  source_id 'goal_overdue_<id>'
--   3. Event starting in ~1 hour    — type 'event_reminder', source_id 'event_remind_<eventid>_<email>'
--
-- Send function runs every 15 minutes via pg_cron.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION send_scheduled_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Goals due tomorrow
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
  WHERE g.target_date = (CURRENT_DATE + 1)
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.email = g.email
        AND n.source_id = 'goal_due_' || g.id::text
    );

  -- 2. Goals just gone overdue (target_date < today, but only fire once)
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
  WHERE g.target_date < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.email = g.email
        AND n.source_id = 'goal_overdue_' || g.id::text
    );

  -- 3. Live events starting in 45–75 minutes — notify everyone who's RSVP'd.
  -- 30-min window so the 15-min cron is guaranteed to catch each event once.
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

-- Schedule every 15 minutes. (Drop any existing schedule by the same name first.)
SELECT cron.unschedule('send_scheduled_notifications')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send_scheduled_notifications');

SELECT cron.schedule(
  'send_scheduled_notifications',
  '*/15 * * * *',
  $$ SELECT send_scheduled_notifications(); $$
);

NOTIFY pgrst, 'reload schema';
