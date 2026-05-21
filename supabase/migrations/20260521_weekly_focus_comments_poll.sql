-- Add poll column to weekly_focus_comments (mirrors content_feed_comments / community_post_comments)
ALTER TABLE weekly_focus_comments
  ADD COLUMN IF NOT EXISTS poll jsonb;
