-- Fix: feedback_replies RLS policies
-- Safe to re-run: drops existing policies before recreating.
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

-- Ensure table exists
CREATE TABLE IF NOT EXISTS feedback_replies (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id  uuid        NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  email        text        NOT NULL,
  display_name text,
  body         text        NOT NULL,
  is_owner     boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_replies_feedback_id_idx
  ON feedback_replies (feedback_id, created_at ASC);

-- Enable RLS
ALTER TABLE feedback_replies ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (safe to re-run)
DROP POLICY IF EXISTS "feedback_replies_select" ON feedback_replies;
DROP POLICY IF EXISTS "feedback_replies_insert" ON feedback_replies;
DROP POLICY IF EXISTS "feedback_replies_update" ON feedback_replies;
DROP POLICY IF EXISTS "feedback_replies_delete" ON feedback_replies;

-- Recreate policies
CREATE POLICY "feedback_replies_select"
  ON feedback_replies FOR SELECT TO anon USING (true);

CREATE POLICY "feedback_replies_insert"
  ON feedback_replies FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "feedback_replies_delete"
  ON feedback_replies FOR DELETE TO anon USING (true);

-- Ensure anon role has table-level access
GRANT SELECT, INSERT, DELETE ON feedback_replies TO anon;

-- Also ensure notifications table has the source_id and metadata columns
-- (needed for reply notifications)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS source_id text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata  jsonb NOT NULL DEFAULT '{}';
