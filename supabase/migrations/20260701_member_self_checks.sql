-- Durable per-member store for the "tap when done" self-check objectives on the
-- Your Path card (scales/arpeggios/minors fluency, the perform/programme goals).
-- These were localStorage-only, so a member's ticks lived on one browser and were
-- lost on a cache clear or a second device. This gives each member one row keyed by
-- email, so the ticks follow them everywhere. Mirrors practice_baseline's shape and
-- RLS (self read/write; owner read for "View as <member>").
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

CREATE TABLE IF NOT EXISTS member_self_checks (
  email      text PRIMARY KEY,
  checks     jsonb NOT NULL DEFAULT '{}'::jsonb,  -- { "<goal key>": true, ... }
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE member_self_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "msc_select" ON member_self_checks;
CREATE POLICY "msc_select" ON member_self_checks
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- Owner SELECT override so "View as <member>" shows the member's real ticks
-- (RLS OR's permissive policies). Read-only; members can't read each other's.
DROP POLICY IF EXISTS "msc_select_owner" ON member_self_checks;
CREATE POLICY "msc_select_owner" ON member_self_checks
  FOR SELECT TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

DROP POLICY IF EXISTS "msc_insert" ON member_self_checks;
CREATE POLICY "msc_insert" ON member_self_checks
  FOR INSERT TO authenticated
  WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "msc_update" ON member_self_checks;
CREATE POLICY "msc_update" ON member_self_checks
  FOR UPDATE TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'))
  WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email'));

NOTIFY pgrst, 'reload schema';
