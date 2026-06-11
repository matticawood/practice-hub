-- Landing-page conversion analytics for /signup.
--
-- signup_events     : top-of-funnel events beaconed from the public signup page
--                     (view / scroll / video_play / cta_click / leave), written
--                     server-side by the Netlify function `track.js` using the
--                     service-role key. Cookieless: `vid` is a random id kept in
--                     the visitor's localStorage. No PII, no IP stored.
--
-- signup_conversions: the per-visitor stitch — when a paying member completes
--                     Stripe checkout, stripe-webhook records (vid -> email),
--                     because the vid rode through as Stripe client_reference_id.
--
-- Both are owner-read only (the admin analytics page). All writes come from
-- service-role functions, which bypass RLS, so no insert policy is needed.
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

CREATE TABLE IF NOT EXISTS signup_events (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vid          text        NOT NULL,
  event        text        NOT NULL,
  ts           timestamptz NOT NULL DEFAULT now(),
  path         text,
  referrer     text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  utm_content  text,
  utm_term     text,
  device       text,
  screen_w     int,
  scroll_pct   int,
  cta          text,
  dur_ms       bigint,
  country      text,
  ua           text
);
CREATE INDEX IF NOT EXISTS signup_events_ts_idx     ON signup_events (ts);
CREATE INDEX IF NOT EXISTS signup_events_event_idx  ON signup_events (event);
CREATE INDEX IF NOT EXISTS signup_events_vid_idx    ON signup_events (vid);
CREATE INDEX IF NOT EXISTS signup_events_source_idx ON signup_events (utm_source);

CREATE TABLE IF NOT EXISTS signup_conversions (
  vid      text        NOT NULL,
  email    text        NOT NULL,
  currency text,
  ts       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (vid, email)
);
CREATE INDEX IF NOT EXISTS signup_conversions_ts_idx ON signup_conversions (ts);

ALTER TABLE signup_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE signup_conversions ENABLE ROW LEVEL SECURITY;

-- Owner-only read (the admin analytics dashboard). Writes are service-role only.
DROP POLICY IF EXISTS signup_events_owner_read ON signup_events;
CREATE POLICY signup_events_owner_read ON signup_events
  FOR SELECT TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

DROP POLICY IF EXISTS signup_conversions_owner_read ON signup_conversions;
CREATE POLICY signup_conversions_owner_read ON signup_conversions
  FOR SELECT TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

NOTIFY pgrst, 'reload schema';
