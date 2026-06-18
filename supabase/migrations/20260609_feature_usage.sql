-- Feature-usage time tracking: how long members spend on each view (Hub · Roadmap,
-- Community · Members, Practice Tools · Metronome, etc.), so the admin analytics
-- page can show what actually gets used.
--
-- Written client-side from shared-header.js: it accrues visible/active seconds on
-- the current view label and flushes them ~minutely via add_feature_usage().
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

CREATE TABLE IF NOT EXISTS feature_usage (
  email   text   NOT NULL,
  view    text   NOT NULL,
  day     date   NOT NULL DEFAULT current_date,
  seconds bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (email, view, day)
);
CREATE INDEX IF NOT EXISTS feature_usage_view_idx ON feature_usage (view);
CREATE INDEX IF NOT EXISTS feature_usage_day_idx  ON feature_usage (day);

ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- Only the owner reads (the admin analytics page). All writes go through the RPC.
DROP POLICY IF EXISTS feature_usage_owner_read ON feature_usage;
CREATE POLICY feature_usage_owner_read ON feature_usage
  FOR SELECT TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

-- Atomic per-user increment. SECURITY DEFINER so any signed-in member can add to
-- THEIR OWN row (email comes from the JWT, can't be spoofed) without needing
-- direct insert/update grants on the table.
CREATE OR REPLACE FUNCTION add_feature_usage(p_view text, p_seconds int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(auth.jwt() ->> 'email');
BEGIN
  IF v_email IS NULL OR p_view IS NULL OR p_seconds IS NULL
     OR p_seconds <= 0 OR p_seconds > 3600 THEN
    RETURN;  -- ignore junk / out-of-range
  END IF;
  INSERT INTO feature_usage (email, view, day, seconds)
  VALUES (v_email, left(p_view, 80), current_date, p_seconds)
  ON CONFLICT (email, view, day)
  DO UPDATE SET seconds = feature_usage.seconds + excluded.seconds;
END;
$$;

GRANT EXECUTE ON FUNCTION add_feature_usage(text, int) TO authenticated;

NOTIFY pgrst, 'reload schema';
