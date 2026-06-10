-- Add platform to feature_usage so the admin can see WHERE members use the app:
-- iOS app (PWAShell), Android app (TWA), installed PWA, mobile web, desktop web.
--
-- Forward-looking: existing rows get 'unknown' (they predate this). The admin page
-- breaks down by the known platforms and notes how much is pre-tracking.
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

ALTER TABLE feature_usage ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'unknown';

-- platform becomes part of the key so the same view/day splits per platform.
ALTER TABLE feature_usage DROP CONSTRAINT IF EXISTS feature_usage_pkey;
ALTER TABLE feature_usage ADD PRIMARY KEY (email, view, day, platform);

-- Replace the 2-arg RPC with a 3-arg one (p_platform defaults, so older cached
-- clients that still POST only {p_view,p_seconds} keep working during rollout).
DROP FUNCTION IF EXISTS add_feature_usage(text, int);

CREATE OR REPLACE FUNCTION add_feature_usage(p_view text, p_seconds int, p_platform text DEFAULT 'unknown')
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
    RETURN;
  END IF;
  INSERT INTO feature_usage (email, view, day, seconds, platform)
  VALUES (v_email, left(p_view, 80), current_date, p_seconds, coalesce(left(p_platform, 20), 'unknown'))
  ON CONFLICT (email, view, day, platform)
  DO UPDATE SET seconds = feature_usage.seconds + excluded.seconds;
END;
$$;

GRANT EXECUTE ON FUNCTION add_feature_usage(text, int, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
