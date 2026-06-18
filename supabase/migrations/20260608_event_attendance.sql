-- Live-stream ATTENDANCE — one row per viewer who joins a live event.
--
-- Why: the "Tuned In Live" achievements (lv1/lv5/lv10) were derived from whether
-- a user posted in event_chat or event_qa, so silent viewers never earned them.
-- This table records the actual join, written client-side from the viewer's
-- "joined-meeting" handler in events.html. liveAttended now counts distinct
-- events from here (unioned with chat/Q&A for historical participation).
--
-- One row per (event_id, email): rejoining the same stream is a no-op (upsert
-- with ignoreDuplicates). Test events are excluded by the client before writing.

CREATE TABLE IF NOT EXISTS event_attendance (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid        NOT NULL REFERENCES live_events(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  name        text,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, email)
);

CREATE INDEX IF NOT EXISTS event_attendance_email_idx ON event_attendance (email);
CREATE INDEX IF NOT EXISTS event_attendance_event_idx ON event_attendance (event_id);

ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can read (the People tab / achievement counts read broadly,
-- matching event_chat / event_rsvps).
CREATE POLICY "event_attendance_read"   ON event_attendance
  FOR SELECT TO authenticated USING (true);

-- A user may only record their OWN attendance (email must match their JWT).
CREATE POLICY "event_attendance_insert" ON event_attendance
  FOR INSERT TO authenticated WITH CHECK (email = auth.jwt() ->> 'email');
