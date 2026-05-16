-- Fix: feedback table RLS policies
-- Ensures anon key can INSERT new feedback items and upvote via RPC.
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

-- Make sure RLS is on (no-op if already enabled)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (safe to re-run)
DROP POLICY IF EXISTS "feedback_select" ON feedback;
DROP POLICY IF EXISTS "feedback_insert" ON feedback;
DROP POLICY IF EXISTS "feedback_update" ON feedback;
DROP POLICY IF EXISTS "feedback_delete" ON feedback;

-- Anyone can read feedback items (public roadmap/community board)
CREATE POLICY "feedback_select"
  ON feedback FOR SELECT TO anon USING (true);

-- Anon key can insert — app enforces email = myEmail in JS
CREATE POLICY "feedback_insert"
  ON feedback FOR INSERT TO anon WITH CHECK (true);

-- Anon key can update (upvote counts, admin status changes via RPC)
CREATE POLICY "feedback_update"
  ON feedback FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Anon key can delete (admin only — enforced in JS)
CREATE POLICY "feedback_delete"
  ON feedback FOR DELETE TO anon USING (true);
