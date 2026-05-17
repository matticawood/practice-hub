-- ── Community posts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_posts (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  email      text        NOT NULL,
  name       text,
  type       text        NOT NULL CHECK (type IN ('progress','feedback','question','post')),
  title      text        NOT NULL,
  content    text        NOT NULL
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read posts"
  ON community_posts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Members can insert own posts"
  ON community_posts FOR INSERT
  WITH CHECK (auth.email() = email);

CREATE POLICY "Members can delete own posts"
  ON community_posts FOR DELETE
  USING (auth.email() = email);

-- ── Post likes ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_post_likes (
  post_id    uuid        REFERENCES community_posts(id) ON DELETE CASCADE,
  email      text        NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, email)
);

ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read likes"
  ON community_post_likes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Members can manage own likes"
  ON community_post_likes FOR ALL
  USING (auth.email() = email)
  WITH CHECK (auth.email() = email);

-- ── Post comments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_post_comments (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    uuid        REFERENCES community_posts(id) ON DELETE CASCADE,
  email      text        NOT NULL,
  name       text,
  content    text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE community_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read comments"
  ON community_post_comments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Members can insert own comments"
  ON community_post_comments FOR INSERT
  WITH CHECK (auth.email() = email);

CREATE POLICY "Members can delete own comments"
  ON community_post_comments FOR DELETE
  USING (auth.email() = email);

-- ── Activity feed reactions ────────────────────────────────────────────────────
-- Emoji reactions on session/achievement feed items.
-- item_id is the numeric id of the session or achievement row (stored as text).
CREATE TABLE IF NOT EXISTS activity_reactions (
  email      text        NOT NULL,
  event_type text        NOT NULL,
  item_id    text        NOT NULL,
  emoji      text        NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (email, event_type, item_id, emoji)
);

ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read activity reactions"
  ON activity_reactions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Members can manage own activity reactions"
  ON activity_reactions FOR ALL
  USING (auth.email() = email)
  WITH CHECK (auth.email() = email);

-- ── Activity feed comments ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_comments (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text        NOT NULL,
  item_id    text        NOT NULL,
  email      text        NOT NULL,
  name       text,
  content    text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read activity comments"
  ON activity_comments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Members can insert own activity comments"
  ON activity_comments FOR INSERT
  WITH CHECK (auth.email() = email);

CREATE POLICY "Members can delete own activity comments"
  ON activity_comments FOR DELETE
  USING (auth.email() = email);
