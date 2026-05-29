-- Track signed-in members' last-seen time and current page so admin can see
-- who is online. Each authenticated user upserts their own row every ~60s
-- while a tab is open. Only the site owner can SELECT all rows.

CREATE TABLE IF NOT EXISTS user_presence (
  email        text        PRIMARY KEY REFERENCES allowed_emails(email) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  page         text
);

CREATE INDEX IF NOT EXISTS user_presence_last_seen_idx
  ON user_presence(last_seen_at DESC);

ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Each user can insert / update their own row only
CREATE POLICY "users_insert_own_presence" ON user_presence
  FOR INSERT TO authenticated
  WITH CHECK (auth.email() = email);

CREATE POLICY "users_update_own_presence" ON user_presence
  FOR UPDATE TO authenticated
  USING (auth.email() = email)
  WITH CHECK (auth.email() = email);

-- Owner-only read
CREATE POLICY "owner_read_all_presence" ON user_presence
  FOR SELECT TO authenticated
  USING (auth.email() = 'matthew@matthewcawood.com');

NOTIFY pgrst, 'reload schema';
