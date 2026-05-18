ALTER TABLE activity_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES activity_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reply_to_name text;

CREATE INDEX IF NOT EXISTS idx_activity_comments_parent ON activity_comments(parent_comment_id);
