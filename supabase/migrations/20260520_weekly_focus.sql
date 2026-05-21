-- Weekly Practice Focus
-- Each row is one weekly post written by admin.
-- Comments and likes mirror the community_post_* tables exactly.

-- ── Main table ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_focus (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  headline     text        NOT NULL,               -- bold topic line
  intro        text        NOT NULL DEFAULT '',    -- opening paragraph(s)
  steps        jsonb       NOT NULL DEFAULT '[]',  -- [{text, bullets:[]}]
  closing      text        NOT NULL DEFAULT '',    -- closing paragraph(s)
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Comments (mirrors community_post_comments) ────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_focus_comments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  focus_id         uuid        NOT NULL REFERENCES weekly_focus(id) ON DELETE CASCADE,
  email            text        NOT NULL,
  name             text        NOT NULL DEFAULT '',
  content          text        NOT NULL DEFAULT '',
  media            jsonb       NOT NULL DEFAULT '[]',
  parent_comment_id uuid       REFERENCES weekly_focus_comments(id) ON DELETE CASCADE,
  reply_to_name    text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS weekly_focus_comments_focus_idx ON weekly_focus_comments (focus_id, created_at);

-- ── Likes (mirrors community_post_likes) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_focus_likes (
  focus_id uuid NOT NULL REFERENCES weekly_focus(id) ON DELETE CASCADE,
  email    text NOT NULL,
  PRIMARY KEY (focus_id, email)
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE weekly_focus          ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_focus_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_focus_likes    ENABLE ROW LEVEL SECURITY;

-- Members can read all
CREATE POLICY "focus_read"          ON weekly_focus          FOR SELECT TO authenticated USING (true);
CREATE POLICY "focus_comments_read" ON weekly_focus_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "focus_likes_read"    ON weekly_focus_likes    FOR SELECT TO authenticated USING (true);

-- Admin can write weekly_focus
CREATE POLICY "focus_admin_write"   ON weekly_focus
  FOR ALL TO authenticated
  USING   (EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.jwt() ->> 'email'));

-- Members can write their own comments
CREATE POLICY "focus_comments_write" ON weekly_focus_comments
  FOR ALL TO authenticated
  USING   (email = auth.jwt() ->> 'email')
  WITH CHECK (email = auth.jwt() ->> 'email');

-- Members can manage their own likes
CREATE POLICY "focus_likes_write" ON weekly_focus_likes
  FOR ALL TO authenticated
  USING   (email = auth.jwt() ->> 'email')
  WITH CHECK (email = auth.jwt() ->> 'email');
