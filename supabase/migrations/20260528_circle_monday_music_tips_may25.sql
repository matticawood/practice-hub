-- ============================================================
-- Circle delta migration 2026-05-28 (Monday Music Tips - 25th May 2026)
--
-- Adds the missing May 25 Monday Music Tips blog row, matching the format
-- the recent entries use (title = article name, body = empty, bullets in
-- media jsonb so _blogBody renders the "In this week's article:" list).
-- ============================================================

INSERT INTO content_feed_posts (type, title, body, url, media, published_at, created_at)
SELECT
  'blog',
  'Why You Can Play a Piece Better Some Days Than Others',
  '',
  'https://www.matthewcawood.com/monday-music-tips/why-you-can-play-a-piece-better-some-days-than-others',
  '[
    {
      "type": "bullets",
      "items": [
        "Why your playing can suddenly feel worse overnight",
        "The difference between losing skill and losing access to it",
        "How to still make progress on \"off days\""
      ]
    }
  ]'::jsonb,
  '2026-05-25 09:00:00+00',
  '2026-05-25 09:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM content_feed_posts
  WHERE type = 'blog'
    AND title = 'Why You Can Play a Piece Better Some Days Than Others'
);
