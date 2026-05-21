-- ── Content Feed ────────────────────────────────────────────────────────────
-- Posts table (youtube | blog | post types)

CREATE TABLE IF NOT EXISTS content_feed_posts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type         text        NOT NULL CHECK (type IN ('youtube', 'blog', 'post')),
  title        text        NOT NULL DEFAULT '',
  body         text        NOT NULL DEFAULT '',
  url          text,
  youtube_id   text,
  media        jsonb       NOT NULL DEFAULT '[]',
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE content_feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read content feed posts"
  ON content_feed_posts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.email()));

CREATE POLICY "Admin insert content feed posts"
  ON content_feed_posts FOR INSERT TO authenticated
  WITH CHECK (auth.email() = 'matthew@matthewcawood.com');

CREATE POLICY "Admin update content feed posts"
  ON content_feed_posts FOR UPDATE TO authenticated
  USING  (auth.email() = 'matthew@matthewcawood.com')
  WITH CHECK (auth.email() = 'matthew@matthewcawood.com');

CREATE POLICY "Admin delete content feed posts"
  ON content_feed_posts FOR DELETE TO authenticated
  USING (auth.email() = 'matthew@matthewcawood.com');

-- ── Comments ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS content_feed_comments (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           uuid        NOT NULL REFERENCES content_feed_posts(id) ON DELETE CASCADE,
  email             text        NOT NULL,
  name              text        NOT NULL DEFAULT '',
  content           text        NOT NULL DEFAULT '',
  media             jsonb       NOT NULL DEFAULT '[]',
  parent_comment_id uuid        REFERENCES content_feed_comments(id) ON DELETE CASCADE,
  reply_to_name     text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE content_feed_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read content feed comments"
  ON content_feed_comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.email()));

CREATE POLICY "Members insert content feed comments"
  ON content_feed_comments FOR INSERT TO authenticated
  WITH CHECK (
    auth.email() = email
    AND EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.email())
  );

CREATE POLICY "Members delete own content feed comments"
  ON content_feed_comments FOR DELETE TO authenticated
  USING (auth.email() = email OR auth.email() = 'matthew@matthewcawood.com');

-- ── Reactions / Likes ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS content_feed_likes (
  post_id uuid NOT NULL REFERENCES content_feed_posts(id) ON DELETE CASCADE,
  email   text NOT NULL,
  emoji   text NOT NULL DEFAULT '❤️',
  PRIMARY KEY (post_id, email)
);

ALTER TABLE content_feed_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read content feed likes"
  ON content_feed_likes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.email()));

CREATE POLICY "Members insert content feed likes"
  ON content_feed_likes FOR INSERT TO authenticated
  WITH CHECK (
    auth.email() = email
    AND EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.email())
  );

CREATE POLICY "Members delete own content feed likes"
  ON content_feed_likes FOR DELETE TO authenticated
  USING (auth.email() = email);

CREATE POLICY "Members update own content feed likes"
  ON content_feed_likes FOR UPDATE TO authenticated
  USING  (auth.email() = email)
  WITH CHECK (auth.email() = email);
