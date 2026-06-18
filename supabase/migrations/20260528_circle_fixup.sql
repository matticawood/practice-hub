-- ============================================================
-- Circle delta migration 2026-05-28 (FIXUP)
-- Adds: 18 practice logs, 2 missed ask-matt questions, all post likes,
--      and any newly-discovered comments. Apply this BEFORE
--      20260528_circle_admin_posts_move.sql.
-- ============================================================

BEGIN;

-- ── Section 1: Missed ask-matt-anything posts ───────────────────────────

INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'tdalavoy@gmail.com', 'Tulika Dalavoy', 'question', 'How important is it to be able to play hands separately after I learn the coordination in a piece? I often find it difficult to play hands separately after I have practiced hands together for a while. Does this somehow impact muscle memory or my abilit...', 'How important is it to be able to play hands separately after I learn the coordination in a piece? I often find it difficult to play hands separately after I have practiced hands together for a while. Does this somehow impact muscle memory or my ability to perform a piece? Turkish March is a typical example.', '[]'::jsonb, '2026-05-24 03:17:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE title = 'How important is it to be able to play hands separately after I learn the coordination in a piece? I often find it difficult to play hands separately after I have practiced hands together for a while. Does this somehow impact muscle memory or my abilit...' AND created_at = '2026-05-24 03:17:00+00'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'question', 'Hi Matt. I was wondering if you have access to the sheet music for Etude no. 3: Ballade by Marie Awadis? I came across it tonight and I would love to learn it.', 'Hi Matt. I was wondering if you have access to the sheet music for Etude no. 3: Ballade by Marie Awadis? I came across it tonight and I would love to learn it.', '[]'::jsonb, '2026-05-22 18:28:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE title = 'Hi Matt. I was wondering if you have access to the sheet music for Etude no. 3: Ballade by Marie Awadis? I came across it tonight and I would love to learn it.' AND created_at = '2026-05-22 18:28:00+00'
);

-- ── Section 2: Practice log posts ───────────────────────────────────────

INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Friday 29 May 2026  ·  7 min

🎹 Air on the G String (BWV 1068) — J.S. Bach — Batches 1, 4 and 6

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-27 22:23:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'danielduordoe@yahoo.co.uk' AND content = 'Friday 29 May 2026  ·  7 min

🎹 Air on the G String (BWV 1068) — J.S. Bach — Batches 1, 4 and 6

#ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Thursday 28 May 2026  ·  20 min

🎹 Vivaldi Variation, Florian Christl — Played through a few times

🎹 Passacaglia, Händel — Played through a couple of times

🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Played through what I''ve learned so far

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-27 22:17:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'connieuitsu@gmail.com' AND content = 'Thursday 28 May 2026  ·  20 min

🎹 Vivaldi Variation, Florian Christl — Played through a few times

🎹 Passacaglia, Händel — Played through a couple of times

🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Played through what I''ve learned so far

#ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Thursday 28 May 2026  ·  20 min

📚 PwJ - 10 Lessons blues challenge — Lesson 5

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-27 22:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'danielduordoe@yahoo.co.uk' AND content = 'Thursday 28 May 2026  ·  20 min

📚 PwJ - 10 Lessons blues challenge — Lesson 5

#ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Thursday 28 May 2026  ·  35 min

📚 TB - Music theory basics — Module 5 — Circle of fifths

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-27 22:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'danielduordoe@yahoo.co.uk' AND content = 'Thursday 28 May 2026  ·  35 min

📚 TB - Music theory basics — Module 5 — Circle of fifths

#ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Wednesday 27 May 2026  ·  10 min

🎹 Vivaldi Variation, Florian Christl — Played through twice

🎹 Passacaglia, Händel — Played through twice

Notes: No time to practice because of work, getting home late, etc etc etc. · Noticed that my Roland is making a strange humming/electric-like sound when I played tonight. I don''t know if it''s always been there and I just haven''t noticed, or if something''s wrong with it..

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-26 23:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'connieuitsu@gmail.com' AND content = 'Wednesday 27 May 2026  ·  10 min

🎹 Vivaldi Variation, Florian Christl — Played through twice

🎹 Passacaglia, Händel — Played through twice

Notes: No time to practice because of work, getting home late, etc etc etc. · Noticed that my Roland is making a strange humming/electric-like sound when I played tonight. I don''t know if it''s always been there and I just haven''t noticed, or if something''s wrong with it..

#ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Thursday 28 May 2026  ·  10 min

🎹 Air on the G String (BWV 1068) — J.S. Bach — Batches 1, 4 and 6

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-26 23:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'danielduordoe@yahoo.co.uk' AND content = 'Thursday 28 May 2026  ·  10 min

🎹 Air on the G String (BWV 1068) — J.S. Bach — Batches 1, 4 and 6

#ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Wednesday 27 May 2026  ·  50 min

📚 TB - Music theory basics — Module 4 — Passive tutorial - minor & other modes

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-26 23:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'danielduordoe@yahoo.co.uk' AND content = 'Wednesday 27 May 2026  ·  50 min

📚 TB - Music theory basics — Module 4 — Passive tutorial - minor & other modes

#ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', 'Tuesday 26 May 2026  ·  40 min

👁 Sight-reading

🎼 D major scale, B natural minor scale

🎹 Arcade Game, Janet Gieck

   Where: 5-8 · Problem: learn notes · Fix: use passage fixer

🎹 Ne bois pas ton chocolat avec tes doigts, Éric

   Where: 21-26 · Problem: learn notes · Fix: use passage fixer

🎹 Etude in Dm, Cornelius Gurlitt

   RH chords · LH louder, not EVERYTHING louder

👂 Ear Training — RCM3

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-25 23:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'cecile.dautriat@gmail.com' AND content = 'Tuesday 26 May 2026  ·  40 min

👁 Sight-reading

🎼 D major scale, B natural minor scale

🎹 Arcade Game, Janet Gieck

   Where: 5-8 · Problem: learn notes · Fix: use passage fixer

🎹 Ne bois pas ton chocolat avec tes doigts, Éric

   Where: 21-26 · Problem: learn notes · Fix: use passage fixer

🎹 Etude in Dm, Cornelius Gurlitt

   RH chords · LH louder, not EVERYTHING louder

👂 Ear Training — RCM3

#ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Tuesday 26 May 2026  ·  2h 5m

🎹 Vivaldi Variation, Florian Christl

   Played through several times throughout the day, and tried to record it tonight but couldn''t play it without making any mistakes, so the recording will have to wait.

🎹 Passacaglia, Händel

   Also tried recording this one tonight, but again, couldn''t without making mistakes so this one will also have to wait

🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — 1st movement (Op. 27, No. 2) — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through a couple of times

🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Same as before

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-25 23:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'connieuitsu@gmail.com' AND content = 'Tuesday 26 May 2026  ·  2h 5m

🎹 Vivaldi Variation, Florian Christl

   Played through several times throughout the day, and tried to record it tonight but couldn''t play it without making any mistakes, so the recording will have to wait.

🎹 Passacaglia, Händel

   Also tried recording this one tonight, but again, couldn''t without making mistakes so this one will also have to wait

🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — 1st movement (Op. 27, No. 2) — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through a couple of times

🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Same as before

#ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Tuesday 26 May 2026 · 5 min 🎹 Air on the G String (BWV 1068) — J.S. Bach — batches 4&5 #ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-25 23:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'danielduordoe@yahoo.co.uk' AND content = 'Tuesday 26 May 2026 · 5 min 🎹 Air on the G String (BWV 1068) — J.S. Bach — batches 4&5 #ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Monday 25 May 2026  ·  2h

🎹 Vivaldi Variation, Florian Christl — More polishing

🎹 Passacaglia, Händel — Played through quite a few times

🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through twice

🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Same bars

👂 Ear Training

   Marie Awadis'' Ballade- sounds like the chords have more notes in them than I thought, been missing the middle key in the chords. Really hard to hear it all so I feel like it''s a lot of guesswork and I just go for what hears and feels right.

Notes: Forgot to post this yesterday

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-24 23:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'connieuitsu@gmail.com' AND content = 'Monday 25 May 2026  ·  2h

🎹 Vivaldi Variation, Florian Christl — More polishing

🎹 Passacaglia, Händel — Played through quite a few times

🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through twice

🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Same bars

👂 Ear Training

   Marie Awadis'' Ballade- sounds like the chords have more notes in them than I thought, been missing the middle key in the chords. Really hard to hear it all so I feel like it''s a lot of guesswork and I just go for what hears and feels right.

Notes: Forgot to post this yesterday

#ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Monday 25 May 2026  ·  45 min

📚 TB - Music theory basics — Module 3

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-24 23:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'danielduordoe@yahoo.co.uk' AND content = 'Monday 25 May 2026  ·  45 min

📚 TB - Music theory basics — Module 3

#ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', 'Sunday 24 May 2026  ·  1h 5m

🎹 Sonatina in C major (Op. 36, No. 1) — 1st movement — 1st movement — Muzio Clementi

   ANDANTE 80 BPM not super fluent and musical but getting there. · ANDANTE no metronome yet. · Bars 1-8 both hands · The trill on bar 3 needs extra attention

🎹 Sonatina in G major (Anh. 5, No. 1) — Ludwig van Beethoven

   Both parts, much better · 70 bpm

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-23 23:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'lucaskinzo@hotmail.com' AND content = 'Sunday 24 May 2026  ·  1h 5m

🎹 Sonatina in C major (Op. 36, No. 1) — 1st movement — 1st movement — Muzio Clementi

   ANDANTE 80 BPM not super fluent and musical but getting there. · ANDANTE no metronome yet. · Bars 1-8 both hands · The trill on bar 3 needs extra attention

🎹 Sonatina in G major (Anh. 5, No. 1) — Ludwig van Beethoven

   Both parts, much better · 70 bpm

#ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Sunday 24 May 2026  ·  30 min

🎹 TB - Music Theory Basics — Passive tutorial - Modules 1 & 2

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-23 23:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'danielduordoe@yahoo.co.uk' AND content = 'Sunday 24 May 2026  ·  30 min

🎹 TB - Music Theory Basics — Passive tutorial - Modules 1 & 2

#ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Sunday 24 May 2026  ·  2h

🎹 Vivaldi Variation, Florian Christl — Polishing to record soon

🎹 Passacaglia, Händel — Played through several times throughout the day

🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through a couple of times

🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Played through same bars. Haven''t moved on with this one for a while....

👂 Ear Training — Continued working on Marie Awadis'' Étude no. 3: Ballade

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-23 23:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'connieuitsu@gmail.com' AND content = 'Sunday 24 May 2026  ·  2h

🎹 Vivaldi Variation, Florian Christl — Polishing to record soon

🎹 Passacaglia, Händel — Played through several times throughout the day

🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through a couple of times

🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Played through same bars. Haven''t moved on with this one for a while....

👂 Ear Training — Continued working on Marie Awadis'' Étude no. 3: Ballade

#ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', 'Saturday 23 May 2026  ·  52 min

👁 Sight-reading — Prep A 80bpm

🎹 Etude in Dm, Cornelius Gurlitt

   Where: 1-end · Problem: RH evenness · Fix: record video

🎹 Impertinence, G. F. Handel

   Where: 1-end · Problem: trills · Fix: play with the right starting note

🎹 Razzle Dazzle, Ailbhe McDonagh

   Where: 1-end · Problem: rhythm shifts · Fix: use passage fixer

👂 Ear Training — RCM3

🎹 Arcade Game, Janet Gieck

   Where: 13-16 · Problem: learn notes · Fix: use passage fixer

🎹 Ne bois pas ton chocolat avec tes doigts, Éric

   Where: 14-20 · Problem: learn notes · Fix: use passage fixer

🎵 Improvisation — C scale

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-22 23:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'cecile.dautriat@gmail.com' AND content = 'Saturday 23 May 2026  ·  52 min

👁 Sight-reading — Prep A 80bpm

🎹 Etude in Dm, Cornelius Gurlitt

   Where: 1-end · Problem: RH evenness · Fix: record video

🎹 Impertinence, G. F. Handel

   Where: 1-end · Problem: trills · Fix: play with the right starting note

🎹 Razzle Dazzle, Ailbhe McDonagh

   Where: 1-end · Problem: rhythm shifts · Fix: use passage fixer

👂 Ear Training — RCM3

🎹 Arcade Game, Janet Gieck

   Where: 13-16 · Problem: learn notes · Fix: use passage fixer

🎹 Ne bois pas ton chocolat avec tes doigts, Éric

   Where: 14-20 · Problem: learn notes · Fix: use passage fixer

🎵 Improvisation — C scale

#ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Saturday 23 May 2026  ·  1h 40m

👂 Ear Training

   Managed to learn the first minute and 15 seconds of Marie Awadis'' Étude No. 3: Ballade. :)

🎹 Vivaldi Variation, Florian Christl — Polishing work

🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Played through same bars again

🎹 Passacaglia, Händel — Played through a few times

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-22 23:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'connieuitsu@gmail.com' AND content = 'Saturday 23 May 2026  ·  1h 40m

👂 Ear Training

   Managed to learn the first minute and 15 seconds of Marie Awadis'' Étude No. 3: Ballade. :)

🎹 Vivaldi Variation, Florian Christl — Polishing work

🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Played through same bars again

🎹 Passacaglia, Händel — Played through a few times

#ThePracticeRoom #PianoPractice'
);
INSERT INTO community_posts (email, name, type, title, content, media, created_at)
SELECT 'wg33@live.co.uk', 'Wendy Grimshaw', 'practice_log', '', 'Saturday 23 May 2026  ·  1h

🎹 Clementi Arietta op42 nr 5 — Hands together, phrasing and articulation

🎹 No. 13 from 24 Pieces for Children, Op. 39: Waltz — Dmitri Kabalevsky — Whole piece, phrasing and trying to get the waltz feeling

#ThePracticeRoom #PianoPractice', '[]'::jsonb, '2026-05-22 23:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts WHERE type = 'practice_log' AND email = 'wg33@live.co.uk' AND content = 'Saturday 23 May 2026  ·  1h

🎹 Clementi Arietta op42 nr 5 — Hands together, phrasing and articulation

🎹 No. 13 from 24 Pieces for Children, Op. 39: Waltz — Dmitri Kabalevsky — Whole piece, phrasing and trying to get the waltz feeling

#ThePracticeRoom #PianoPractice'
);

-- ── Section 3: Likes on member-authored posts ──────────────────────────

INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE title = 'How important is it to be able to play hands separately after I learn the coordination in a piece? I often find it difficult to play hands separately after I have practiced hands together for a while. Does this somehow impact muscle memory or my abilit...' AND created_at = '2026-05-24 03:17:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'tarthurfarrell@gmail.com' FROM community_posts
WHERE title = 'How important is it to be able to play hands separately after I learn the coordination in a piece? I often find it difficult to play hands separately after I have practiced hands together for a while. Does this somehow impact muscle memory or my abilit...' AND created_at = '2026-05-24 03:17:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE title = 'Harmonic analysis' AND created_at = '2026-05-22 21:26:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE title = 'Hi Matt. I was wondering if you have access to the sheet music for Etude no. 3: Ballade by Marie Awadis? I came across it tonight and I would love to learn it.' AND created_at = '2026-05-22 18:28:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE title = 'Question' AND created_at = '2026-05-21 14:49:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'cecile.dautriat@gmail.com' FROM community_posts
WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'danielduordoe@yahoo.co.uk' FROM community_posts
WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'gnpedgar@yahoo.com' FROM community_posts
WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'tdalavoy@gmail.com' FROM community_posts
WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'cecile.dautriat@gmail.com' FROM community_posts
WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'connieuitsu@gmail.com' FROM community_posts
WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'danielduordoe@yahoo.co.uk' FROM community_posts
WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'confi1@hotmail.com' FROM community_posts
WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'gnpedgar@yahoo.com' FROM community_posts
WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'tdalavoy@gmail.com' FROM community_posts
WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'cecile.dautriat@gmail.com' FROM community_posts
WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'connieuitsu@gmail.com' FROM community_posts
WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'danielduordoe@yahoo.co.uk' FROM community_posts
WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'confi1@hotmail.com' FROM community_posts
WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'gnpedgar@yahoo.com' FROM community_posts
WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'connieuitsu@gmail.com' FROM community_posts
WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'confi1@hotmail.com' FROM community_posts
WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'norman.jaillet@gmail.com' FROM community_posts
WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'connieuitsu@gmail.com' FROM community_posts
WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'confi1@hotmail.com' FROM community_posts
WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'norman.jaillet@gmail.com' FROM community_posts
WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'tdalavoy@gmail.com' FROM community_posts
WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'wg33@live.co.uk' FROM community_posts
WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'cecile.dautriat@gmail.com' FROM community_posts
WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'connieuitsu@gmail.com' FROM community_posts
WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'norman.jaillet@gmail.com' FROM community_posts
WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'wg33@live.co.uk' FROM community_posts
WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'cecile.dautriat@gmail.com' FROM community_posts
WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'danielduordoe@yahoo.co.uk' FROM community_posts
WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'norman.jaillet@gmail.com' FROM community_posts
WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'shaun.purbrick@gmail.com' FROM community_posts
WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'tdalavoy@gmail.com' FROM community_posts
WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'connieuitsu@gmail.com' FROM community_posts
WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'danielduordoe@yahoo.co.uk' FROM community_posts
WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'confi1@hotmail.com' FROM community_posts
WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'gnpedgar@yahoo.com' FROM community_posts
WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE type = 'practice_log' AND email = 'connieuitsu@gmail.com' AND content = 'Wednesday 27 May 2026  ·  10 min

🎹 Vivaldi Variation, Florian Christl — Played through twice

🎹 Passacaglia, Händel — Played through twice

Notes: No time to practice because of work, getting home late, etc etc etc. · Noticed that my Roland is making a strange humming/electric-like sound when I played tonight. I don''t know if it''s always been there and I just haven''t noticed, or if something''s wrong with it..

#ThePracticeRoom #PianoPractice'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE type = 'practice_log' AND email = 'danielduordoe@yahoo.co.uk' AND content = 'Thursday 28 May 2026  ·  10 min

🎹 Air on the G String (BWV 1068) — J.S. Bach — Batches 1, 4 and 6

#ThePracticeRoom #PianoPractice'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE type = 'practice_log' AND email = 'danielduordoe@yahoo.co.uk' AND content = 'Wednesday 27 May 2026  ·  50 min

📚 TB - Music theory basics — Module 4 — Passive tutorial - minor & other modes

#ThePracticeRoom #PianoPractice'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE type = 'practice_log' AND email = 'cecile.dautriat@gmail.com' AND content = 'Tuesday 26 May 2026  ·  40 min

👁 Sight-reading

🎼 D major scale, B natural minor scale

🎹 Arcade Game, Janet Gieck

   Where: 5-8 · Problem: learn notes · Fix: use passage fixer

🎹 Ne bois pas ton chocolat avec tes doigts, Éric

   Where: 21-26 · Problem: learn notes · Fix: use passage fixer

🎹 Etude in Dm, Cornelius Gurlitt

   RH chords · LH louder, not EVERYTHING louder

👂 Ear Training — RCM3

#ThePracticeRoom #PianoPractice'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE type = 'practice_log' AND email = 'connieuitsu@gmail.com' AND content = 'Tuesday 26 May 2026  ·  2h 5m

🎹 Vivaldi Variation, Florian Christl

   Played through several times throughout the day, and tried to record it tonight but couldn''t play it without making any mistakes, so the recording will have to wait.

🎹 Passacaglia, Händel

   Also tried recording this one tonight, but again, couldn''t without making mistakes so this one will also have to wait

🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — 1st movement (Op. 27, No. 2) — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through a couple of times

🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Same as before

#ThePracticeRoom #PianoPractice'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE type = 'practice_log' AND email = 'danielduordoe@yahoo.co.uk' AND content = 'Tuesday 26 May 2026 · 5 min 🎹 Air on the G String (BWV 1068) — J.S. Bach — batches 4&5 #ThePracticeRoom #PianoPractice'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE type = 'practice_log' AND email = 'connieuitsu@gmail.com' AND content = 'Monday 25 May 2026  ·  2h

🎹 Vivaldi Variation, Florian Christl — More polishing

🎹 Passacaglia, Händel — Played through quite a few times

🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through twice

🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Same bars

👂 Ear Training

   Marie Awadis'' Ballade- sounds like the chords have more notes in them than I thought, been missing the middle key in the chords. Really hard to hear it all so I feel like it''s a lot of guesswork and I just go for what hears and feels right.

Notes: Forgot to post this yesterday

#ThePracticeRoom #PianoPractice'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE type = 'practice_log' AND email = 'danielduordoe@yahoo.co.uk' AND content = 'Monday 25 May 2026  ·  45 min

📚 TB - Music theory basics — Module 3

#ThePracticeRoom #PianoPractice'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE type = 'practice_log' AND email = 'lucaskinzo@hotmail.com' AND content = 'Sunday 24 May 2026  ·  1h 5m

🎹 Sonatina in C major (Op. 36, No. 1) — 1st movement — 1st movement — Muzio Clementi

   ANDANTE 80 BPM not super fluent and musical but getting there. · ANDANTE no metronome yet. · Bars 1-8 both hands · The trill on bar 3 needs extra attention

🎹 Sonatina in G major (Anh. 5, No. 1) — Ludwig van Beethoven

   Both parts, much better · 70 bpm

#ThePracticeRoom #PianoPractice'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE type = 'practice_log' AND email = 'danielduordoe@yahoo.co.uk' AND content = 'Sunday 24 May 2026  ·  30 min

🎹 TB - Music Theory Basics — Passive tutorial - Modules 1 & 2

#ThePracticeRoom #PianoPractice'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE type = 'practice_log' AND email = 'connieuitsu@gmail.com' AND content = 'Sunday 24 May 2026  ·  2h

🎹 Vivaldi Variation, Florian Christl — Polishing to record soon

🎹 Passacaglia, Händel — Played through several times throughout the day

🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through a couple of times

🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Played through same bars. Haven''t moved on with this one for a while....

👂 Ear Training — Continued working on Marie Awadis'' Étude no. 3: Ballade

#ThePracticeRoom #PianoPractice'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE type = 'practice_log' AND email = 'cecile.dautriat@gmail.com' AND content = 'Saturday 23 May 2026  ·  52 min

👁 Sight-reading — Prep A 80bpm

🎹 Etude in Dm, Cornelius Gurlitt

   Where: 1-end · Problem: RH evenness · Fix: record video

🎹 Impertinence, G. F. Handel

   Where: 1-end · Problem: trills · Fix: play with the right starting note

🎹 Razzle Dazzle, Ailbhe McDonagh

   Where: 1-end · Problem: rhythm shifts · Fix: use passage fixer

👂 Ear Training — RCM3

🎹 Arcade Game, Janet Gieck

   Where: 13-16 · Problem: learn notes · Fix: use passage fixer

🎹 Ne bois pas ton chocolat avec tes doigts, Éric

   Where: 14-20 · Problem: learn notes · Fix: use passage fixer

🎵 Improvisation — C scale

#ThePracticeRoom #PianoPractice'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE type = 'practice_log' AND email = 'connieuitsu@gmail.com' AND content = 'Saturday 23 May 2026  ·  1h 40m

👂 Ear Training

   Managed to learn the first minute and 15 seconds of Marie Awadis'' Étude No. 3: Ballade. :)

🎹 Vivaldi Variation, Florian Christl — Polishing work

🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Played through same bars again

🎹 Passacaglia, Händel — Played through a few times

#ThePracticeRoom #PianoPractice'
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO community_post_likes (post_id, email)
SELECT id, 'matthew@matthewcawood.com' FROM community_posts
WHERE type = 'practice_log' AND email = 'wg33@live.co.uk' AND content = 'Saturday 23 May 2026  ·  1h

🎹 Clementi Arietta op42 nr 5 — Hands together, phrasing and articulation

🎹 No. 13 from 24 Pieces for Children, Op. 39: Waltz — Dmitri Kabalevsky — Whole piece, phrasing and trying to get the waltz feeling

#ThePracticeRoom #PianoPractice'
ON CONFLICT (post_id, email) DO NOTHING;

-- ── Section 4: Comments on missed ask-matt-anything posts ──────────────

INSERT INTO community_post_comments (post_id, email, name, content, created_at)
SELECT id, 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Tulika! It''s not a massive problem; however that might mean that you are relying more on one type of memory, which is muscle memory. If you find it difficult to play with just one hand having learnt it with hands together, then that means that the music isn''t secure enough without relying on the other hand. Typically I don''t necessarily advise learning things hand separately unless there is a specific problem that only applies to one hand and taking out the other hand away isn''t going to cause more problems when you try to put the hands back together. Instead what I would suggest is starting at random points within the music, maybe on beat two of the bar or something like that so that you are having to start in different places. This means that you have to think about exactly where you are and what you''ve got to play at the time. Also thinking about exactly what chord is being played at the time or if there are any particular features of the music that are recognisable. Perhaps a scale pattern, an arpeggio pattern, or maybe an accidental. Layering on top these forms of memory will help you to more fully understand the bar and it will make it much easier to play with just one hand if needed. Also just generally doing a lot of sight reading practice can help. This is because you have to learn to read different rhythms on the spot and that can make it much easier to read hands separately because playing a single hand essentially becomes a miniature sight reading exercise (for the rhythm at least), because the music will feel a little alien when you take one hand out of context. For the Turkish March specifically the left hand is playing chords and the right hand is frequently playing more scale type ideas. If you can work out what those scales are and you know which chord is being played in the left hand and how those scale notes relate to the chord that you''re playing (are some of those scale notes from the chord, for example?), then it can become a lot easier to play the right hand on its own because you''re not thinking about it just in terms of which movements your fingers have to make, but more, how those notes relate to the music as a whole. So to more directly answer your question, being able to play hands separately is not important by itself. But not being able to play hands separately might highlight some weaknesses in either the way that you are learning some pieces (for example not thinking about the broader shapes in the music: scales, chords…), or it might suggest that you might benefit from doing some more rhythm sight reading so that you have a better chance at being able to sight read one hand on its own when it doesn''t have the context of the other hand with it.', '2026-05-24 19:22:00+00'
FROM community_posts WHERE title = 'How important is it to be able to play hands separately after I learn the coordination in a piece? I often find it difficult to play hands separately after I have practiced hands together for a while. Does this somehow impact muscle memory or my abilit...' AND created_at = '2026-05-24 03:17:00+00'
AND NOT EXISTS (
  SELECT 1 FROM community_post_comments
  WHERE email = 'matthew@matthewcawood.com' AND created_at = '2026-05-24 19:22:00+00'
);
INSERT INTO community_post_comments (post_id, email, name, content, created_at)
SELECT id, 'tdalavoy@gmail.com', 'Tulika Dalavoy', 'Matthew Cawood Hi Matt. Thanks for your suggestions. Sight reading practice is on top of my list to start right now. Just to clarify, the goal is always to play hands together. Most teachers here recommend learning new sections hands separately first and then putting them together. This is how I have been used to learning. But after I have practiced hands together for a while when I am asked to play hands separately maybe to address a specific issue, I find it difficult to play. I may remember the notes but I can''t get the fingering right because my fingers only remember the coordinated movements. Regarding memory I mostly use muscle and visual memory as I am able to remember the positions of keys I need to play and the chord shapes. I am able to understand the chord structure to some extent where there are major and minor chords and maybe 7th chords but I have difficulty with recognising inversions. Turkish March and Moonlight Sonata have lots of chord inversions and I made note of some of them in the beginning but don''t remember them now as it does not appear to help with the playing. It may take me more than a few seconds to figure out the notes in the inversion of a 7th or dominant 7th chord. If you can suggest any way to recognize inversions other than the ones for simple triads that will be very helpful.', '2026-05-25 09:31:00+00'
FROM community_posts WHERE title = 'How important is it to be able to play hands separately after I learn the coordination in a piece? I often find it difficult to play hands separately after I have practiced hands together for a while. Does this somehow impact muscle memory or my abilit...' AND created_at = '2026-05-24 03:17:00+00'
AND NOT EXISTS (
  SELECT 1 FROM community_post_comments
  WHERE email = 'tdalavoy@gmail.com' AND created_at = '2026-05-25 09:31:00+00'
);
INSERT INTO community_post_comments (post_id, email, name, content, created_at)
SELECT id, 'matthew@matthewcawood.com', 'Matthew Cawood', 'Tulika Dalavoy That''s no problem. I know that many teachers do suggest learning hands separately. However if you learn hands separately as the default then, you need to learn one hand, you have to learn the other hand, and then you have to learn hands together, which takes much longer, it can prevent you from seeing the larger idea (the chord, or an arpeggio across hands for example) and then you still need to learn it again hands together for the coordination. Whereas if you learn hands together from the start, you can see how both hands are creating the chords. You can also coordinate the hands much more easily. I don''t think there''s a problem with learning hands separately if it''s used intentionally, so if there is a specific problem in one hand then sometimes it can be useful to isolate that problem by just playing that one hand. However I don''t think it should be the default. It should be used as a particular way of solving a specific problem. When you say that your fingers only remember the coordinated movement, that confirms that you are probably more likely relying too heavily on muscle memory and that your hands will just play the notes. Having good muscle memory is not a bad thing at all but it does mean if you then try to separate your hands, it becomes unfamiliar again (which sounds like what you are experiencing). This is where that chord recognition and more specifically instant chord recognition in a piece of music comes into play. When you say it doesn''t appear to help with the playing, that might be because that chord recognition isn''t instant yet (it’s currently easier to let your hands remember the notes than it is to recognise the chord). Once chord recognition becomes instant and you can also predict the chords then it becomes a much more reliable source of memory and this will help that playing hand separately issue. The best way to get to a place where you can recognise chords instantly is just to keep analysing them for every piece that you play. The more times you see the same chords appear when you''re playing a piece in the same key, the better, because eventually your brain will know the pattern and you will be able to predict which chords are going to show up and you will be able to see how those notes form the chord instantly. For recognising inversions specifically, this comes from thinking about the chord as the notes that are contained within that chord. A chord is really a bucket of notes. For example in the bucket of a G major chord it contains the notes B, D, and G. It doesn''t matter in a piece of music what order those notes appear or how many times each of those notes is played. So when you are analysing a piece of music and trying to work out what a chord is, the game is really to try and unjumble those notes so that you''ve only got one of each and then try to decipher what chord that actually is. I''m actually producing another game for the practice tools at the moment that is going to help with this exact thing. However the best long-term way of fixing this is to keep analysing each of the chords that you come across in a piece of music until you know what chords are most likely to come up. Recognising root position, first inversion, and second inversion will become much easier once you can recognise the chord no matter how many repeated notes there are or no matter what order those notes are in because you''re seeing a collection of notes that fit within the bucket of a certain chord and that chord is a chord that you can predict anyway from the key that you''re playing in and the surrounding chords. For example if I am playing in the key of G major and I see that one of the chords has an F sharp in it, to me that chord is more likely to be a D major chord, which is chord 5 in the key of G. The second most likely chord it could be is a B minor chord, which is chord number 3. The third most likely chord it could be is an F sharp chord, which is called number 7. So just from seeing one single note that is within the chord we can start to predict, based on the information we have about the piece of music, as to what that chord actually is. Then as you start to read other notes, it will either confirm the chord or it will change your opinion about what it could be. So the aim of analysing chords is not simply to understand what the chord is but it''s so that you see those patterns so many times that you are able to predict the music. Without working out the chords, you you don''t have the opportunity to start recognising those patterns (even if right now it doesn’t feel like it is helping you play the piece). Working them out again when you forget is also great for reinforcement and making that bar particularly sticky in the memory which will help with the hands separately issue too. 😀', '2026-05-25 10:08:00+00'
FROM community_posts WHERE title = 'How important is it to be able to play hands separately after I learn the coordination in a piece? I often find it difficult to play hands separately after I have practiced hands together for a while. Does this somehow impact muscle memory or my abilit...' AND created_at = '2026-05-24 03:17:00+00'
AND NOT EXISTS (
  SELECT 1 FROM community_post_comments
  WHERE email = 'matthew@matthewcawood.com' AND created_at = '2026-05-25 10:08:00+00'
);
INSERT INTO community_post_comments (post_id, email, name, content, created_at)
SELECT id, 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hi Connie, I’m not with a piano this weekend so my demonstration is somewhat lacking. Alas, maybe try this:', '2026-05-23 12:22:00+00'
FROM community_posts WHERE title = 'Hi Matt. I was wondering if you have access to the sheet music for Etude no. 3: Ballade by Marie Awadis? I came across it tonight and I would love to learn it.' AND created_at = '2026-05-22 18:28:00+00'
AND NOT EXISTS (
  SELECT 1 FROM community_post_comments
  WHERE email = 'matthew@matthewcawood.com' AND created_at = '2026-05-23 12:22:00+00'
);
INSERT INTO community_post_comments (post_id, email, name, content, created_at)
SELECT id, 'connieuitsu@gmail.com', 'Connie Witzoe', 'Matthew Cawood I have to admit, I laughed out loud at first, at the thought of even trying to play a piece like this by ear 😅 however, I like a challenge and it would definitely be good practice so I will give it a try! Thank you for the tip and video. :)', '2026-05-23 12:45:00+00'
FROM community_posts WHERE title = 'Hi Matt. I was wondering if you have access to the sheet music for Etude no. 3: Ballade by Marie Awadis? I came across it tonight and I would love to learn it.' AND created_at = '2026-05-22 18:28:00+00'
AND NOT EXISTS (
  SELECT 1 FROM community_post_comments
  WHERE email = 'connieuitsu@gmail.com' AND created_at = '2026-05-23 12:45:00+00'
);
INSERT INTO community_post_comments (post_id, email, name, content, created_at)
SELECT id, 'matthew@matthewcawood.com', 'Matthew Cawood', 'Connie Witzoe I reckon that reaction is more of a reason to give it a go! This is the sort of thing that will make a big impact on your pattern recognition.', '2026-05-23 13:44:00+00'
FROM community_posts WHERE title = 'Hi Matt. I was wondering if you have access to the sheet music for Etude no. 3: Ballade by Marie Awadis? I came across it tonight and I would love to learn it.' AND created_at = '2026-05-22 18:28:00+00'
AND NOT EXISTS (
  SELECT 1 FROM community_post_comments
  WHERE email = 'matthew@matthewcawood.com' AND created_at = '2026-05-23 13:44:00+00'
);
INSERT INTO community_post_comments (post_id, email, name, content, created_at)
SELECT id, 'connieuitsu@gmail.com', 'Connie Witzoe', 'Matthew Cawood I will definitely give it a go, without the sheet music I don''t really have a choice either 😅', '2026-05-23 15:02:00+00'
FROM community_posts WHERE title = 'Hi Matt. I was wondering if you have access to the sheet music for Etude no. 3: Ballade by Marie Awadis? I came across it tonight and I would love to learn it.' AND created_at = '2026-05-22 18:28:00+00'
AND NOT EXISTS (
  SELECT 1 FROM community_post_comments
  WHERE email = 'connieuitsu@gmail.com' AND created_at = '2026-05-23 15:02:00+00'
);

COMMIT;
