-- ================================================================
-- Fix Michael Page's practice log posts: prepend date·duration header
-- Generated 2026-05-22
--
-- His Circle posts had no date/duration header in the body text,
-- only in the post slug. _parseCircleLogText requires the first
-- line to be 'Day DD Month YYYY  ·  Duration'.
-- Idempotent: WHERE NOT LIKE guard prevents double-prepending.
-- ================================================================

-- wednesday-13-may-2026-38-min
UPDATE community_posts
SET    content = 'Wednesday 13 May 2026  ·  38 min' || chr(10) || content
WHERE  email      = 'michaelpage05@hotmail.co.uk'
  AND  created_at = '2026-05-13 14:16:40.192+00'::timestamptz
  AND  content NOT LIKE 'Wednesday%';

-- tuesday-12-may-2026-43-min
UPDATE community_posts
SET    content = 'Tuesday 12 May 2026  ·  43 min' || chr(10) || content
WHERE  email      = 'michaelpage05@hotmail.co.uk'
  AND  created_at = '2026-05-12 11:47:06.847+00'::timestamptz
  AND  content NOT LIKE 'Tuesday%';

-- monday-11-may-2026-25-min
UPDATE community_posts
SET    content = 'Monday 11 May 2026  ·  25 min' || chr(10) || content
WHERE  email      = 'michaelpage05@hotmail.co.uk'
  AND  created_at = '2026-05-11 15:18:21.898+00'::timestamptz
  AND  content NOT LIKE 'Monday%';

-- friday-8-may-2026-35-min
UPDATE community_posts
SET    content = 'Friday 8 May 2026  ·  35 min' || chr(10) || content
WHERE  email      = 'michaelpage05@hotmail.co.uk'
  AND  created_at = '2026-05-08 15:13:30.964+00'::timestamptz
  AND  content NOT LIKE 'Friday%';

-- thursday-7-may-2026-48-min
UPDATE community_posts
SET    content = 'Thursday 7 May 2026  ·  48 min' || chr(10) || content
WHERE  email      = 'michaelpage05@hotmail.co.uk'
  AND  created_at = '2026-05-07 15:24:39.764+00'::timestamptz
  AND  content NOT LIKE 'Thursday%';

-- tuesday-5-may-2026-45-min
UPDATE community_posts
SET    content = 'Tuesday 5 May 2026  ·  45 min' || chr(10) || content
WHERE  email      = 'michaelpage05@hotmail.co.uk'
  AND  created_at = '2026-05-05 12:09:28.028+00'::timestamptz
  AND  content NOT LIKE 'Tuesday%';

-- sunday-26-april-2026-22-min
UPDATE community_posts
SET    content = 'Sunday 26 April 2026  ·  22 min' || chr(10) || content
WHERE  email      = 'michaelpage05@hotmail.co.uk'
  AND  created_at = '2026-04-26 17:34:21.148+00'::timestamptz
  AND  content NOT LIKE 'Sunday%';

-- friday-24-april-2026-18-min
UPDATE community_posts
SET    content = 'Friday 24 April 2026  ·  18 min' || chr(10) || content
WHERE  email      = 'michaelpage05@hotmail.co.uk'
  AND  created_at = '2026-04-24 14:30:09.078+00'::timestamptz
  AND  content NOT LIKE 'Friday%';

-- thursday-23-april-2026-24-min
UPDATE community_posts
SET    content = 'Thursday 23 April 2026  ·  24 min' || chr(10) || content
WHERE  email      = 'michaelpage05@hotmail.co.uk'
  AND  created_at = '2026-04-23 17:00:33.350+00'::timestamptz
  AND  content NOT LIKE 'Thursday%';

-- Skipped: my-practice-log (already has header in body)
