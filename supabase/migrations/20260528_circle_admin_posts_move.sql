-- ============================================================
-- Circle delta migration 2026-05-28 (admin posts fix-up)
--
-- Routes posts authored by the admin (matthew@matthewcawood.com) to
-- content_feed_posts/content_feed_comments instead of community_posts/
-- community_post_comments.
--
-- Three posts were already inserted via 20260528_circle_posts_delta.sql
-- into community_posts (with their comments + Mux media); this migration
-- moves them to content_feed_posts and migrates their comments.
-- Two more (Shaping in Grade 8 Pieces, Weekly Practice Focus 25th May 2026)
-- did not get inserted previously; we INSERT them fresh into content_feed_posts.
-- ============================================================

BEGIN;

-- ── 1. Move "Emotion Improv Challenge: Perhaps a New Feature? 👀" ──────────────
DO $$
DECLARE
  src_id uuid;
  dst_id uuid;
BEGIN
  SELECT id INTO src_id FROM community_posts
    WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀'
      AND created_at = '2026-05-26 15:15:00+00';
  IF src_id IS NOT NULL THEN
    INSERT INTO content_feed_posts (type, title, body, media, published_at, created_at)
      SELECT 'post', title, COALESCE(content, ''), COALESCE(media, '[]'::jsonb), created_at, created_at
      FROM community_posts WHERE id = src_id
      RETURNING id INTO dst_id;
    INSERT INTO content_feed_comments (post_id, email, name, content, media, parent_comment_id, reply_to_name, created_at)
      SELECT dst_id, email, name, content, COALESCE(media, '[]'::jsonb), parent_comment_id, reply_to_name, created_at
      FROM community_post_comments WHERE post_id = src_id;
    INSERT INTO content_feed_likes (post_id, email)
      SELECT dst_id, email FROM community_post_likes WHERE post_id = src_id
      ON CONFLICT (post_id, email) DO NOTHING;
    DELETE FROM community_post_likes WHERE post_id = src_id;
    DELETE FROM community_post_comments WHERE post_id = src_id;
    DELETE FROM community_posts WHERE id = src_id;
  END IF;
END $$;

-- ── 2. Move "Live Practice Clinic: Playing Confidently When Playing For Others" ──
DO $$
DECLARE
  src_id uuid;
  dst_id uuid;
BEGIN
  SELECT id INTO src_id FROM community_posts
    WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others'
      AND created_at = '2026-05-25 18:32:00+00';
  IF src_id IS NOT NULL THEN
    INSERT INTO content_feed_posts (type, title, body, media, published_at, created_at)
      SELECT 'post', title, COALESCE(content, ''), COALESCE(media, '[]'::jsonb), created_at, created_at
      FROM community_posts WHERE id = src_id
      RETURNING id INTO dst_id;
    INSERT INTO content_feed_comments (post_id, email, name, content, media, parent_comment_id, reply_to_name, created_at)
      SELECT dst_id, email, name, content, COALESCE(media, '[]'::jsonb), parent_comment_id, reply_to_name, created_at
      FROM community_post_comments WHERE post_id = src_id;
    INSERT INTO content_feed_likes (post_id, email)
      SELECT dst_id, email FROM community_post_likes WHERE post_id = src_id
      ON CONFLICT (post_id, email) DO NOTHING;
    DELETE FROM community_post_likes WHERE post_id = src_id;
    DELETE FROM community_post_comments WHERE post_id = src_id;
    DELETE FROM community_posts WHERE id = src_id;
  END IF;
END $$;

-- ── 3. Move "Live Practice Clinic - 25th May - Topic Poll" ────────────────────
DO $$
DECLARE
  src_id uuid;
  dst_id uuid;
BEGIN
  SELECT id INTO src_id FROM community_posts
    WHERE title = 'Live Practice Clinic - 25th May - Topic Poll'
      AND created_at = '2026-05-22 11:24:00+00';
  IF src_id IS NOT NULL THEN
    INSERT INTO content_feed_posts (type, title, body, media, published_at, created_at)
      SELECT 'post', title, COALESCE(content, ''), COALESCE(media, '[]'::jsonb), created_at, created_at
      FROM community_posts WHERE id = src_id
      RETURNING id INTO dst_id;
    INSERT INTO content_feed_comments (post_id, email, name, content, media, parent_comment_id, reply_to_name, created_at)
      SELECT dst_id, email, name, content, COALESCE(media, '[]'::jsonb), parent_comment_id, reply_to_name, created_at
      FROM community_post_comments WHERE post_id = src_id;
    INSERT INTO content_feed_likes (post_id, email)
      SELECT dst_id, email FROM community_post_likes WHERE post_id = src_id
      ON CONFLICT (post_id, email) DO NOTHING;
    DELETE FROM community_post_likes WHERE post_id = src_id;
    DELETE FROM community_post_comments WHERE post_id = src_id;
    DELETE FROM community_posts WHERE id = src_id;
  END IF;
END $$;

-- ── 4. INSERT "Shaping in Grade 8 Pieces" (was never imported) ──────────────────
INSERT INTO content_feed_posts (type, title, body, media, published_at, created_at)
SELECT 'post', 'Shaping in Grade 8 Pieces', '',
       '[{"type": "mux", "playbackId": "c6UPnCZzJNgg2grKaW02YUqnf3pNSzNg004sVxNNt6wMs", "assetId": "nAWvgc029zxdlEViTBMtD8SwYp502ngJOS43qa6gWL9eE"}]'::jsonb,
       '2026-05-21 11:35:00+00', '2026-05-21 11:35:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM content_feed_posts
    WHERE title = 'Shaping in Grade 8 Pieces'
      AND created_at = '2026-05-21 11:35:00+00'
);

-- ── 5. INSERT "🎯 Weekly Practice Focus - 25th May 2026" ────────────────────────
INSERT INTO content_feed_posts (type, title, body, media, published_at, created_at)
SELECT 'post', '🎯 Weekly Practice Focus - 25th May 2026',
'This week: Learn to practise mistakes without repeating them

A large part of why mistakes keep returning is that many players unknowingly practise the mistake itself over and over again. However, improvement usually comes from isolating and reorganising the exact movements or thought processes that caused the issue in the first place, rather than unintentionally repeating the mistake again.

This week, try this: Find a place in your music where mistakes happen regularly (or a pattern that you keep getting wrong - a scale, arpeggio etc.). Instead of immediately replaying the whole section, stop and identify exactly what went wrong. Ask yourself:

• Was it a fingering problem?
• A rhythm problem?
• A jump?
• Tension?
• Not knowing the notes securely enough?
• Not knowing what the music is trying to do?

Then reduce the difficulty temporarily by:

• slowing it down
• isolating the mistake itself
• blocking chords
• simplifying the rhythm
• practising just the movement between two notes

Then, repeat the corrected version several times before returning to the full passage. Identifying what caused the mistake first will help you work out the best way of isolating and fixing the mistake.

By doing this, you may notice that difficult passages begin to feel far more reliable once you stop treating mistakes as random accidents and start treating them as specific problems that can be reorganised and solved.',
       '[]'::jsonb,
       '2026-05-25 07:12:00+00', '2026-05-25 07:12:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM content_feed_posts
    WHERE title = '🎯 Weekly Practice Focus - 25th May 2026'
      AND created_at = '2026-05-25 07:12:00+00'
);

COMMIT;
