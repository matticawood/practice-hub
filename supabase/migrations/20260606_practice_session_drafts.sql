-- Practice-log drafts: a parking spot for an in-progress session entry so an
-- accidental tap (or closing the app) never wipes half-entered work, and so a
-- member can deliberately "Save draft" and finish later — including across
-- devices, hence a synced table rather than localStorage.
--
-- Deliberately a SEPARATE table from practice_sessions: drafts must never be
-- seen by any totals / streak / heatmap / goal rollup. A draft just holds the
-- in-progress form state (date, notes, and the items array in the exact shape
-- collectItemData() emits). On real save it becomes a practice_session and the
-- draft row is deleted.
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

CREATE TABLE IF NOT EXISTS practice_session_drafts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL,
  session_date date,
  notes        text,
  items        jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS practice_session_drafts_email_idx
  ON practice_session_drafts (lower(email), updated_at DESC);

ALTER TABLE practice_session_drafts ENABLE ROW LEVEL SECURITY;

-- Members can only ever see / write their own drafts.
DROP POLICY IF EXISTS "psd_select" ON practice_session_drafts;
CREATE POLICY "psd_select" ON practice_session_drafts
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "psd_insert" ON practice_session_drafts;
CREATE POLICY "psd_insert" ON practice_session_drafts
  FOR INSERT TO authenticated
  WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "psd_update" ON practice_session_drafts;
CREATE POLICY "psd_update" ON practice_session_drafts
  FOR UPDATE TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'))
  WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "psd_delete" ON practice_session_drafts;
CREATE POLICY "psd_delete" ON practice_session_drafts
  FOR DELETE TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

NOTIFY pgrst, 'reload schema';
