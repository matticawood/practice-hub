-- ──────────────────────────────────────────────────────────────────────────────
-- Owner read/write on the private 'book-sources' bucket.
--
-- Book Studio (owner-only) stores source page images here, e.g. the extracted
-- sheet-music pages for the "Sight Reading Exercises" book at
-- 'sight-reading-exercises/p03.png'. The studio signs these to short-lived URLs
-- client-side (createSignedUrl), which requires the owner to hold SELECT on the
-- objects. The bucket was created by hand and never had a policy, so add one.
-- Additive + idempotent: safe to re-run, touches nothing but this bucket.
-- ──────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS book_sources_owner_read ON storage.objects;
CREATE POLICY book_sources_owner_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'book-sources' AND lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

DROP POLICY IF EXISTS book_sources_owner_write ON storage.objects;
CREATE POLICY book_sources_owner_write ON storage.objects
  FOR ALL
  USING      (bucket_id = 'book-sources' AND lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com')
  WITH CHECK (bucket_id = 'book-sources' AND lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');
