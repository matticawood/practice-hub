-- Let the owner READ any member's prior-hours baseline, so the roadmap Journey card
-- and roadmap page show the correct level when the owner uses "View as <member>".
--
-- Why: pb_select (20260606) is self-only (lower(email) = jwt email), so under
-- "view as" the owner can't read the member's practice_baseline row — the Journey
-- card then computes their level from logged sessions ONLY, missing prior hours.
-- This adds an owner SELECT override (RLS OR's permissive policies). Read-only;
-- members still can't read each other's baselines.
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

DROP POLICY IF EXISTS pb_select_owner ON practice_baseline;
CREATE POLICY pb_select_owner ON practice_baseline
  FOR SELECT TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

NOTIFY pgrst, 'reload schema';
