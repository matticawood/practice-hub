-- ──────────────────────────────────────────────────────────────────────────────
-- device_tokens: per-user push notification tokens for the iOS app shell.
-- One row per (token), with the most recently signed-in email as the owner.
-- A new device/install generates a fresh FCM token, so token is the natural
-- primary key; users can be on multiple devices (token rows per device).
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS device_tokens (
  token         text        PRIMARY KEY,
  email         text        NOT NULL REFERENCES allowed_emails(email) ON DELETE CASCADE,
  platform      text        NOT NULL DEFAULT 'ios',
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS device_tokens_email_idx ON device_tokens(email);
CREATE INDEX IF NOT EXISTS device_tokens_last_seen_idx ON device_tokens(last_seen_at DESC);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Each user can register a token for themselves only (case-insensitive on
-- email to match the user_presence policy pattern).
DROP POLICY IF EXISTS "users_upsert_own_device_tokens" ON device_tokens;
DROP POLICY IF EXISTS "users_insert_own_device_tokens" ON device_tokens;
DROP POLICY IF EXISTS "users_update_own_device_tokens" ON device_tokens;
DROP POLICY IF EXISTS "users_delete_own_device_tokens" ON device_tokens;
DROP POLICY IF EXISTS "users_select_own_device_tokens" ON device_tokens;

CREATE POLICY "users_insert_own_device_tokens" ON device_tokens
  FOR INSERT TO authenticated
  WITH CHECK (lower(auth.email()) = lower(email));

CREATE POLICY "users_update_own_device_tokens" ON device_tokens
  FOR UPDATE TO authenticated
  USING       (lower(auth.email()) = lower(email))
  WITH CHECK  (lower(auth.email()) = lower(email));

CREATE POLICY "users_delete_own_device_tokens" ON device_tokens
  FOR DELETE TO authenticated
  USING (lower(auth.email()) = lower(email));

CREATE POLICY "users_select_own_device_tokens" ON device_tokens
  FOR SELECT TO authenticated
  USING (lower(auth.email()) = lower(email));

NOTIFY pgrst, 'reload schema';
