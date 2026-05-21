-- Add poll column to content_feed_comments (mirrors community_post_comments)
ALTER TABLE content_feed_comments
  ADD COLUMN IF NOT EXISTS poll jsonb;
