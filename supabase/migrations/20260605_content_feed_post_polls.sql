-- Relational poll tables for the content feed (content-feed.html post composer).
-- Mirrors the community_post_polls / tc_comment_polls pattern so polls work the
-- same way on content-feed posts as they do on community posts and comments.

CREATE TABLE IF NOT EXISTS content_feed_post_polls (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES content_feed_posts(id) ON DELETE CASCADE,
  question   text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE content_feed_post_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read content_feed_post_polls"  ON content_feed_post_polls FOR SELECT USING (true);
CREATE POLICY "members write content_feed_post_polls" ON content_feed_post_polls FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS content_feed_post_poll_options (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id  uuid NOT NULL REFERENCES content_feed_post_polls(id) ON DELETE CASCADE,
  label    text NOT NULL,
  position integer NOT NULL DEFAULT 0
);
ALTER TABLE content_feed_post_poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read content_feed_post_poll_options"  ON content_feed_post_poll_options FOR SELECT USING (true);
CREATE POLICY "members write content_feed_post_poll_options" ON content_feed_post_poll_options FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS content_feed_post_poll_votes (
  poll_id   uuid NOT NULL REFERENCES content_feed_post_polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES content_feed_post_poll_options(id) ON DELETE CASCADE,
  email     text NOT NULL,
  PRIMARY KEY (poll_id, email)
);
ALTER TABLE content_feed_post_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read content_feed_post_poll_votes"   ON content_feed_post_poll_votes FOR SELECT USING (true);
CREATE POLICY "members insert content_feed_post_poll_votes" ON content_feed_post_poll_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "members update content_feed_post_poll_votes" ON content_feed_post_poll_votes FOR UPDATE USING (true);
CREATE POLICY "members delete content_feed_post_poll_votes" ON content_feed_post_poll_votes FOR DELETE USING (true);
