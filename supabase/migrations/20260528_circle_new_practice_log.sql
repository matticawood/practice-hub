-- ============================================================
-- Circle delta migration 2026-05-28 (additional practice log)
--
-- Cécile Dautriat posted a new practice log between the earlier sweep
-- and now: "Thursday 28 May 2026 · 37 min" covering sight-reading,
-- note recognition, B natural minor scale, several pieces, and ear training.
--
-- created_at fixed to Thursday 28 May 2026 evening BST (the practice and
-- posting both happened on Thursday); the original insert above had the
-- scraper's ~22h skew that placed it on Wednesday night.
-- ============================================================

-- Repair the original mis-dated row if it exists.
UPDATE community_posts
SET created_at = '2026-05-28 19:00:00+00'
WHERE type = 'practice_log'
  AND email = 'cecile.dautriat@gmail.com'
  AND created_at = '2026-05-27 22:00:00+00'
  AND content LIKE 'Thursday 28 May 2026%37 min%Note recognition game%';

INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '',
'Thursday 28 May 2026  ·  37 min

👁 Sight-reading — Note recognition game

🎼 B natural minor scale

🎹 Arcade Game, Janet Gieck

   Where: 9-16 · Problem: learn notes · Fix: use passage fixer

🎹 Ne bois pas ton chocolat avec tes doigts, Éric

   Where: 21-26 · Problem: learn notes · Fix: use passage fixer

🎹 Etude in Dm, Cornelius Gurlitt — Record video

👂 Ear Training

   Where: RCM3 · Problem: melody playback · Fix: spot the same notes

#ThePracticeRoom #PianoPractice',
'[]'::jsonb, '2026-05-28 19:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts
  WHERE type = 'practice_log'
    AND email = 'cecile.dautriat@gmail.com'
    AND content LIKE 'Thursday 28 May 2026%37 min%Note recognition game%'
);
