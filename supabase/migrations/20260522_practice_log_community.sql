-- ================================================================
-- Add session_id column to community_posts for Shared Practice Logs
-- Generated 2026-05-22
--
-- Structured practice log posts set session_id to link back to the
-- practice_sessions row. Unstructured (imported Circle posts) leave
-- session_id as NULL and carry the text content directly.
-- ================================================================

-- Expand the type CHECK constraint to include 'practice_log'
ALTER TABLE community_posts DROP CONSTRAINT IF EXISTS community_posts_type_check;
ALTER TABLE community_posts ADD CONSTRAINT community_posts_type_check
  CHECK (type IN ('progress', 'feedback', 'question', 'post', 'practice_log'));

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS session_id bigint REFERENCES practice_sessions(id) ON DELETE SET NULL;

-- Fast lookup: "all community posts linked to session X"
CREATE INDEX IF NOT EXISTS idx_community_posts_session_id
  ON community_posts(session_id);

-- Fast lookup: "all posts of type practice_log ordered by date"
CREATE INDEX IF NOT EXISTS idx_community_posts_type_created
  ON community_posts(type, created_at DESC);
