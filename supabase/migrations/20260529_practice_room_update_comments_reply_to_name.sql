-- Add reply_to_name to practice_room_update_comments
--
-- shared-comments.js submitReply() inserts a `reply_to_name` field into the
-- target comments table. The column existed on community_post_comments
-- (added in 20260517_comment_threading.sql) and content_feed_comments, but
-- was never added to practice_room_update_comments. Replies to comments on
-- /updates posts therefore failed.
--
-- Also nudge PostgREST to reload its schema cache so the new column is
-- picked up without restarting the API.

ALTER TABLE practice_room_update_comments
  ADD COLUMN IF NOT EXISTS reply_to_name text;

CREATE INDEX IF NOT EXISTS idx_pru_comments_parent
  ON practice_room_update_comments(parent_comment_id);

NOTIFY pgrst, 'reload schema';
