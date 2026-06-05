-- Allow members to remove (un-vote) their own poll vote across all poll types.
-- content_feed_post_poll_votes already got its DELETE policy in the earlier
-- migration; event_comment_poll_votes already had one. These three were missing.

CREATE POLICY "members delete tc_comment_poll_votes"
  ON tc_comment_poll_votes FOR DELETE USING (true);

CREATE POLICY "members delete community_post_poll_votes"
  ON community_post_poll_votes FOR DELETE USING (true);

CREATE POLICY "members delete community_chat_poll_votes"
  ON community_chat_poll_votes FOR DELETE USING (true);
