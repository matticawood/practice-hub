-- Full-funnel analytics: whole-site visitor events, booking records, and a vid
-- stitch on store orders. Mirrors the existing signup_events design (cookieless,
-- service-role writes, owner-read only). No PII beyond email on bookings; no IP.
--
-- site_events : every brand-site page event (view / scroll / leave) plus store and
--               booking funnel events (product_view / checkout_click / lesson_view /
--               lesson_select / slot_select / lesson_checkout_click), beaconed from
--               assets/js/analytics.js and written by the brand-site track.js.
-- bookings    : a row per paid lesson/clinic booking (lessons left no DB trace before
--               this), giving booking revenue + funnel completion. Written by
--               clinic-webhook (service role).
-- store_orders.vid : links a completed purchase back to the visitor journey, set from
--               Stripe client_reference_id (same trick as signup_conversions).
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

-- ── site_events (signup_events superset + funnel fields) ──────────────────────
CREATE TABLE IF NOT EXISTS site_events (
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
  ua           text,
  slug         text,   -- product / lesson slug for funnel events
  value_minor  int,    -- intended price at checkout-click (minor units)
  currency     text
);
CREATE INDEX IF NOT EXISTS site_events_ts_idx    ON site_events (ts);
CREATE INDEX IF NOT EXISTS site_events_event_idx ON site_events (event);
CREATE INDEX IF NOT EXISTS site_events_vid_idx   ON site_events (vid);
CREATE INDEX IF NOT EXISTS site_events_slug_idx  ON site_events (slug);
CREATE INDEX IF NOT EXISTS site_events_path_idx  ON site_events (path);

-- ── bookings (one row per paid lesson/clinic) ────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vid               text,
  email             text,
  kind              text,        -- '20min' | '30min' | '60min' | 'package'
  amount_minor      int,
  currency          text,
  stripe_session_id text UNIQUE, -- idempotent webhook
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_created_idx ON bookings (created_at);
CREATE INDEX IF NOT EXISTS bookings_email_idx   ON bookings (email);

-- ── vid stitch on store orders ───────────────────────────────────────────────
ALTER TABLE store_orders ADD COLUMN IF NOT EXISTS vid text;

-- ── RLS: owner-read only; all writes come from service-role functions ─────────
ALTER TABLE site_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_events_owner_read ON site_events;
CREATE POLICY site_events_owner_read ON site_events
  FOR SELECT TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

DROP POLICY IF EXISTS bookings_owner_read ON bookings;
CREATE POLICY bookings_owner_read ON bookings
  FOR SELECT TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

NOTIFY pgrst, 'reload schema';
