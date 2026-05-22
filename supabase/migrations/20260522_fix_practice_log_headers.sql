-- ================================================================
-- Fix practice log posts missing date/duration headers
-- Generated 2026-05-22
--
-- Root cause: many members' Circle posts didn't include a date/duration
-- header on the first line (required by _parseCircleLogText to render
-- as a structured card). Some posts also had empty content (image-only
-- or very short Circle posts where only the slug retains the info).
--
-- Members fixed:
--   Kelly Williams      — 8 posts (prepend header from slug)
--   Matthew Cawood      — 1 post  (prepend header from slug)
--   Larah Szemczak      — 1 post  (prepend header from slug)
--   Lucas França        — 1 post  (prepend header from slug)
--   Jonathan Arrow      — 2 posts (set content from slug, was empty)
--   Sonus Lucis         — 1 post  (set content from slug, was empty)
--   Wendy Grimshaw      — 1 post  (set content from slug, was empty)
--
-- All UPDATEs are idempotent (guard conditions prevent double-application).
-- ================================================================

-- ── Kelly Williams ──────────────────────────────────────────────

UPDATE community_posts
SET content = 'Thursday 7 May 2026  ·  40 min' || chr(10) || content
WHERE email = 'confi1@hotmail.com'
  AND created_at = '2026-05-07 16:51:19.964+00'::timestamptz
  AND content NOT LIKE 'Thursday%';

UPDATE community_posts
SET content = 'Wednesday 6 May 2026  ·  50 min' || chr(10) || content
WHERE email = 'confi1@hotmail.com'
  AND created_at = '2026-05-06 19:42:04.045+00'::timestamptz
  AND content NOT LIKE 'Wednesday%';

UPDATE community_posts
SET content = 'Monday 4 May 2026  ·  1h 20m' || chr(10) || content
WHERE email = 'confi1@hotmail.com'
  AND created_at = '2026-05-04 17:26:37.315+00'::timestamptz
  AND content NOT LIKE 'Monday%';

UPDATE community_posts
SET content = 'Friday 1 May 2026  ·  50 min' || chr(10) || content
WHERE email = 'confi1@hotmail.com'
  AND created_at = '2026-05-01 19:37:21.383+00'::timestamptz
  AND content NOT LIKE 'Friday%';

UPDATE community_posts
SET content = 'Monday 27 April 2026  ·  50 min' || chr(10) || content
WHERE email = 'confi1@hotmail.com'
  AND created_at = '2026-04-27 17:03:38.469+00'::timestamptz
  AND content NOT LIKE 'Monday%';

UPDATE community_posts
SET content = 'Friday 24 April 2026  ·  25 min' || chr(10) || content
WHERE email = 'confi1@hotmail.com'
  AND created_at = '2026-04-24 13:13:59.787+00'::timestamptz
  AND content NOT LIKE 'Friday%';

UPDATE community_posts
SET content = 'Thursday 23 April 2026  ·  50 min' || chr(10) || content
WHERE email = 'confi1@hotmail.com'
  AND created_at = '2026-04-23 16:44:18.631+00'::timestamptz
  AND content NOT LIKE 'Thursday%';

UPDATE community_posts
SET content = 'Wednesday 22 April 2026  ·  1h 20m' || chr(10) || content
WHERE email = 'confi1@hotmail.com'
  AND created_at = '2026-04-22 17:09:00.819+00'::timestamptz
  AND content NOT LIKE 'Wednesday%';

-- ── Matthew Cawood ───────────────────────────────────────────────

UPDATE community_posts
SET content = 'Monday 20 April 2026  ·  55 min' || chr(10) || content
WHERE email = 'matthew@matthewcawood.com'
  AND created_at = '2026-04-20 18:21:34.940+00'::timestamptz
  AND content NOT LIKE 'Monday%';

-- ── Larah Szemczak ───────────────────────────────────────────────

UPDATE community_posts
SET content = 'Wednesday 22 April 2026  ·  45 min' || chr(10) || content
WHERE email = 'larahnja@gmail.com'
  AND created_at = '2026-04-23 00:49:33.354+00'::timestamptz
  AND content NOT LIKE 'Wednesday%';

-- ── Lucas França ─────────────────────────────────────────────────

UPDATE community_posts
SET content = 'Wednesday 22 April 2026  ·  40 min' || chr(10) || content
WHERE email = 'lucas.fr6@gmail.com'
  AND created_at = '2026-04-22 23:12:04.534+00'::timestamptz
  AND content NOT LIKE 'Wednesday%';

-- ── Jonathan Arrow (empty posts — reconstruct from slug) ──────────

-- Saturday 9 May 2026  ·  40 min
-- slug: saturday-9-may-2026-40-min-sight-reading-a-and-intervals
UPDATE community_posts
SET content = 'Saturday 9 May 2026  ·  40 min' || chr(10) ||
              '👁 Sight-reading A and intervals' || chr(10) ||
              '#ThePracticeRoom #PianoPractice'
WHERE email = 'jonathan.arroyo@12yfilms.com'
  AND created_at = '2026-05-09 19:42:57.190+00'::timestamptz
  AND (content IS NULL OR content = '');

-- Tuesday 5 May 2026  ·  1h 30m
-- slug: tuesday-5-may-2026-1h-30m-sight-reading-c-and-am-scales-practiced-using-left-had-a-lot
UPDATE community_posts
SET content = 'Tuesday 5 May 2026  ·  1h 30m' || chr(10) ||
              '👁 Sight-reading C and Am scales — practiced using left hand a lot' || chr(10) ||
              '#ThePracticeRoom #PianoPractice'
WHERE email = 'jonathan.arroyo@12yfilms.com'
  AND created_at = '2026-05-06 13:25:44.053+00'::timestamptz
  AND (content IS NULL OR content = '');

-- ── Sonus Lucis (empty post — reconstruct from slug) ──────────────

-- Monday 27 April 2026  ·  25 min
-- slug: monday-27-april-2026-25-min-g-major-scale-actually-emin-left-hand-right-hand-
--       two-hands-two-hands-contrary-d-major-scale-...-a-gentle-breeze-first-page-hands-together-cont
UPDATE community_posts
SET content = 'Monday 27 April 2026  ·  25 min' || chr(10) ||
              '🎼 G major scale (actually Emin) — left hand, right hand, two hands, two hands contrary' || chr(10) ||
              '🎼 D major scale — left hand, right hand, two hands, two hands contrary' || chr(10) ||
              '🎹 A gentle breeze — first page, hands together' || chr(10) ||
              '#ThePracticeRoom #PianoPractice'
WHERE email = 'steve@sonuslucis.com'
  AND created_at = '2026-04-27 13:23:07.695+00'::timestamptz
  AND (content IS NULL OR content = '');

-- ── Wendy Grimshaw (empty post — reconstruct from slug) ───────────

-- Thursday 7 May 2026  ·  28 min
-- slug: thursday-7-may-2026-28-min-czerny-100-recreations-nr19-played-through-enjoying-feeling-
--       of-accomplishment-czerny-op-599-nr-19-played-through-duvernoy-voicing-study-getting-more-
--       fluid-now-fewer-mistakes-c-major-arpeggio-c-major
UPDATE community_posts
SET content = 'Thursday 7 May 2026  ·  28 min' || chr(10) ||
              '🎹 Czerny 100 Recreations No. 19 — played through, feeling of accomplishment' || chr(10) ||
              '🎹 Czerny Op. 599 No. 19 — played through' || chr(10) ||
              '🎼 Duvernoy voicing study — getting more fluid now, fewer mistakes' || chr(10) ||
              '🎼 C major arpeggio' || chr(10) ||
              '#ThePracticeRoom #PianoPractice'
WHERE email = 'wg33@live.co.uk'
  AND created_at = '2026-05-07 18:35:26.297+00'::timestamptz
  AND (content IS NULL OR content = '');
