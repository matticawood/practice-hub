-- Live Events, Chat, Q&A, RSVPs for in-house community streaming

-- ── Live events ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text        NOT NULL,
  description     text,
  cover_url       text,
  scheduled_at    timestamptz NOT NULL,
  duration_mins   integer     NOT NULL DEFAULT 60,
  status          text        NOT NULL DEFAULT 'scheduled', -- scheduled | live | ended
  daily_room_name text,
  daily_room_url  text,
  mux_asset_id    text,
  mux_playback_id text,
  created_by      text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Event comments (pre/post event discussion) ────────────────────────────────
CREATE TABLE IF NOT EXISTS event_comments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid        NOT NULL REFERENCES live_events(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  name        text,
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Q&A questions (submitted during stream) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS event_qa (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid        NOT NULL REFERENCES live_events(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  name        text,
  question    text        NOT NULL,
  is_featured boolean     NOT NULL DEFAULT false,
  answered    boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Live chat messages ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_chat (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid        NOT NULL REFERENCES live_events(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  name        text,
  message     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── RSVPs ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_rsvps (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid        NOT NULL REFERENCES live_events(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, email)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS live_events_status_idx      ON live_events (status, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS event_comments_event_idx    ON event_comments (event_id, created_at);
CREATE INDEX IF NOT EXISTS event_qa_event_idx          ON event_qa (event_id, created_at);
CREATE INDEX IF NOT EXISTS event_chat_event_idx        ON event_chat (event_id, created_at);
CREATE INDEX IF NOT EXISTS event_rsvps_event_idx       ON event_rsvps (event_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE live_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_qa        ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_chat      ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps     ENABLE ROW LEVEL SECURITY;

-- live_events: all authenticated can read; only admin can write
CREATE POLICY "live_events_read" ON live_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "live_events_admin_write" ON live_events
  FOR ALL TO authenticated
  USING   (EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.jwt() ->> 'email'));

-- event_comments
CREATE POLICY "event_comments_read"   ON event_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "event_comments_insert" ON event_comments FOR INSERT TO authenticated WITH CHECK (email = auth.jwt() ->> 'email');
CREATE POLICY "event_comments_delete" ON event_comments FOR DELETE TO authenticated USING (
  email = auth.jwt() ->> 'email' OR
  EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.jwt() ->> 'email')
);

-- event_qa
CREATE POLICY "event_qa_read"   ON event_qa FOR SELECT TO authenticated USING (true);
CREATE POLICY "event_qa_insert" ON event_qa FOR INSERT TO authenticated WITH CHECK (email = auth.jwt() ->> 'email');
CREATE POLICY "event_qa_update" ON event_qa FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.jwt() ->> 'email')
);

-- event_chat
CREATE POLICY "event_chat_read"   ON event_chat FOR SELECT TO authenticated USING (true);
CREATE POLICY "event_chat_insert" ON event_chat FOR INSERT TO authenticated WITH CHECK (email = auth.jwt() ->> 'email');

-- event_rsvps
CREATE POLICY "event_rsvps_read"   ON event_rsvps FOR SELECT TO authenticated USING (true);
CREATE POLICY "event_rsvps_insert" ON event_rsvps FOR INSERT TO authenticated WITH CHECK (email = auth.jwt() ->> 'email');
CREATE POLICY "event_rsvps_delete" ON event_rsvps FOR DELETE TO authenticated USING (email = auth.jwt() ->> 'email');
