-- Fix: notifications table RLS policies
-- The table exists but is missing INSERT/UPDATE policies for the anon role.
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

-- Make sure RLS is on
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (safe to re-run)
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;

-- Anyone can read notifications (the app filters by email in JS)
CREATE POLICY "notifications_select"
  ON notifications FOR SELECT TO anon USING (true);

-- Anon key can insert — app enforces email = myEmail in JS
CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT TO anon WITH CHECK (true);

-- Anon key can update (marking as read)
CREATE POLICY "notifications_update"
  ON notifications FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Anon key can delete (optional, for future cleanup)
CREATE POLICY "notifications_delete"
  ON notifications FOR DELETE TO anon USING (true);
