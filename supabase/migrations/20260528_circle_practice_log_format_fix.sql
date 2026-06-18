-- ============================================================
-- Circle delta migration 2026-05-28 (practice log formatting fix)
--
-- One practice log (Daniel's Tuesday 26 May 5 min Air on the G String) was
-- imported with all content on a single line because the scraper fell back
-- to .post__title when .post__body was empty (a title-only Circle post).
-- The rest of practice_log rows use newline-separated sections:
--   <day date>  ·  <duration>
--
--   <activities>
--
--   <hashtags>
-- Reformat that one row to match.
-- ============================================================

UPDATE community_posts
SET content =
'Tuesday 26 May 2026  ·  5 min

🎹 Air on the G String (BWV 1068) — J.S. Bach — batches 4&5

#ThePracticeRoom #PianoPractice'
WHERE type = 'practice_log'
  AND email = 'danielduordoe@yahoo.co.uk'
  AND content = 'Tuesday 26 May 2026 · 5 min 🎹 Air on the G String (BWV 1068) — J.S. Bach — batches 4&5 #ThePracticeRoom #PianoPractice';
