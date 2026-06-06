-- Prior-hours baseline for the Practice Roadmap. Lets a member record practice
-- they did BEFORE joining The Practice Room (e.g. "300 hours, mostly repertoire")
-- so their roadmap levels reflect their real experience. They enter one total
-- plus a percentage split across the four sub-tracks; per-track baseline minutes
-- are derived as total_minutes * split%. All of total_minutes also counts toward
-- the headline Total track.
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

CREATE TABLE IF NOT EXISTS practice_baseline (
  email         text PRIMARY KEY,
  total_minutes numeric NOT NULL DEFAULT 0,
  split         jsonb   NOT NULL DEFAULT '{}'::jsonb,  -- { repertoire, technique, sight_reading, musicianship } as percentages
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE practice_baseline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pb_select" ON practice_baseline;
CREATE POLICY "pb_select" ON practice_baseline
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "pb_insert" ON practice_baseline;
CREATE POLICY "pb_insert" ON practice_baseline
  FOR INSERT TO authenticated
  WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "pb_update" ON practice_baseline;
CREATE POLICY "pb_update" ON practice_baseline
  FOR UPDATE TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'))
  WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email'));

NOTIFY pgrst, 'reload schema';
