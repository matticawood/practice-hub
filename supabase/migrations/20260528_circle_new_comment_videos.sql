-- ============================================================
-- Circle delta migration 2026-05-28 (new comment videos)
-- ============================================================

BEGIN;

UPDATE community_post_comments SET media = '[{"type": "mux", "playback_id": "ZUeJCoqJesv9eGbJjAo1SSbqMKSYr58Cb2E6ddvfcb00"}]'::jsonb
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Hi Matt. I was wondering if you have access to the sheet music for Etude no. 3: Ballade by Marie Awadis? I came across it tonight and I would love to learn it.' AND created_at = '2026-05-22 18:28:00+00' LIMIT 1)
  AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-23 12:22:00+00'
  AND (media IS NULL OR media = '[]'::jsonb);
UPDATE community_post_comments SET media = '[{"type": "mux", "playback_id": "X1sAVsXFhik701zXpjuohPJEtVrVptpqvjH02Ly83HOv00"}]'::jsonb
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1)
  AND email = 'cecile.dautriat@gmail.com' AND created_at = '2026-05-28 17:21:00+00'
  AND (media IS NULL OR media = '[]'::jsonb);

COMMIT;