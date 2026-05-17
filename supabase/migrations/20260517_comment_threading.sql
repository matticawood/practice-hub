-- Add threading support to community post comments
ALTER TABLE community_post_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES community_post_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reply_to_name text;

-- Index for fetching replies efficiently
CREATE INDEX IF NOT EXISTS idx_comments_parent ON community_post_comments(parent_comment_id);
