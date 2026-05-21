-- Relational poll tables for shared-comments.js (content feed + weekly focus comments)
-- Mirrors the community_post_polls / community_post_poll_options / community_post_poll_votes pattern

CREATE TABLE IF NOT EXISTS tc_comment_polls (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  question   text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE tc_comment_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read tc_comment_polls"  ON tc_comment_polls FOR SELECT USING (true);
CREATE POLICY "members write tc_comment_polls" ON tc_comment_polls FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS tc_comment_poll_options (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id  uuid NOT NULL REFERENCES tc_comment_polls(id) ON DELETE CASCADE,
  label    text NOT NULL,
  position integer NOT NULL DEFAULT 0
);
ALTER TABLE tc_comment_poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read tc_comment_poll_options"  ON tc_comment_poll_options FOR SELECT USING (true);
CREATE POLICY "members write tc_comment_poll_options" ON tc_comment_poll_options FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS tc_comment_poll_votes (
  poll_id   uuid NOT NULL REFERENCES tc_comment_polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES tc_comment_poll_options(id) ON DELETE CASCADE,
  email     text NOT NULL,
  PRIMARY KEY (poll_id, email)
);
ALTER TABLE tc_comment_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read tc_comment_poll_votes"   ON tc_comment_poll_votes FOR SELECT USING (true);
CREATE POLICY "members insert tc_comment_poll_votes" ON tc_comment_poll_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "members update tc_comment_poll_votes" ON tc_comment_poll_votes FOR UPDATE USING (true);
