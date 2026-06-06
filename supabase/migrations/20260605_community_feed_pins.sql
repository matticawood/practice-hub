-- Pin ANY item that appears in the community feed (community posts, content-feed
-- posts, weekly focus, practice-room updates) to the top — source-agnostic, so
-- one mechanism covers every feed source.
--
--   source     ∈ 'community' | 'content_feed' | 'weekly_focus' | 'practice_room_update'
--   source_id  = the row id in that source table (text — ids are uuid or int)
--   pinned_at  = when it was pinned (most-recently-pinned floats highest)
--
-- Only the owner pins/unpins (the UI shows the control to admins only). RLS:
-- everyone can read pins (to render the feed order + 📌 marker); only the owner
-- may insert/delete.
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

CREATE TABLE IF NOT EXISTS community_feed_pins (
  source     text        NOT NULL,
  source_id  text        NOT NULL,
  pinned_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, source_id)
);

ALTER TABLE community_feed_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_feed_pins_select ON community_feed_pins;
DROP POLICY IF EXISTS community_feed_pins_insert ON community_feed_pins;
DROP POLICY IF EXISTS community_feed_pins_delete ON community_feed_pins;

CREATE POLICY community_feed_pins_select ON community_feed_pins
  FOR SELECT TO authenticated USING (true);

CREATE POLICY community_feed_pins_insert ON community_feed_pins
  FOR INSERT TO authenticated
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

CREATE POLICY community_feed_pins_delete ON community_feed_pins
  FOR DELETE TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

NOTIFY pgrst, 'reload schema';
