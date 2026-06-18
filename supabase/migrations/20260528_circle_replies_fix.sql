-- ============================================================
-- Circle delta migration 2026-05-28 (replies + comment media fix)
-- ============================================================

BEGIN;

-- Section 1: Set parent_comment_id + reply_to_name on reply comments

UPDATE content_feed_comments
SET parent_comment_id = (
  SELECT id FROM content_feed_comments
  WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)
    AND email = 'danielduordoe@yahoo.co.uk' AND created_at = '2026-05-26 15:32:00+00' LIMIT 1
),
reply_to_name = 'Daniel Duordoe'
WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)
  AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-27 14:46:00+00'
  AND parent_comment_id IS NULL;
UPDATE content_feed_comments
SET parent_comment_id = (
  SELECT id FROM content_feed_comments
  WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)
    AND email = 'cecile.dautriat@gmail.com' AND created_at = '2026-05-26 20:59:00+00' LIMIT 1
),
reply_to_name = 'Cécile Dautriat'
WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)
  AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-27 14:46:00+00'
  AND parent_comment_id IS NULL;
UPDATE content_feed_comments
SET parent_comment_id = (
  SELECT id FROM content_feed_comments
  WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)
    AND email = 'confi1@hotmail.com' AND created_at = '2026-05-27 08:50:00+00' LIMIT 1
),
reply_to_name = 'Kelly Williams'
WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)
  AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-27 14:47:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1)
    AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-23 19:23:00+00' LIMIT 1
),
reply_to_name = 'Matthew Cawood'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1)
  AND email = 'cecile.dautriat@gmail.com' AND created_at = '2026-05-24 11:20:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1)
    AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-23 19:23:00+00' LIMIT 1
),
reply_to_name = 'Matthew Cawood'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1)
  AND email = 'cecile.dautriat@gmail.com' AND created_at = '2026-05-28 17:21:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 17:16:00+00' LIMIT 1)
    AND email = 'danielduordoe@yahoo.co.uk' AND created_at = '2026-05-20 04:58:00+00' LIMIT 1
),
reply_to_name = 'Daniel Duordoe'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 17:16:00+00' LIMIT 1)
  AND email = 'cecile.dautriat@gmail.com' AND created_at = '2026-05-20 16:50:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 17:16:00+00' LIMIT 1)
    AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-20 06:03:00+00' LIMIT 1
),
reply_to_name = 'Connie Witzoe'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 17:16:00+00' LIMIT 1)
  AND email = 'cecile.dautriat@gmail.com' AND created_at = '2026-05-20 16:58:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 17:16:00+00' LIMIT 1)
    AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-20 06:03:00+00' LIMIT 1
),
reply_to_name = 'Connie Witzoe'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 17:16:00+00' LIMIT 1)
  AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-20 17:04:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 17:16:00+00' LIMIT 1)
    AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-20 06:03:00+00' LIMIT 1
),
reply_to_name = 'Connie Witzoe'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 17:16:00+00' LIMIT 1)
  AND email = 'cecile.dautriat@gmail.com' AND created_at = '2026-05-21 16:52:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 17:16:00+00' LIMIT 1)
    AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-20 08:22:00+00' LIMIT 1
),
reply_to_name = 'Matthew Cawood'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 17:16:00+00' LIMIT 1)
  AND email = 'cecile.dautriat@gmail.com' AND created_at = '2026-05-20 17:07:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 17:16:00+00' LIMIT 1)
    AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-20 08:22:00+00' LIMIT 1
),
reply_to_name = 'Matthew Cawood'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 17:16:00+00' LIMIT 1)
  AND email = 'cecile.dautriat@gmail.com' AND created_at = '2026-05-21 17:04:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 17:16:00+00' LIMIT 1)
    AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-20 08:22:00+00' LIMIT 1
),
reply_to_name = 'Matthew Cawood'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 17:16:00+00' LIMIT 1)
  AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-22 11:10:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 13:55:00+00' LIMIT 1)
    AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-20 07:52:00+00' LIMIT 1
),
reply_to_name = 'Matthew Cawood'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 13:55:00+00' LIMIT 1)
  AND email = 'tdalavoy@gmail.com' AND created_at = '2026-05-20 14:09:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 13:55:00+00' LIMIT 1)
    AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-20 07:52:00+00' LIMIT 1
),
reply_to_name = 'Matthew Cawood'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 13:55:00+00' LIMIT 1)
  AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-21 05:57:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 13:55:00+00' LIMIT 1)
    AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-20 07:52:00+00' LIMIT 1
),
reply_to_name = 'Matthew Cawood'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 13:55:00+00' LIMIT 1)
  AND email = 'tdalavoy@gmail.com' AND created_at = '2026-05-21 07:17:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 04:26:00+00' LIMIT 1)
    AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-19 07:21:00+00' LIMIT 1
),
reply_to_name = 'Connie Witzoe'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 04:26:00+00' LIMIT 1)
  AND email = 'norman.jaillet@gmail.com' AND created_at = '2026-05-19 07:39:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 04:26:00+00' LIMIT 1)
    AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-19 07:21:00+00' LIMIT 1
),
reply_to_name = 'Connie Witzoe'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 04:26:00+00' LIMIT 1)
  AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-19 07:42:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 04:26:00+00' LIMIT 1)
    AND email = 'danielduordoe@yahoo.co.uk' AND created_at = '2026-05-19 08:33:00+00' LIMIT 1
),
reply_to_name = 'Daniel Duordoe'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 04:26:00+00' LIMIT 1)
  AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-19 08:40:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 04:26:00+00' LIMIT 1)
    AND email = 'danielduordoe@yahoo.co.uk' AND created_at = '2026-05-19 08:33:00+00' LIMIT 1
),
reply_to_name = 'Daniel Duordoe'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 04:26:00+00' LIMIT 1)
  AND email = 'danielduordoe@yahoo.co.uk' AND created_at = '2026-05-19 13:45:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 04:26:00+00' LIMIT 1)
    AND email = 'danielduordoe@yahoo.co.uk' AND created_at = '2026-05-19 08:33:00+00' LIMIT 1
),
reply_to_name = 'Daniel Duordoe'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 04:26:00+00' LIMIT 1)
  AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-19 15:28:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 04:26:00+00' LIMIT 1)
    AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-19 09:59:00+00' LIMIT 1
),
reply_to_name = 'Matthew Cawood'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 04:26:00+00' LIMIT 1)
  AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-19 10:17:00+00'
  AND parent_comment_id IS NULL;
UPDATE community_post_comments
SET parent_comment_id = (
  SELECT id FROM community_post_comments
  WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 04:26:00+00' LIMIT 1)
    AND email = 'cecile.dautriat@gmail.com' AND created_at = '2026-05-19 17:05:00+00' LIMIT 1
),
reply_to_name = 'Cécile Dautriat'
WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 04:26:00+00' LIMIT 1)
  AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-19 17:10:00+00'
  AND parent_comment_id IS NULL;

COMMIT;