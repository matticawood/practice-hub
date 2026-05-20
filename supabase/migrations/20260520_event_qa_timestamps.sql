-- Adds timestamp infrastructure for VOD Q&A playback sync.
--
-- 1. live_events.stream_started_at  — timestamp when RTMP streaming began;
--    used as t=0 to calculate when each featured question appeared in the VOD.
--
-- 2. event_qa.featured_at / unfeatured_at — legacy single-column fallback;
--    kept for backward compat with events that predate event_qa_features.
--
-- 3. event_qa_features — one row per "feature window" so the same question
--    can be featured multiple times and each occurrence gets its own timestamp.

-- ── live_events ───────────────────────────────────────────────────────────────
ALTER TABLE live_events
  ADD COLUMN IF NOT EXISTS stream_started_at  timestamptz,
  ADD COLUMN IF NOT EXISTS mux_live_stream_id text,
  ADD COLUMN IF NOT EXISTS mux_live_playback_id text;

-- ── event_qa ──────────────────────────────────────────────────────────────────
ALTER TABLE event_qa
  ADD COLUMN IF NOT EXISTS featured_at   timestamptz,
  ADD COLUMN IF NOT EXISTS unfeatured_at timestamptz;

-- ── event_qa_features ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_qa_features (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid        NOT NULL REFERENCES live_events(id) ON DELETE CASCADE,
  qa_id         uuid        NOT NULL REFERENCES event_qa(id)    ON DELETE CASCADE,
  featured_at   timestamptz NOT NULL DEFAULT now(),
  unfeatured_at timestamptz
);

CREATE INDEX IF NOT EXISTS event_qa_features_event_idx ON event_qa_features (event_id, featured_at);
CREATE INDEX IF NOT EXISTS event_qa_features_qa_idx    ON event_qa_features (qa_id);

-- RLS: authenticated members can read; only admin can write (via service key / admin session)
ALTER TABLE event_qa_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_qa_features_read" ON event_qa_features
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "event_qa_features_write" ON event_qa_features
  FOR ALL TO authenticated
  USING   (EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.jwt() ->> 'email'));
