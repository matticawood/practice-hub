-- Fix: notifications INSERT/UPDATE/SELECT/DELETE policies for authenticated role
-- The existing policies are TO anon only, but logged-in users use the
-- authenticated role, so cross-user reply notifications were silently blocked.
--
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

-- Replace anon-only policies with ones that cover both roles
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;

CREATE POLICY "notifications_select"
  ON notifications FOR SELECT
  TO anon, authenticated
  USING (true);

-- Any authenticated user can insert a notification (e.g. reply notifications)
CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "notifications_update"
  ON notifications FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "notifications_delete"
  ON notifications FOR DELETE
  TO anon, authenticated
  USING (true);
