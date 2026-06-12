-- Store backend: digital products (PDFs + the Art of Understanding Music course).
-- The storefront itself is static (generated on the brand site from a catalog),
-- so these tables only cover the dynamic side: paid orders, free-PDF leads, and
-- the course curriculum (Mux playback IDs).
--
-- Written server-side only:
--   store-webhook  inserts a store_orders row on a paid checkout + emails the
--                  buyer a tokenised download / course-access link.
--   store-free     inserts a store_leads row on a free-PDF email capture.
--   store-access   validates an order's access_token, then returns a signed PDF
--                  URL or Mux signed playback tokens for the course player.
-- Owner-read only; all writes go through service-role edge functions.
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

-- ── Paid orders ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS store_orders (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stripe_session_id text,
  email             text NOT NULL,
  slug              text NOT NULL,          -- product slug (matches the static catalog)
  kind              text NOT NULL,          -- 'pdf' | 'course'
  amount_minor      int,                    -- amount paid, in the currency's minor unit
  currency          text,                   -- e.g. 'gbp'
  access_token      uuid NOT NULL DEFAULT gen_random_uuid(),  -- magic-link token for delivery
  created_at        timestamptz NOT NULL DEFAULT now()
);
-- one row per Stripe purchase (idempotent webhook retries)
CREATE UNIQUE INDEX IF NOT EXISTS store_orders_session_idx ON store_orders (stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS store_orders_token_idx ON store_orders (access_token);
CREATE INDEX IF NOT EXISTS store_orders_email_idx ON store_orders (lower(email));

ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS store_orders_owner_read ON store_orders;
CREATE POLICY store_orders_owner_read ON store_orders
  FOR SELECT TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

-- ── Free-PDF leads (email capture) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS store_leads (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      text NOT NULL,
  slug       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS store_leads_email_idx ON store_leads (lower(email));

ALTER TABLE store_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS store_leads_owner_read ON store_leads;
CREATE POLICY store_leads_owner_read ON store_leads
  FOR SELECT TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

-- ── Course curriculum (Mux) ──────────────────────────────────────────────────
-- One row per course video. Populated when the videos are uploaded to Mux; the
-- course player reads them (via store-access, service role) after validating the
-- buyer's access_token. free_preview = playable without a purchase (trailers).
CREATE TABLE IF NOT EXISTS store_lessons (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_slug    text NOT NULL,            -- e.g. 'the-art-of-understanding-music'
  chapter         int,                      -- chapter number (1..n)
  chapter_title   text,
  idx             int,                      -- order within the chapter
  title           text NOT NULL,
  mux_playback_id text,                     -- Mux signed playback ID
  mux_asset_id    text,
  duration_sec    int,
  free_preview    boolean NOT NULL DEFAULT false,
  sort            int NOT NULL DEFAULT 0,   -- global ordering across the course
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS store_lessons_product_idx ON store_lessons (product_slug, sort);

ALTER TABLE store_lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS store_lessons_owner_read ON store_lessons;
CREATE POLICY store_lessons_owner_read ON store_lessons
  FOR SELECT TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

-- ── Private storage bucket for the PDFs ──────────────────────────────────────
-- Files are delivered via short-lived signed URLs minted by store-access (service
-- role), so the bucket stays private (no public policies needed).
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-files', 'store-files', false)
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
