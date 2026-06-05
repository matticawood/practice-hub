-- Allow editing polls attached to content-feed posts.
-- The original 20260605_content_feed_post_polls.sql only granted SELECT + INSERT,
-- so the post composer's "Edit" path (update question / rebuild options / remove
-- poll) was blocked by RLS. These add the missing UPDATE + DELETE policies.
-- Deleting a poll or an option cascades to its votes via ON DELETE CASCADE.

CREATE POLICY "members update content_feed_post_polls"
  ON content_feed_post_polls FOR UPDATE USING (true);
CREATE POLICY "members delete content_feed_post_polls"
  ON content_feed_post_polls FOR DELETE USING (true);

CREATE POLICY "members delete content_feed_post_poll_options"
  ON content_feed_post_poll_options FOR DELETE USING (true);
CREATE POLICY "members update content_feed_post_poll_options"
  ON content_feed_post_poll_options FOR UPDATE USING (true);
