-- Fix user_presence RLS so heartbeats don't silently fail for users whose
-- session email casing differs from what the client sends. Some auth-provider
-- flows preserve mixed-case emails in auth.email() while the heartbeat
-- lower-cases them — the original policy `auth.email() = email` then rejects
-- the upsert. Switch to lower(...) comparisons.

DROP POLICY IF EXISTS "users_insert_own_presence" ON user_presence;
DROP POLICY IF EXISTS "users_update_own_presence" ON user_presence;
DROP POLICY IF EXISTS "owner_read_all_presence"   ON user_presence;

CREATE POLICY "users_insert_own_presence" ON user_presence
  FOR INSERT TO authenticated
  WITH CHECK (lower(auth.email()) = lower(email));

CREATE POLICY "users_update_own_presence" ON user_presence
  FOR UPDATE TO authenticated
  USING       (lower(auth.email()) = lower(email))
  WITH CHECK  (lower(auth.email()) = lower(email));

CREATE POLICY "owner_read_all_presence" ON user_presence
  FOR SELECT TO authenticated
  USING (lower(auth.email()) = 'matthew@matthewcawood.com');

NOTIFY pgrst, 'reload schema';
