-- Reset user_presence RLS policies. The earlier case-insensitive migration
-- left the table in a state where every INSERT is rejected with 42501
-- ("new row violates row-level security policy") — even when auth.email()
-- and the payload email match exactly. Drop ALL existing policies on the
-- table and recreate from scratch.

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'user_presence'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON user_presence', pol.policyname);
  END LOOP;
END $$;

-- Make sure RLS is on
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Each user can INSERT/UPDATE their own row (case-insensitive on email).
CREATE POLICY "users_insert_own_presence" ON user_presence
  FOR INSERT TO authenticated
  WITH CHECK (lower(auth.email()) = lower(email));

CREATE POLICY "users_update_own_presence" ON user_presence
  FOR UPDATE TO authenticated
  USING       (lower(auth.email()) = lower(email))
  WITH CHECK  (lower(auth.email()) = lower(email));

-- Each user can SELECT their own row (so PostgREST .upsert can return it).
CREATE POLICY "users_select_own_presence" ON user_presence
  FOR SELECT TO authenticated
  USING (lower(auth.email()) = lower(email));

-- Owner can SELECT all rows (drives the admin presence panel).
CREATE POLICY "owner_read_all_presence" ON user_presence
  FOR SELECT TO authenticated
  USING (lower(auth.email()) = 'matthew@matthewcawood.com');

NOTIFY pgrst, 'reload schema';
