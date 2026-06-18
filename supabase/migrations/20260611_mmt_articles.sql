-- Monday Music Tips CMS: the source of truth for all tips (the 115 migrated from
-- Squarespace + every new one written in mmt-studio). The brand site (separate
-- Netlify site) generates static /monday-music-tips pages from the PUBLISHED rows
-- at build time, triggered by a build hook when an article is published.
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

CREATE TABLE IF NOT EXISTS mmt_articles (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug          text NOT NULL UNIQUE,
  title         text NOT NULL,
  excerpt       text,                 -- short summary for the archive + meta description
  body_html     text NOT NULL DEFAULT '',
  cover_image   text,                 -- public URL (Supabase Storage)
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at  timestamptz,          -- original publish date (migrated) or publish time (new)
  seo_description text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mmt_articles_status_pub_idx ON mmt_articles (status, published_at DESC);
CREATE INDEX IF NOT EXISTS mmt_articles_slug_idx       ON mmt_articles (slug);

ALTER TABLE mmt_articles ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. the build using the anon key) may read PUBLISHED articles.
DROP POLICY IF EXISTS mmt_public_read ON mmt_articles;
CREATE POLICY mmt_public_read ON mmt_articles
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- The owner authors everything (drafts + published, all operations).
DROP POLICY IF EXISTS mmt_owner_all ON mmt_articles;
CREATE POLICY mmt_owner_all ON mmt_articles
  FOR ALL TO authenticated
  USING      (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

-- keep updated_at fresh
CREATE OR REPLACE FUNCTION mmt_touch_updated_at() RETURNS trigger
  LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS mmt_touch ON mmt_articles;
CREATE TRIGGER mmt_touch BEFORE UPDATE ON mmt_articles
  FOR EACH ROW EXECUTE FUNCTION mmt_touch_updated_at();

-- ── Image storage (cover + inline images, public) ──────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('mmt-images', 'mmt-images', true)
ON CONFLICT (id) DO NOTHING;

-- public read of the bucket's objects
DROP POLICY IF EXISTS mmt_images_public_read ON storage.objects;
CREATE POLICY mmt_images_public_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'mmt-images');

-- owner may upload/replace/delete cover images from mmt-studio
DROP POLICY IF EXISTS mmt_images_owner_write ON storage.objects;
CREATE POLICY mmt_images_owner_write ON storage.objects
  FOR ALL TO authenticated
  USING      (bucket_id = 'mmt-images' AND lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com')
  WITH CHECK (bucket_id = 'mmt-images' AND lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

NOTIFY pgrst, 'reload schema';
