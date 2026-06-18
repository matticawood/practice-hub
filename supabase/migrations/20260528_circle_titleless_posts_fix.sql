-- ============================================================
-- Circle delta migration 2026-05-28 (title-less post fix-up)
--
-- Two ask-matt-anything posts were inserted with their full question body
-- duplicated into the `title` column because the scraper's title fallback
-- used the page <title> when no .post__title element was present. In Circle
-- these are title-less posts where the question text IS the body; the title
-- should be empty to match the convention used for similar posts.
-- The comments and likes on these posts (linked by post_id) are unaffected
-- by changing the title.
-- ============================================================

UPDATE community_posts
SET title = ''
WHERE id IN (
  'e80575c3-9122-4ae9-8a5a-34cf799ed5fc',   -- Tulika Dalavoy, "How important is it to be able to play hands..."
  '3545d016-6ae1-4866-9363-c766b0da5e34'    -- Connie Witzoe,  "Hi Matt. I was wondering if you have access to..."
);
