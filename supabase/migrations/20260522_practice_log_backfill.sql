-- ================================================================
-- Practice Log Community Backfill
-- 155 Circle practice-log posts → community_posts (type=practice_log)
-- Generated 2026-05-22
-- All session_id = NULL (historical text imports, not linked to practice_sessions)
-- Idempotent: uses WHERE NOT EXISTS guards on (email, created_at)
-- ================================================================

-- ── 1. POSTS ─────────────────────────────────────────────────────

-- Daniel Duordoe · 2026-05-22
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Thursday 21 May 2026  ·  5 min
👁 Sight-reading — Prelude op. 28 by Chopin
#ThePracticeRoom #PianoPractice', '2026-05-22 00:11:11.259+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-22 00:11:11.259+00');

-- Daniel Duordoe · 2026-05-21
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Thursday 21 May 2026  ·  5 min
👁 Sight-reading — Prelude op. 28 by Chopin
#ThePracticeRoom #PianoPractice', '2026-05-21 23:53:04.155+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-21 23:53:04.155+00');

-- Cécile Dautriat · 2026-05-21
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', 'Thursday 21 May 2026  ·  40 min
👁 Sight-reading
🎼 F major scale, D harmonic minor scale, D melodic minor scale
   Where: F/Dm · Problem: evenness · Fix: 80bpm listen
🎹 Ne bois pas ton chocolat avec tes doigts, Éric
   Where: 9-13 · Problem: learn notes
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 1-end · Problem: rhythm shifts · Fix: Slow 70bpm
👂 Ear Training
🎹 Impertinence, G. F. Handel
   Where: 1-end · Problem: phrase endings / LH dynamics/melody dynamics · Fix: record video
#ThePracticeRoom #PianoPractice', '2026-05-21 23:26:25.184+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-21 23:26:25.184+00');

-- Connie Witzoe · 2026-05-21
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Thursday 21 May 2026  ·  1h 15m
🎹 Vivaldi Variation, Florian Christl
   Polishing the whole piece. It''s so much fun to play this one, really enjoying it! Shame I have work tomorrow or I''d stay up later playing it even more 😅
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff
   Just played through what I know so far, still haven''t moved on from bar 36 onwards
🎹 Passacaglia, Händel — Played through a few times.
#ThePracticeRoom #PianoPractice', '2026-05-21 22:58:12.623+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-21 22:58:12.623+00');

-- Connie Witzoe · 2026-05-20
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Wednesday 20 May 2026  ·  30 min
🎹 Vivaldi Variation, Florian Christl
   Finished playing through the piece so now just have to practice practice to make it flow. Had to adjust some of the left hand chords at the end part of the piece as I can''t reach the whole chord.
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff
   Didn''t have much time to just played through what I''ve learned so far, and went over bar 31-36 again
🎹 Passacaglia, Händel
   Played through once. Think I want to try and record this one at some point if I can start playing throug it without any mistakes.
#ThePracticeRoom #PianoPractice', '2026-05-20 23:06:21.349+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-20 23:06:21.349+00');

-- Daniel Duordoe · 2026-05-20
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Wednesday 20 May 2026  ·  15 min
🎹 Air on the G String (BWV 1068) — Batches 2 and 3
#ThePracticeRoom #PianoPractice', '2026-05-20 20:48:11.321+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-20 20:48:11.321+00');

-- Cécile Dautriat · 2026-05-20
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', 'Tuesday 19 May 2026  ·  40 min
👁 Sight-reading
   Where: RCM2 · Problem: intervals > 5ths · Fix: play the wrong notes with the right rhythm and work on note/pattern recognition w/o looking at your hands
🎼 G major scale, Em, D# major scale
   Where: G/Em · Problem: evenness · Fix: 80bpm listen
🎹 Ne bois pas ton chocolat avec tes doigts, Éric
   Where: 14-20 · Problem: learn notes
🎹 Impertinence, G. F. Handel — Record video
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 6-15 · Problem: rhythm shifts · Fix: Slow 70bpm
👂 Ear Training
   Where: RCM2 · Problem: / · Fix: Mix
#ThePracticeRoom #PianoPractice', '2026-05-20 00:25:56.788+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-20 00:25:56.788+00');

-- Daniel Duordoe · 2026-05-20
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Tuesday 19 May 2026  ·  15 min
🎹 Air on the G String (BWV 1068)
   Batches 1 and 3 ( about 90% each) struggled with the large interval in the LH for the batch 3. Resolved it midway.
#ThePracticeRoom #PianoPractice', '2026-05-20 00:25:56.021+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-20 00:25:56.021+00');

-- Connie Witzoe · 2026-05-19
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Tuesday 19 May 2026  ·  3h 20m
🎹 Prelude Op. 28, No. 4 in E minor — Frédéric Chopin — Worked on the recording and finally got an ok recording done
🎹 Vivaldi Variation, Florian Christl
   Made it to the final part on the last page, the rest of it is quite repetitive so just need to practice speed and accuracy on that. Will likely finish it tomorrow night if I don''t finish work too late, and then spend the rest of the week polishing it. · Quite a fun piece  :)
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Worked on the same bars as I''ve been focusing more on the other 2 pieces today.
#ThePracticeRoom #PianoPractice', '2026-05-19 22:09:29.786+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-19 22:09:29.786+00');

-- Connie Witzoe · 2026-05-18
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Monday 18 May 2026  ·  2h 46m
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Same bars but also started working on the right hand in bars 37-39
🎹 Prelude Op. 28, No. 4 in E minor — Frédéric Chopin — Polishing it so I can record it
🎹 Passacaglia,  Händel
   Played through a few times. · This piece isn''t in the library...
🎹 Vivaldi Variation, Florian Christl — Worked on the first page
🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through once
#ThePracticeRoom #PianoPractice', '2026-05-18 22:34:03.144+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-18 22:34:03.144+00');

-- Daniel Duordoe · 2026-05-18
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Monday 18 May 2026  ·  17 min
🎹 Air on the G String (BWV 1068) — Batches 1(100%) and 3 (75%)
#ThePracticeRoom #PianoPractice', '2026-05-18 21:20:58.081+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-18 21:20:58.081+00');

-- Daniel Duordoe · 2026-05-17
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Monday 18 May 2026  ·  13 min
🎹 Air on the G String (BWV 1068) — Batch 1 and 2 - 80% accuracy
#ThePracticeRoom #PianoPractice', '2026-05-17 23:53:53.049+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-17 23:53:53.049+00');

-- Connie Witzoe · 2026-05-17
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Sunday 17 May 2026  ·  2h 5m
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff
   Bar 31-36 leading in to bar 37. Still have a lot of work to do on bar 19-30 so keep going back to those to move through to bar 36/37 rather than restarting the whole piece every time, though I do of course play from the beginning a lot too just to keep that going as well. · I feel like Arabesque no 1 will feel a lot easier to go back to, after finishing this polyrhythm nightmare 😂
🎹 Prelude Op. 28, No. 4 in E minor — Frédéric Chopin
   Worked on the whole piece but especially on the parts that make me stumble still, trying to polish it enough to record it
🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through once
#ThePracticeRoom #PianoPractice', '2026-05-17 23:29:18.340+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-17 23:29:18.340+00');

-- Luca Chiarella · 2026-05-17
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', 'Sunday 17 May 2026  ·  2h
🎹 Sonatina in G major (Anh. 5, No. 1) — Ludwig van Beethoven
   100bpm Moderato almost perfect, needs more work on dynamics · No metronome on Romanze but worked out the fingers and full piece done. · Needs work on that D7 on the left hand · Used Romanze as sight reading
#ThePracticeRoom #PianoPractice', '2026-05-17 21:55:22.826+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-05-17 21:55:22.826+00');

-- Daniel Duordoe · 2026-05-17
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Sunday 17 May 2026  ·  1h
📚 TB - Basics of Jazz theory
#ThePracticeRoom #PianoPractice', '2026-05-17 21:26:48.434+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-17 21:26:48.434+00');

-- Cécile Dautriat · 2026-05-17
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', 'Sunday 17 May 2026  ·  40 min
👁 Sight-reading
   Where: RCM2 · Problem: rhythm · Fix: play the wrong notes with the right rhythm and work on note/pattern recognition w/o looking at your hands
🎼 F major scale, D harmonic minor scale, D melodic minor scale
   Where: F/Dm · Problem: evenness · Fix: 80bpm listen
🎹 Etude in Dm, Cornelius Gurlitt
   Where: 1-end · Problem: RH evenness · Fix: 110 bpm ok - let it sit for a few days
🎹 Ne bois pas ton chocolat avec tes doigts, Éric
   Where: 21-end · Problem: learn notes
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 1-end · Problem: repetitive rhythm w/ slightly different notes/fingering / looking at hands · Fix: Slow 70bpm
👂 Ear Training
   Where: RCM2 · Problem: melody playback · Fix: Practice 2nds 3rds 4ths 5ths eyes closed
#ThePracticeRoom #PianoPractice', '2026-05-17 20:45:47.815+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-17 20:45:47.815+00');

-- Wendy Grimshaw · 2026-05-17
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'wg33@live.co.uk', 'Wendy Grimshaw', 'practice_log', '', 'Sunday 17 May 2026  ·  50 min
🎹 Clementi Arietta op42 nr 5
   Hands together slowly,  focusing on the difference between all the detached notes and the legato notes.
🎹 No. 13 from 24 Pieces for Children, Op. 39: Waltz — Dmitri Kabalevsky — Hands together,  with more flow and expression.
#ThePracticeRoom #PianoPractice', '2026-05-17 17:29:47.791+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='wg33@live.co.uk' AND created_at='2026-05-17 17:29:47.791+00');

-- Luca Chiarella · 2026-05-17
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', 'Sunday 17 May 2026  ·  40 min
🎹 Sonatina in G major (Anh. 5, No. 1) — Ludwig van Beethoven — Full piece no metronome yet
🎹 Sonatina in g major ROMANZE
   Bars 1-9 · Very slowly working on fingers placement
#ThePracticeRoom #PianoPractice', '2026-05-17 00:19:11.625+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-05-17 00:19:11.625+00');

-- Connie Witzoe · 2026-05-16
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Saturday 16 May 2026  ·  50 min
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Continued working on bar 31-36
🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through a couple of times
#ThePracticeRoom #PianoPractice', '2026-05-16 23:22:37.677+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-16 23:22:37.677+00');

-- Daniel Duordoe · 2026-05-16
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Saturday 16 May 2026  ·  8 min
🎹 Air on the G String (BWV 1068) — Batch 14 attempts 79% accuracy
#ThePracticeRoom #PianoPractice', '2026-05-16 22:50:10.837+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-16 22:50:10.837+00');

-- Wendy Grimshaw · 2026-05-16
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'wg33@live.co.uk', 'Wendy Grimshaw', 'practice_log', '', 'Saturday 16 May 2026  ·  1h 25m
🎹 Clementi Arietta op42 nr 5 — Articulation and phrasing
📝 Played a few older pieces for pleasure and to improve expression
🎹 No. 13 from 24 Pieces for Children, Op. 39: Waltz — Dmitri Kabalevsky — Hands together - breaking into sections to improve
🎹 Duvernoy:voicing study — Increased tempo to113
Notes: Would like to get more of waltz feeling in Little Waltz, but still practicing at very slow temp to make sure all notes correct,  but definitely coming on', '2026-05-16 15:44:44.202+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='wg33@live.co.uk' AND created_at='2026-05-16 15:44:44.202+00');

-- Cécile Dautriat · 2026-05-15
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', 'Friday 15 May 2026  ·  40 min
👁 Sight-reading
   Where: RCM2 · Problem: speed / looking at hands · Fix: play the wrong notes with the right rhythm and work on note/pattern recognition w/o looking at your hands
🎼 Bb major scale, G natural minor scale, G harmonic minor scale, G melodic minor scale — Problem: Gm Melodic
🎹 Etude in Dm, Cornelius Gurlitt
   Where: 1-end · Problem: dynamics  / looking at hands · Fix: 80 bpm listening
🎹 Ne bois pas ton chocolat avec tes doigts, Éric
   Where: 1-end · Problem: sight-read through it - it’s going to take a minute to figure out how it’s written
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 5-15 · Problem: repetitive rhythm w/ slightly different notes/fingering / looking at hands · Fix: Slow 70bpm
👂 Ear Training
   Where: RCM2 · Problem: melody playback · Fix: Practice 2nds 3rds 4ths 5ths eyes closed
#ThePracticeRoom #PianoPractice', '2026-05-15 23:42:05.776+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-15 23:42:05.776+00');

-- Connie Witzoe · 2026-05-15
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Friday 15 May 2026  ·  55 min
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff
   Started working on bar 31-36. Played through everything up until those bars, a few times as well of course. · I feel like this is the ultimate challenge for polyrhythms at the moment 😅 just when I think the piece can''t get any more challenging, it does.
🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through once
🎹 Prelude Op. 28, No. 20 in C minor — Frédéric Chopin
   Played through a few times, as it''s been a couple of weeks and I was starting to forget it.
🎹 Prelude in C major (BWV 846) — J.S. Bach — Played through a couple of times to refresh it again.
#ThePracticeRoom #PianoPractice', '2026-05-15 23:02:16.841+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-15 23:02:16.841+00');

-- Daniel Duordoe · 2026-05-15
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Friday 15 May 2026  ·  5 min
🎹 Air on the G String (BWV 1068) — Batch 2 (82% accuracy)
#ThePracticeRoom #PianoPractice', '2026-05-15 18:55:35.717+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-15 18:55:35.717+00');

-- Norman Jaillet · 2026-05-15
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'norman.jaillet@gmail.com', 'Norman Jaillet', 'practice_log', '', 'No I didn’t bail! Haven’t posted as I $%&#@ up my lower back on Tuesday the 12th. Getting better, just moved wrong! Moving gingerly … had to cancel 3 headshot sessions. Ugh
May 6 - 49 min (tuner came over to voice my piano (too bright) and tune the lower register - New Schimmel K132 was delivered in March) - since I returned to the keyboard in Feb ‘24 I’ve upgraded a few times (Yamaha P225 - P525-NU1XA - Schimmel W114 - Schimmel C130 - Schimmel K!32) I promised my wife that’s it!!  ;) 
May 7 - 25
May 8 - 45
May 9 -  48
May 10 - 43
May 11 - 60
May 12 - 98 (practice + lesson) - $%^&^’d my back in the evening
May 13 - 25
May 14 - 20
May 15 - ??
Working on scales
Schumann -  Of Foreign Lands and Peoples (notes are there - making it smoother)
Brahms - Waltz in D minor 
Chopin - Waltz in A minor
Bach - Concerto No 3 in D minor BMV 974: II Adagio (found this little piece serendipitously) - challenging for my paygrade - stretch piece for now - beautiful, lovely piece
Time for some Tylenol! Keep moving!', '2026-05-15 13:15:34.555+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-15 13:15:34.555+00');

-- Luca Chiarella · 2026-05-15
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', 'Friday 15 May 2026  ·  30 min
🎹 Sonatina in G major (Anh. 5, No. 1) — Ludwig van Beethoven
   Bars 1-8 · No metronome · Used it as sight reading exercise as well.
#ThePracticeRoom #PianoPractice', '2026-05-15 01:03:17.488+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-05-15 01:03:17.488+00');

-- Cécile Dautriat · 2026-05-15
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', 'Thursday 14 May 2026  ·  40 min
👁 Sight-reading
   Where: RCM2 · Problem: rhythm / looking at hands · Fix: play the wrong notes with the right rhythm and work on note/pattern recognition w/o looking at your hands
🎼 Bb major scale, G natural minor scale
   Where: Bb/Gm · Problem: look at hands / ignored Eb… · Fix: practice
🎹 Etude in Dm, Cornelius Gurlitt
   Where: 1-end · Problem: dynamics  / looking at hands · Fix: 70 bpm w/o looking at hands
🎹 Impertinence, G. F. Handel
   Where: 1-end · Problem: 84bpm acceptable · Fix: let it sit for a few days
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 5-15 · Problem: repetitive rhythm w/ slightly different notes/fingering / looking at hands · Fix: Slow 70bpm
🎵 Improvisation — C major / Am
#ThePracticeRoom #PianoPractice', '2026-05-15 00:23:22.926+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-15 00:23:22.926+00');

-- Connie Witzoe · 2026-05-14
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Thursday 14 May 2026  ·  30 min
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff
   Same again. Starting to feel ok enough to maybe move on to the next 4 bars tomorrow, or at least by Saturday.
🎹 Clair de lune — Claude Debussy — Played through once
#ThePracticeRoom #PianoPractice', '2026-05-14 22:03:46.823+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-14 22:03:46.823+00');

-- Daniel Duordoe · 2026-05-14
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Thursday 14 May 2026  ·  20 min
🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Improvised the first 4 bars.
Notes: Enjoyed that
Thursday 14 May 2026  ·  5 min
🎹 Air on the G String (BWV 1068) — Batch 1
Notes: 95% accuracy
#ThePracticeRoom #PianoPractice', '2026-05-14 15:57:54.085+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-14 15:57:54.085+00');

-- Luca Chiarella · 2026-05-14
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', 'Thursday 14 May 2026  ·  1h
🎹 Écossaise in E flat major WoO 86 — Ludwig van Beethoven
   No metronome, worked on getting the fingers right. · Started very slowly for accuracy. · Full piece, almost ready for metronome.
#ThePracticeRoom #PianoPractice', '2026-05-14 00:30:42.609+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-05-14 00:30:42.609+00');

-- Cécile Dautriat · 2026-05-13
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', 'Wednesday 13 May 2026  ·  40 min
👁 Sight-reading
   Where: RCM2 · Problem: speed / looking at your hands · Fix: just play the wrong notes with the right rhythm and work on note/pattern recognition
🎼 F major scale, D harmonic minor scale, D melodic minor scale — don’t look at your hands
🎹 Etude in Dm, Cornelius Gurlitt
   Where: 1-end · Problem: dynamics/speed / looking at hands · Fix: 70 bpm ok
🎹 Impertinence, G. F. Handel
   Where: 1-end · Problem: speed/dynamics / looking at hands · Fix: slow 60bpm
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 1-end · Problem: repetitive rhythm w/ slightly different notes/fingering · Fix: Slow 60bpm ok
👂 Ear Training
   Where: RCM2 · Problem: melody playback · Fix: Practice 2nds 3rds 4ths 5ths eyes closed so you don''t look at your hands...
#ThePracticeRoom #PianoPractice', '2026-05-13 23:45:02.015+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-13 23:45:02.015+00');

-- Daniel Duordoe · 2026-05-13
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Thursday 14 May 2026  ·  50 min
🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — 1st movement (Op. 27, No. 2) — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Guided practice - Section 3
#ThePracticeRoom #PianoPractice', '2026-05-13 23:17:26.027+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-13 23:17:26.027+00');

-- Connie Witzoe · 2026-05-13
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Wednesday 13 May 2026  ·  40 min
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff
   Played through to bar 30, and repeated bar 27-30 again and again, then back to bar 19-30, then 27-30 again. · The next few bars moves on to the next part of the piece which I look forward to starting, but I really feel I should get bar 19-30 to flow and stick more first before moving on.
📝 Moonlight Sonata
   Put together pictures of the chords in the first 5 bars of the Moonlight Sonata to help teach my 5 year old daughter as she''s showing interest in learning it. The chord changes in bar 4 gets her all mixed up, so I downloaded the synthesis app to take screenshots of each chord, and made a little collage for her. Look forward to seeing if that will help her tomorrow 😊
#ThePracticeRoom #PianoPractice', '2026-05-13 22:43:37.101+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-13 22:43:37.101+00');

-- Wendy Grimshaw · 2026-05-13
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'wg33@live.co.uk', 'Wendy Grimshaw', 'practice_log', '', 'Wednesday 13 May 2026  ·  43 min
🎹 Duvernoy:voicing study — Increasing tempo to 110
🎹 Clementi Arietta op42 nr 5 — First 8 bars hands together making sure all correct
🎹 No. 13 from 24 Pieces for Children, Op. 39: Waltz — Dmitri Kabalevsky — First two phrases hands together making sure all notes correct
🎼 C major scale — Used passage fixer tool to learn first 11 notes hands together
🎹 Czerny op 599 nr 19 — Played through
🎹 Czerny 100 recreations nr19 — Played through
#ThePracticeRoom #PianoPractice', '2026-05-13 18:07:23.585+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='wg33@live.co.uk' AND created_at='2026-05-13 18:07:23.585+00');

-- Michael Page · 2026-05-13
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'michaelpage05@hotmail.co.uk', 'Michael Page', 'practice_log', '', '📚 Turn Theory Into Music @ Pianote — Left Hand Arpeggios
📚 Turn Theory Into Music @ Pianote — Sharp This
📚 Turn Theory Into Music @ Pianote — Learn The Melody & Chords
📚 Adult Piano Adventures: All-in-One Piano Book 1 — Shining Stars
🎹 For Children (Sz. 42), No. 1 in C major (Children at Play) — Béla Bartók — Worked on the first 4 bars again, which repeat, so played them in a loop.
#ThePracticeRoom #PianoPractice', '2026-05-13 14:16:40.192+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-05-13 14:16:40.192+00');

-- Daniel Duordoe · 2026-05-13
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Wednesday 13 May 2026  ·  20 min
📖 Theory — Rule of octaves
#ThePracticeRoom #PianoPractice', '2026-05-13 07:23:20.647+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-13 07:23:20.647+00');

-- Luca Chiarella · 2026-05-12
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', 'Wednesday 13 May 2026  ·  40 min
🎹 Écossaise in E flat major WoO 86 — Ludwig van Beethoven
   Used it as sight reading · Also work both hands together full piece, no metronome but figuring fingers
🎹 Minuet in G minor — Full piece
#ThePracticeRoom #PianoPractice', '2026-05-12 23:35:51.837+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-05-12 23:35:51.837+00');

-- Connie Witzoe · 2026-05-12
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Tuesday 12 May 2026  ·  15 min
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff
   Today has been non stop, only got about 10 min practice in in the day, and by the time the evening came all my energy was gone so only had about 5 min in me. · Will hopefully be a better end of the day tomorrow after work 🤞
#ThePracticeRoom #PianoPractice', '2026-05-12 22:00:28.255+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-12 22:00:28.255+00');

-- Daniel Duordoe · 2026-05-12
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Tuesday 12 May 2026  ·  25 min
🎹 Air on the G String (BWV 1068) — Round 2 - batch 1
Notes: Interesting what a one-week break does for your playing.
Tuesday 12 May 2026  ·  15 min
🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Guided practice. Ist four bars. Played them in block chords as well.
#ThePracticeRoom #PianoPractice', '2026-05-12 15:35:50.159+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-12 15:35:50.159+00');

-- Daniel Duordoe · 2026-05-12
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Tuesday 12 May 2026  ·  25 min
🎹 Air on the G String (BWV 1068) — Round 2 - batch 1
Notes: Interesting what a one-week break does for your playing.
#ThePracticeRoom #PianoPractice', '2026-05-12 12:03:24.195+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-12 12:03:24.195+00');

-- Michael Page · 2026-05-12
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'michaelpage05@hotmail.co.uk', 'Michael Page', 'practice_log', '', '🎹 The Virtuoso Pianist in Sixty Exercises — Charles-Louis Hanon — #1 Increase The Speed — Left Hand @ Pianote
📚 Turn Theory Into Music @ Pianote — The Final Waltz
📖 Theory — Diatonic Chords @ Pianote
📚 Adult Piano Adventures: All-in-One Piano Book 1 — Chant of the Monks
🎹 For Children (Sz. 42), No. 1 in C major (Children at Play) — Béla Bartók
   Only managed to do the first 4 bars. This is really pushing my hand independence. My main struggle was with the individual hand dynamics (allowing the right hand to sing out over the Left).
#ThePracticeRoom #PianoPractice', '2026-05-12 11:47:06.847+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-05-12 11:47:06.847+00');

-- Cécile Dautriat · 2026-05-12
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', 'Monday 11 May 2026  ·  45 min
👁 Sight-reading
   Where: RCM2 · Problem: Prep too slow · Fix: Practice
🎼 C major scale, G major scale
   Where: C/G formula pattern · Problem: G pattern 8th notes · Fix: 80bpm practice
🎹 Etude in Dm, Cornelius Gurlitt
   Where: 1-end · Problem: dynamics/speed · Fix: listen/metronome
🎹 Impertinence, G. F. Handel
   Where: 1-5 · Problem: speed/dynamics · Fix: Slow 60bpm HT - cut time
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 6-9 · Problem: repetitive rhythm w/ slightly different notes/fingering · Fix: Slow 60bpm
👂 Ear Training
   Where: RCM2 · Problem: melody playback · Fix: Practice 2nds 3rds 4ths 5ths
#ThePracticeRoom #PianoPractice', '2026-05-12 00:30:05.398+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-12 00:30:05.398+00');

-- Connie Witzoe · 2026-05-11
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Monday 11 May 2026  ·  2h 25m
🎹 Air on the G String (BWV 1068) — J.S. Bach
   I feel like I probably spent 2 hours on this today but I didn''t time it so rounding it down to 100 minutes 😅 · I''ve played through it several times, but some parts are still slow and I still make some mistakes here and there so still work to do. · Once I''ve finished playing through this version well, I might try to get the more advanced version in C Major, as this one is quite simplified.
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff
   Worked more on bar 27-30, but also still struggling in general with this whole section so continued practicing bar 19-26 moving in to bar 27-30 as well as just playing through all previous bars to keep them going.
Notes: I''m finding with the Prelude it''s extra challenging to move further in the piece in the parts I am now. Each bar has big similarities, but also big differences which makes it hard not to get them mixed up when I try to memorize them. And it''s hard to not try to memorize this piece, cause the jumps in the left hand are so big I struggle to look at the sheet music whilst playing - I have to look at the keys all the time.
#ThePracticeRoom #PianoPractice', '2026-05-11 22:51:01.203+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-11 22:51:01.203+00');

-- Daniel Duordoe · 2026-05-11
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Monday 11 May 2026  ·  40 min
🎹 Air on the G String (BWV 1068) — Piece analysis
Notes: Worked on a new round of batches and looked at similar patterns in the left hand
#ThePracticeRoom #PianoPractice', '2026-05-11 21:43:56.863+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-11 21:43:56.863+00');

-- Michael Page · 2026-05-11
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'michaelpage05@hotmail.co.uk', 'Michael Page', 'practice_log', '', '🎼 Technique — To The Top — Left Hand @ Pianote
👁 Sight-reading — Thirds To Fourths @ Pianote
📖 Theory — Reading Chord Inversions @ Pianote
📚 Adult Piano Adventures: All-in-One Piano Book 1 — Midnight Ride
📚 Adult Piano Adventures: All-in-One Piano Book 1 — p40
📚 Adult Piano Adventures: All-in-One Piano Book 1 — p41
Notes: Didn''t have much time today.
#ThePracticeRoom #PianoPractice', '2026-05-11 15:18:21.898+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-05-11 15:18:21.898+00');

-- Connie Witzoe · 2026-05-10
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', 'Sunday 10 May 2026  ·  1h 5m
🎹 Air on the G String (BWV 1068) — J.S. Bach
   Found the C Major version on the Oktav app. Treated it like a mixture of a sight reading exercise and a piece to learn, but will go back and practice it so I can play it properly eventually. It''s definitely a very simplified version compared to the D major version, but was fun to play.
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — The usual, worked more on bar 25-26 but also started working on bar 29-30.
👂 Ear Training — Tried playing the melody of the Super Mario Bros theme by ear 🙈
#ThePracticeRoom #PianoPractice', '2026-05-10 23:10:35.299+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-10 23:10:35.299+00');

-- Daniel Duordoe · 2026-05-10
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', 'Sunday 10 May 2026  ·  1h
📖 Theory — Chopin''s preludes
#ThePracticeRoom #PianoPractice', '2026-05-10 21:23:15.740+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-10 21:23:15.740+00');

-- Cécile Dautriat · 2026-05-10
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', 'Sunday 10 May 2026  ·  55 min
👁 Sight-reading
   Where: RCM2 · Problem: Prep too slow · Fix: Practice
🎼 C major scale, G major scale
   Where: C/G formula pattern · Problem: G pattern 8th notes · Fix: 80bpm practice
🎹 Etude in Dm, Cornelius Gurlitt
   Where: 12-end · Problem: dynamics · Fix: listen
🎹 Impertinence, G. F. Handel
   Where: 5-8 · Problem: LH too loud · Fix: Slow 60bpm HT - cut time
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 6-9 · Problem: repetitive rhythm w/ slightly different notes/fingering · Fix: Slow 60bpm
👂 Ear Training
   Where: RCM2 · Problem: Mixed, a bit of everything · Fix: Practice
📖 Balance Between Hands
#ThePracticeRoom #PianoPractice', '2026-05-10 18:29:52.987+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-10 18:29:52.987+00');

-- Wendy Grimshaw · 2026-05-10
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'wg33@live.co.uk', 'Wendy Grimshaw', 'practice_log', '', 'Sunday 10 May 2026  ·  1h
🎼 C major scale — Really struggling with hands together!
🎹 Duvernoy:voicing study — Increasing tempo to 110
🎹 Clementi Arietta op42 nr 5 — Playing hands together with a little  more speed.
🎹 Czerny op 599 nr 19 — Played through
🎹 Czerny 100 recreations nr19 — Played through
👁 Sight-reading — Exercises 71 to79 left hand,Matt''s sight readingbok
#ThePracticeRoom #PianoPractice', '2026-05-10 18:07:43.183+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='wg33@live.co.uk' AND created_at='2026-05-10 18:07:43.183+00');

-- Luca Chiarella · 2026-05-10
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', 'Sunday 10 May 2026  ·  1h 30m
🎹 Minuet in G major (BWV Anh. 114) — Christian Petzold — 130 bpm
🎹 Minuet in G minor — Full piece
🎼 Hanon
   45 BPM · Exercises 7-8-9-10 · No metronome 11-12
#ThePracticeRoom #PianoPractice', '2026-05-10 17:35:31.499+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-05-10 17:35:31.499+00');

-- Connie Witzoe · 2026-05-09
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Saturday 9 May 2026  ·  25 min
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff
   Worked on bar 25-26. Will move on to bar 27 tomorrow. Played through the bars up to that point a few times.
🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through once
🎹 Clair de lune — Claude Debussy — Played through once
💬 My brain was definitely not in piano mode tonight. I was forgetting parts of Clair de lune cause I just didn''t feel switched on so had to cut the practice session short and hopefully back to normal tomorrow.
#ThePracticeRoom #PianoPractice', '2026-05-09 22:36:54.300+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-09 22:36:54.300+00');

-- Luca Chiarella · 2026-05-09
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', 'Saturday 9 May 2026  ·  1h 45m
🎼 Hanon — 1-8 @ 50bpm
🎹 Sonata in C major (K. 545) — 1st movement — Wolfgang Amadeus Mozart
   Full piece at 70 bpm · Still need 60 Bpm on bars 50 to 53
🎹 Minuet in G major (BWV Anh. 114) — Christian Petzold
   Full piece 130 BPM · Perfect
🎹 Ballade Burgmuller — 70 bpm
#ThePracticeRoom #PianoPractice', '2026-05-09 22:09:47.158+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-05-09 22:09:47.158+00');

-- jonathan arrow · 2026-05-09
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'jonathan.arroyo@12yfilms.com', 'jonathan arrow', 'practice_log', '', '', '2026-05-09 19:42:57.190+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='jonathan.arroyo@12yfilms.com' AND created_at='2026-05-09 19:42:57.190+00');

-- Wendy Grimshaw · 2026-05-09
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'wg33@live.co.uk', 'Wendy Grimshaw', 'practice_log', '', '🎹 Saturday 9 May 2026  ·  1h 10m
🎹 Clementi Arietta op42 nr 5 — Hands together working on differences between slurred and detached notes
🎹 Duvernoy:voicing study — Played at 104 tempo,  one beat per eigth note
🎹 Czerny op 599 nr 19 — Worked ondynamics and phrasing
🎹 Czerny 100 recreations nr19 — Played through for fun
🎹 No. 1 from 24 Pieces for Children, Op. 39: Little Waltz — Dmitri Kabalevsky — Learning left hand chords
📝 Played through various pieces for enjoyment
🎼 C major scale
   Trying to get fingering for double octave to stick! Still need to practice one hand at atime
💬 Very enjoyable Saturday afternoon practice.
#ThePracticeRoom #PianoPractice', '2026-05-09 15:41:49.981+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='wg33@live.co.uk' AND created_at='2026-05-09 15:41:49.981+00');

-- Daniel Duordoe · 2026-05-09
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Saturday 9 May 2026  ·  1h
🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Guided practice: Bars 1-4
💬 Pleased. Great start.
#ThePracticeRoom #PianoPractice', '2026-05-09 00:40:12.049+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-09 00:40:12.049+00');

-- Connie Witzoe · 2026-05-08
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Friday 8 May 2026  ·  15 min
🎵 Improvisation
   Improvised up a lullaby in A-minor. Recorded it so I won''t forget. · Counting the minutes until my next day off 😅
#ThePracticeRoom #PianoPractice', '2026-05-08 23:06:52.875+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-08 23:06:52.875+00');

-- Cécile Dautriat · 2026-05-08
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', '🎹 Friday 8 May 2026  ·  45 min
👁 Sight-reading
   Where: RCM2 · Problem: Prep too slow · Fix: Practice
🎼 Bb major scale, G natural minor scale, G harmonic minor scale, Gb melodic minor scale
   Where: Bb/Gm · Problem: Gm Melodic / blocked chords · Fix: 80bpm practice
🎹 Etude in Dm, Cornelius Gurlitt
   Where: 1-end · Problem: speed/tempo disaster · Fix: go back to only the last 8 bars
🎹 Impertinence, G. F. Handel
   Where: 9-20 · Problem: learn notes/trills/play d e t a c h e d · Fix: Slow 60bpm HS - 2 beat per bar detached
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 10-13 · Problem: repetitions w/ same rhythm but different notes/fingering · Fix: Slow 60bpm
👂 Ear Training
   Where: RCM2 · Problem: Mixed, a bit of everything · Fix: Practice
#ThePracticeRoom #PianoPractice', '2026-05-08 22:11:14.205+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-08 22:11:14.205+00');

-- Daniel Duordoe · 2026-05-08
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Friday 8 May 2026  ·  2h 20m
📚 TB - Intro to improvisation — Noam Sivan
💬 Intriguing
I watched a very interesting tutorial today on improvisation across various periods from baroque, classical, romantic to contemporary. I always assumed it was a jazz thing. Impressed!
#ThePracticeRoom #PianoPractice', '2026-05-08 21:46:20.152+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-08 21:46:20.152+00');

-- Wendy Grimshaw · 2026-05-08
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'wg33@live.co.uk', 'Wendy Grimshaw', 'practice_log', '', '🎹 Friday 8 May 2026  ·  40 min
🎹 Czerny op 599 nr 19 — Platyed through for fun
🎹 Clementi Arietta op42 nr 5 — Slowly hands together, getting better
🎼 C major scale
   Trying to do double octave, but trickier than single octave, need to do more work on hans separately first.
🎹 No. 1 from 24 Pieces for Children, Op. 39: Little Waltz — Dmitri Kabalevsky — Left hand rhythm,  then right hand melody and phrasing
#ThePracticeRoom #PianoPractice', '2026-05-08 17:57:10.916+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='wg33@live.co.uk' AND created_at='2026-05-08 17:57:10.916+00');

-- Michael Page · 2026-05-08
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'michaelpage05@hotmail.co.uk', 'Michael Page', 'practice_log', '', '🎼 Technique — Increase The Speed — Right Hand @ Pianote
👁 Sight-reading — Introducing Staccato @ Pianote
📖 Theory — Understanding Triads (Inversions) @ Pianote
🎼 Technique — Both hands
📚 Adult Piano Adventures: All-in-One Piano Book 1 — p35 Catch a Falling Star
📚 Adult Piano Adventures: All-in-One Piano Book 1 — p36 Russian Fol Song
#ThePracticeRoom #PianoPractice', '2026-05-08 15:13:30.964+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-05-08 15:13:30.964+00');

-- Daniel Duordoe · 2026-05-08
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Friday 8 May 2026  ·  20 min
🎼 Technique, Two hand coordination
#ThePracticeRoom #PianoPractice', '2026-05-08 11:31:54.710+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-08 11:31:54.710+00');

-- Cécile Dautriat · 2026-05-07
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', '🎹 Thursday 7 May 2026  ·  45 min
👁 Sight-reading
   Where: RCM2 · Problem: Prep too slow · Fix: Practice
🎼 F major scale, D harmonic minor scale, D melodic minor scale — 80bpm
🎹 Etude in Dm, Cornelius Gurlitt
   Where: 13-17 · Problem: keep RH steady/quieter when LF plays the dynamics · Fix: slow 60bpm
🎹 Impertinence, G. F. Handel
   Where: 9-12 · Problem: learn notes/trills/play d e t a c h e d · Fix: Slow 60bpm HS - 2 beat per bar detached
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 14-15 · Problem: notes/dynamics · Fix: Slow 60bpm
👂 Ear Training
   Where: RCM2 · Problem: Melody playback · Fix: Practice
#ThePracticeRoom #PianoPractice', '2026-05-07 23:17:59.198+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-07 23:17:59.198+00');

-- Connie Witzoe · 2026-05-07
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Friday 8 May 2026  ·  10 min
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff
   Same bars. Very little time again today unfortunately. Looking forward to my days off so I can get some proper practice in
#ThePracticeRoom #PianoPractice', '2026-05-07 23:03:19.502+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-07 23:03:19.502+00');

-- Daniel Duordoe · 2026-05-07
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Thursday 7 May 2026  ·  1h
📖 Theory — You can play the blues
💬 Inspired
#ThePracticeRoom #PianoPractice', '2026-05-07 20:47:10.708+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-07 20:47:10.708+00');

-- Wendy Grimshaw · 2026-05-07
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'wg33@live.co.uk', 'Wendy Grimshaw', 'practice_log', '', '', '2026-05-07 18:35:26.297+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='wg33@live.co.uk' AND created_at='2026-05-07 18:35:26.297+00');

-- Kelly Williams · 2026-05-07
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'confi1@hotmail.com', 'Kelly Williams', 'practice_log', '', '🎹 Mixed
   Perfecting piece ready to record: · Spooky Wood Hollow - Hammond · Cloudy Day - Norton · Chromatic Rag - Fisher · Melody in C - Felix Le Couppey
👁 Sight-reading — Following piano safari
🎼 Triplets
🎹 Suite de la rejouissance - Daquin — This sometimes feels like it''s there, sometimes not!!
#ThePracticeRoom #PianoPractice', '2026-05-07 16:51:19.964+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='confi1@hotmail.com' AND created_at='2026-05-07 16:51:19.964+00');

-- Michael Page · 2026-05-07
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'michaelpage05@hotmail.co.uk', 'Michael Page', 'practice_log', '', '🎼 Learn to control which note is heard — 5 min on each hand.
🎹 Hanon #1 — To The Top — Right Hand @ Pianote
👁 Sight-reading — Waltz In Thirds @ Pianote
📖 Theory — Major & Minor Chord Formula @ Pianote
📚 Adult Piano Adventures 1 — p32 Yankee Doodle
📚 Adult Piano Adventures 1 — p.33 Row, Row, Row Your Boat
📚 Adult Piano Adventures 1 — p33 Clock Tower Bells
📚 Adult Piano Adventures 1 — p1-31 — Read through to page 31
#ThePracticeRoom #PianoPractice', '2026-05-07 15:24:39.764+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-05-07 15:24:39.764+00');

-- Luca Chiarella · 2026-05-07
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', '🎹 Thursday 7 May 2026  ·  1h 10m
🎹 k545 Mozart
   70 bpm full piece · Bars 50 to 53 clean only at 60 Bpm
🎼 Hanon — Exercises 7-8 at 50 bpm
#ThePracticeRoom #PianoPractice', '2026-05-07 14:01:30.345+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-05-07 14:01:30.345+00');

-- Daniel Duordoe · 2026-05-07
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Thursday 7 May 2026  ·  20 min
🎹 Air on the G string by Bach
   Played through the piece a few times. A few random errors. I need to polish this up!
#ThePracticeRoom #PianoPractice', '2026-05-07 07:45:09.881+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-07 07:45:09.881+00');

-- Connie Witzoe · 2026-05-06
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Wednesday 6 May 2026  ·  15 min
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff
   Don''t have much time on the days I''m working in the office so didn''t get much time in tonight.
🎹 Clair de lune — Claude Debussy — Played through once
#ThePracticeRoom #PianoPractice', '2026-05-06 23:17:57.274+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-06 23:17:57.274+00');

-- Kelly Williams · 2026-05-06
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'confi1@hotmail.com', 'Kelly Williams', 'practice_log', '', '🎹 Mixed
   Perfecting piece ready to record: · Spooky Wood Hollow - Hammond · Cloudy Day - Norton · Chromatic Rag - Fisher · Melody in C - Felix Le Couppey
🎼 G major scale, Octave scales
🎹 Suite de la rejouissance - Daquin — Still need to practice the ending section! It''s not quite in harmony
👁 Sight-reading — Following piano safari
💬 Very limited time recently, so trying to get bits in when I can.
#ThePracticeRoom #PianoPractice', '2026-05-06 19:42:04.045+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='confi1@hotmail.com' AND created_at='2026-05-06 19:42:04.045+00');

-- Daniel Duordoe · 2026-05-06
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Wednesday 6 May 2026  ·  15 min
👁 Sight-reading — Moonlight sonata
💬 It was harder than I thought.
#ThePracticeRoom #PianoPractice', '2026-05-06 19:41:42.570+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-06 19:41:42.570+00');

-- jonathan arrow · 2026-05-06
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'jonathan.arroyo@12yfilms.com', 'jonathan arrow', 'practice_log', '', '', '2026-05-06 13:25:44.053+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='jonathan.arroyo@12yfilms.com' AND created_at='2026-05-06 13:25:44.053+00');

-- Luca Chiarella · 2026-05-06
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', '🎹 Wednesday 6 May 2026  ·  1h 10m
🎹 K545
   Full piece at 64 BPM · Not bad. · Still works needed for fluency on bars 50 to 53
🎼 Hanon
   40bpm · Exercises 7-8
#ThePracticeRoom #PianoPractice', '2026-05-06 10:46:14.429+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-05-06 10:46:14.429+00');

-- Connie Witzoe · 2026-05-06
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Tuesday 5 May 2026  ·  45 min
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff
   Kept working on bar 19-23 (and of course 1-19), but also started looking at bar 24-27.
💬 Forgot to log it last night
#ThePracticeRoom #PianoPractice', '2026-05-06 06:30:25.802+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-06 06:30:25.802+00');

-- Denzel R Riwai · 2026-05-06
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'denzelriwai1@gmail.com', 'Denzel R Riwai', 'practice_log', '', 'Just wanted to post something, Ive been teaching myself for two months so nothing I do is gonna be Matthew level, but I was inspired by Michael.
This is a bit of a hack.. Improvising with just the black keys uses way less thought then a mix, you can play through mistakes, test small motifs out and build off of them. Here''s a small attempt of mine. As you can see this is not a display of skill, but for any ultra Beginners like me… sometimes you just want to PLAY. But you can only play a few things. This is my shortcut for it. I''ve burnt a lot of time with these small sessions. Practicing with dynamics etc. but this is an unstructured informal strategy. A far more studious route would be to use a scale and chords ( I have a similar recording of C sharp minor scale improv I wasn''t as confident sharing ).
I really just wanted to post something.. I''m nervous and don''t have a lot of impressive skills yet. But Norman, Michael and everyone else are too inspiring no?', '2026-05-06 06:24:01.761+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-06 06:24:01.761+00');

-- Cécile Dautriat · 2026-05-05
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', '🎹 Tuesday 5 May 2026  ·  42 min
👁 Sight-reading
   Where: RCM2 · Problem: Prep too slow · Fix: Practice
🎼 Technique
   Problem: 2-octave pattern in G+ · Fix: slow @ 60bpm w/ 8th notes, musically
🎹 Etude in F Major op. 190 no. 27, Kohler
   Where: 1-end · Problem: overview · Fix: play HS sight reading
🎹 Etude in Dm, Cornelius Gurlitt
   Where: 8-11 · Problem: counting beats seems to be the only way · Fix: play only upbeats, then only downbeats?
🎹 Impertinence, G. F. Handel
   Where: 13-16 · Problem: learn notes/trills/play d e t a c h e d · Fix: Slow 60bpm HS - 2 beat per bar detached
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 14-15 · Problem: notes/dynamics · Fix: Slow 60bpm
👂 Ear Training
   Where: RCM2 · Problem: Melody playback · Fix: Practice
💬 My usual strategy to learn a piece is useless for Baroque pieces
#ThePracticeRoom #PianoPractice', '2026-05-05 22:06:10.703+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-05 22:06:10.703+00');

-- Daniel Duordoe · 2026-05-05
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Tuesday 5 May 2026  ·  40 min
🎹 Air on the G string by Bach
   Batch 4 - 76% · Batch 7 - 76%
💬 Getting there!
#ThePracticeRoom #PianoPractice
🎹 Tuesday 5 May 2026  ·  30 min
📖 Theory — Watched a tutorial on tritones
#ThePracticeRoom #PianoPractice
🎹 Tuesday 5 May 2026  ·  5 min
👂 Ear Training
#ThePracticeRoom #PianoPractice
🎹 Tuesday 5 May 2026  ·  20 min
📖 Theory — Rhythmic patterns
#ThePracticeRoom #PianoPractice', '2026-05-05 18:40:17.834+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-05 18:40:17.834+00');

-- Wendy Grimshaw · 2026-05-05
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'wg33@live.co.uk', 'Wendy Grimshaw', 'practice_log', '', '🎹 Tuesday 5 May 2026  ·  51 min
🎹 Czerny 100 recreations nr19
   Can play through at decent tempo now with a swinging,  flowing feeling . Very happy with this now.
🎹 Czerny op 599 nr 19
   Focus on legato phrasing and natural dynamics · Can play through well now with good tempo and feeling for where the phrases should rise an fall
🎹 Clementi Arietta op42 nr 5
   Worked on left and right hands separately and very slowly together. Still learning the notes on this one, need also  to keep dynamics in mind.
👁 Sight-reading
   Matthew''s sight reading book exercises 66 to 70 for left hand. Definitely helping with bas clef reading.
🎼 C major arpeggio — Hands separately,  still learning fingering
💬 Very happy today, lots of progress,  will continue hands together c major arpeggios next time.
#ThePracticeRoom #PianoPractice', '2026-05-05 18:28:45.686+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='wg33@live.co.uk' AND created_at='2026-05-05 18:28:45.686+00');

-- Norman Jaillet · 2026-05-05
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'norman.jaillet@gmail.com', 'Norman Jaillet', 'practice_log', '', 'I decided to log on a weekly basis.
Total practice - 
29) 53 min
30) 35 min
1) 48 min
2) 90 min
3) 62min 
4) 40 min
5) 60 min
Chopin Preludes 4 and 7 (listening to different interpretations as well) - Recital was this past Sunday - went well - people said I played with great emotion, very musical - I’ll take it!!
The simple Mozart piece I played with 85 yr old Jennifer went very well. I gave her a little bouquet of roses afterwards! 😁
STILL WORKING ON
Schumann of Foreign Lands and Peoples (coming along)
Hanon-Faber New Virtuoso Pianist exercises 
Sight-read Prelude in B minor … very slow .. trying to determine if it’s above my pay grade before investing time! ;)
Chopin - Waltz in A minor
Now that I’m done with the recital, I will review some selections with my teacher this afternoon; Beethoven (Fur Elise, Moonlight Sonata) Mozart (Sonate facile in C major) Schubert (Scherzo in B-flat major) Brahms (Waltz in D minor) Debussy (Arabesque no 1, The Little Shepherd) Bach (Goldberg Variations Aria in G maj) 
YES, My ADD is kicking in! While it’s ambitious, I don’t want to set myself up for failure. Practice goal is 2 hrs/day.
Will need to work in some fun stuff using The Real Book.
I’m the chubby guy in the back wearing plaid!', '2026-05-05 14:44:30.563+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:44:30.563+00');

-- Michael Page · 2026-05-05
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'michaelpage05@hotmail.co.uk', 'Michael Page', 'practice_log', '', 'I have taken a small break. getting back to it. 
🎼 Technique — Intro to Hanon @ Pianote
👁 Sight-reading — The Waltz Time Signature @ Pianote
📖 Theory — The Sounds Of Major & Minor @ Pianote
🎼 Technique: Learn to control which note is heard
   First try! · 5 min on each hand.
🎹 Melodic Study in C major, Op. 599, No. 1 — Carl Czerny
🎹 Dreamfall by Pianote — Refresh
#ThePracticeRoom #PianoPractice', '2026-05-05 12:09:28.028+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-05-05 12:09:28.028+00');

-- Daniel Duordoe · 2026-05-05
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Tuesday 5 May 2026  ·  40 min
🎹 Air on the G string by Bach
   Batch 4 - 76% · Batch 7 - 76%
💬 Getting there!
#ThePracticeRoom #PianoPractice', '2026-05-05 10:33:22.590+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-05 10:33:22.590+00');

-- Daniel Duordoe · 2026-05-04
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Monday 4 May 2026  ·  5 min
🎼 Technique — Repeat the chord, but each time choose one note to bring out above the others.
💬 Quite difficult. Will try again tomorrow
#ThePracticeRoom #PianoPractice
🎹 Monday 4 May 2026  ·  20 min
🎵 Improvisation — Free practice with some hymns in different keys. Played by ear.
💬 Happy with the progress I am making.
#ThePracticeRoom #PianoPractice', '2026-05-04 23:41:10.253+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-04 23:41:10.253+00');

-- Connie Witzoe · 2026-05-04
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Monday 4 May 2026  ·  1h 15m
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff
   Bar 19-23. 19-23. 19-23. 21. 21. 21. 21. 21.... · That #%&* bar 21. It''s like polyrhtyhm hell. 😅  and I can see that I will encounter it again and again later in the piece as well 🙈 · I played through bar 1-18 several times as well of course.
🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through a few times again as the kids seem to love it
🎹 Clair de lune — Claude Debussy — Played through once
👂 Ear Training
   Throughout the days that I''m with the kids, the tv is blasting kids songs and nursery rhymes, so sometimes when it''s too loud for me to concentrate on my classical pieces I sit and try to play the kids songs along to the tv. · Gotta work with what you get 😅
#ThePracticeRoom #PianoPractice', '2026-05-04 22:55:01.485+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-04 22:55:01.485+00');

-- Luca Chiarella · 2026-05-04
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', '🎹 Monday 4 May 2026  ·  1h 30m
🎹 K545
   Full piece half speed · Real struggle to get fluidity on the left hand scales on the  50 to 53 bars
#ThePracticeRoom #PianoPractice', '2026-05-04 19:57:21.569+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-05-04 19:57:21.569+00');

-- Kelly Williams · 2026-05-04
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'confi1@hotmail.com', 'Kelly Williams', 'practice_log', '', '🎹 Mixed
   Perfecting piece ready to record: · Spooky Wood Hollow - Hammond · Cloudy Day - Norton · Chromatic Rag - Fisher
🎹 Suite de la rejouissance - Daquin
   Start and end is sounding good. Need to practise the missile section and joing the two into one flowing piece
🎹 Melody in C - Felix Le Couppey
   Managed to learn this in 30mins.  It''s a little below the level what I''ve been trying, but I found it rewarding to get it so quickly.
💬 Happy with practise today! Learning something so quickly has been reassuring I''m doing something right!
#ThePracticeRoom #PianoPractice', '2026-05-04 17:26:37.315+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='confi1@hotmail.com' AND created_at='2026-05-04 17:26:37.315+00');

-- Denzel R Riwai · 2026-05-04
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'denzelriwai1@gmail.com', 'Denzel R Riwai', 'practice_log', '', 'Tuesday 5 May 2026  ·  45 min
More drills centred around the bass cleft and three ledger lines above and below it. - total reps for this session - 1536 
Accuracy - 97.9%
Average recognition time - 1.65 seconds.
Still plan to go through Matt''s sight reading book to brush it up more I don''t feel confident in reading still… which is strange given the numbers. 
I started learning piano etc two months ago.. I clearly know the notes of both clefts now. But strangely it still feels like I''m about to get it wrong when I''m reading. I''m sure it''ll dissapear soon and that confidence will solidify.', '2026-05-04 16:55:14.170+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-04 16:55:14.170+00');

-- Denzel R Riwai · 2026-05-04
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'denzelriwai1@gmail.com', 'Denzel R Riwai', 'practice_log', '', '🎹 Monday 4 May 2026  ·  3h 10m
Sight-reading - 30 rounds of 64 note recognition drills. At work today anytime I had downtime I was on my phone doing these. So I could decode Rach''s prelude in C sharp minor when I got home.
Improvisation - improvised with chords and octaves in the C sharp minor scale and practiced the scale itself, then did so with multiple instruments options on my digital piano 
Piece - decoded the first two passages of Rach''s prelude from sheet music, converted to notation I could use to practice the shapes and the sequence for memorisation. ( The version I was working on is definitely different from the fourth chord shape onward ). -  played through many of the songs I already know to feel better about how slow this all is.', '2026-05-04 10:43:01.824+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-04 10:43:01.824+00');

-- Connie Witzoe · 2026-05-04
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Sunday 3 May 2026  ·  45 min
🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through a few times
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff
   Same bars again, kept practicing 16-20, but also started looking in to bar 20-23 which sure challenging with bar 21 having 3 different rhythms in it.. so will just have to listen to those parts over and over and try to replicate. Starting to feel like a 3 hand piece 😅
#ThePracticeRoom #PianoPractice', '2026-05-04 08:09:01.230+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-04 08:09:01.230+00');

-- Daniel Duordoe · 2026-05-03
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Sunday 3 May 2026  ·  30 min
🎵 Improvisation — Free practice - Amazing grace in a number of keys, edelweiss and others.
#ThePracticeRoom #PianoPractice
🎹 Sunday 3 May 2026  ·  15 min
🎹 Air on the G string by Bach — Batches 4 and 7
#ThePracticeRoom #PianoPractice', '2026-05-03 23:48:49.517+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-03 23:48:49.517+00');

-- Cécile Dautriat · 2026-05-03
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', '🎹 Sunday 3 May 2026  ·  45 min
👁 Sight-reading
   Where: RCM2 · Problem: Prep · Fix: Ignore timer
🎼 G+ Pattern
   Where: G · Problem: 2-octave pattern in G+ · Fix: pattern @ 80bpm
🎹 Etude in D Major op. 139 no, 33, Carl Czerny
   Where: beginning · Problem: play through the whole piece
🎹 Etude in Dm, Cornelius Gurlitt
   Where: 8-11 · Problem: learn notes w/ blocked chords HT w/ metronome
🎹 Impertinence, G. F. Handel
   Where: 13-16 · Problem: learn notes/trills/play d e t a c h e d · Fix: Slow 60bpm HS - 2 beat per bar detached
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 14-15 · Problem: notes/dynamics · Fix: Slow 60bpm
👂 Ear Training
   Where: RCM2 · Problem: Melody playback · Fix: Practice
#ThePracticeRoom #PianoPractice', '2026-05-03 20:56:53.494+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-03 20:56:53.494+00');

-- Denzel R Riwai · 2026-05-03
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'denzelriwai1@gmail.com', 'Denzel R Riwai', 'practice_log', '', 'Sunday 3 May 2026  ·  8h 51m
( My last practice was logged in the am so they''re both sitting on Sunday. )
Will only mention the important part -
Spent hours with a version of the C sharp minor prelude. That contains mistakes and differences to the sheet music. Tldr: I had to start again with the sheet music. And it''s painfully slow. Furious. Will learn this one piece faster out of spite.
I''m annoyed, so I won''t go in depth about everything I did today. But rest assured my hands were on the keys or figuring out what to press the entire time. I do this regularly, blocks of an hour plus during the day and night multiple times a day. Which is why the hours stack up quickly.
This is a reminder that sight reading is worth it even if it''s difficult and slow at first ..', '2026-05-03 14:06:08.277+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-03 14:06:08.277+00');

-- Cécile Dautriat · 2026-05-03
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', '🎹 Saturday 2 May 2026  ·  37 min
👁 Sight-reading
   Where: RCM2 · Problem: Prep · Fix: Ignore timer
🎼 Technique
   Where: G · Problem: 2-octave pattern in G+ · Fix: pattern @ 80bpm
🎹 Etude in Dm, Cornelius Gurlitt
   Where: 1-5 · Problem: learn notes w/ blocked chords HT / pedal?
🎹 Impertinence, G. F. Handel
   Where: 17-20 · Problem: learn notes/trills/play d e t a c h e d · Fix: Slow 60bpm HS - 2 beat per bar detached
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 16-25 · Problem: notes/dynamics · Fix: Slow 60bpm
🎹 Canon in Am, Cornelius Gurlitt — Record
👂 Ear Training
   Where: RCM2 · Problem: Rhythm/melody playback · Fix: Practice
#ThePracticeRoom #PianoPractice', '2026-05-03 00:20:19.954+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-03 00:20:19.954+00');

-- Connie Witzoe · 2026-05-02
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Saturday 2 May 2026  ·  10 min
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Went through bar 1-16 again and continued practicing bar 16-20
💬 Just been one of those days so only sat down for a little bit tonight. Day off tomorrow so will definitely get more time to practice then!
#ThePracticeRoom #PianoPractice', '2026-05-02 23:04:39.298+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-02 23:04:39.298+00');

-- Daniel Duordoe · 2026-05-02
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Saturday 2 May 2026  ·  20 min
🎹 Air on the G string — Batch 4 - 76% (17attempts); Batch 7 - 82% (11 attempts)
#ThePracticeRoom #PianoPractice
🎹 Saturday 2 May 2026  ·  5 min
🎼 C major scale, D Dorian, G Mixolydian, C major pentatonic, G major pentatonic, G major arpeggio, D minor arpeggio
#ThePracticeRoom #PianoPractice', '2026-05-02 18:45:05.325+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-02 18:45:05.325+00');

-- Denzel R Riwai · 2026-05-02
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'denzelriwai1@gmail.com', 'Denzel R Riwai', 'practice_log', '', '🎹 Sunday 3 May 2026  ·  8h 25m
📝 Rachmaninoff''s Prelude in G minor, and prelude in C sharp minor - Hey kids -Noragami Op, improvisation, and sight reading - I do 2 hours a day minimum, 4+ on average, yesterday I decided to learn Rach’s prelude so I''ve logged 16 or so hours over the last two days I''ll just log today''s tho.
had trouble with a few chords and the hand placement. I.e. Rach''s C sharp minor prelude wants a g#,b,g# triad in the left hand, the hand position is awkward though because its far to the right with the left hand. I''m thinking about pawning the second g# off to the right hand, I''m a tad worried about voicing, but I did some study, and Josef Hoffman had no trouble with a similar split in a recording from 1945. Timing issues with noragami''s Op '' Hey kids '' with both hands.. and splitting a few chords across hands in the g minor prelude for comfort. Should be figured out by the end of the week. Admittedly I only spent 20 minutes sight reading.. I should do more but it''s slower ( until it isn''t )', '2026-05-02 16:13:50.292+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-02 16:13:50.292+00');

-- Daniel Duordoe · 2026-05-02
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Saturday 2 May 2026  ·  45 min
🎹 Air on the G string — Batches 3 and 6
💬 Played through the song a couple of times as well. Getting there!
#ThePracticeRoom #PianoPractice', '2026-05-02 00:49:56.393+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-02 00:49:56.393+00');

-- Daniel Duordoe · 2026-05-02
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Friday 1 May 2026  ·  10 min
🎵 Improvisation — Played Frere Jacques in C,D,E,F,G,A,Bflat, Eflat,Aflat and Dflat major.
💬 Went better than I expected. I struggled with the D major though.
#ThePracticeRoom #PianoPractice', '2026-05-02 00:04:11.467+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-02 00:04:11.467+00');

-- Daniel Duordoe · 2026-05-02
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Friday 1 May 2026  ·  10 min
🎼 C major scale, G Mixolydian, D Dorian, C major pentatonic
#ThePracticeRoom #PianoPractice', '2026-05-02 00:00:09.688+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-02 00:00:09.688+00');

-- Cécile Dautriat · 2026-05-01
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', '🎹 Friday 1 May 2026  ·  40 min
👁 Sight-reading
   Where: RCM2 · Problem: key sig · Fix: Prepare faster
🎼 Technique
   Where: G · Problem: 2-octave pattern in G+ · Fix: contrary motion ok @ 80bpm
🎹 Etude in Dm, Cornelius Gurlitt
   Where: 1-end · Problem: learn notes w/ blocked chords HS
🎹 Impertinence, G. F. Handel
   Where: 17-20 · Problem: learn notes/trills/play d e t a c h e d · Fix: Slow 60bpm HS - 2 beat per bar detached
👂 Ear Training
   Where: RCM2 · Problem: Rhythm/melody playback · Fix: Practice
#ThePracticeRoom #PianoPractice', '2026-05-01 23:14:47.029+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-01 23:14:47.029+00');

-- Connie Witzoe · 2026-05-01
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Saturday 2 May 2026  ·  20 min
🎹 Clair de lune — Claude Debussy — Played through once
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Played through bar 1-16, and practiced bar 16-19 again
💬 Short again tonight because of getting home late from work, and also my brain just didn''t want to switch on to play properly tonight. · Short work day tomorrow so will hopefully practice more then 😊
#ThePracticeRoom #PianoPractice', '2026-05-01 23:03:05.458+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-01 23:03:05.458+00');

-- Kelly Williams · 2026-05-01
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'confi1@hotmail.com', 'Kelly Williams', 'practice_log', '', '🎹 Suite de la rejouissance - Daquin — This is getting much better. Increased the tempo without making mistakes.
🎹 Mixed
   Perfecting piece ready to record: · Spooky Wood Hollow - Hammond · Cloudy Day - Norton · Chromatic Rag - Fisher
👁 Sight-reading — Following piano safari
💬 Only managing small amounts recently, but still happy that there''s progress on pieces I''ve found tricky
#ThePracticeRoom #PianoPractice', '2026-05-01 19:37:21.383+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='confi1@hotmail.com' AND created_at='2026-05-01 19:37:21.383+00');

-- Luca Chiarella · 2026-05-01
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', '🎹 Friday 1 May 2026  ·  1h
🎼 Hanon
   45 BPM 16th notes · Exercises 7-8 · Needs work on both turnarounds
#ThePracticeRoom #PianoPractice', '2026-05-01 10:08:01.902+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-05-01 10:08:01.902+00');

-- Cécile Dautriat · 2026-05-01
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', '🎹 Thursday 30 April 2026  ·  45 min
👁 Sight-reading
   Where: RCM2 · Problem: too many · Fix: Read pattern
🎼 Technique — HT + contrary motion
🎹 Etude in Dm, Cornelius Gurlitt
   Where: 1-end · Problem: learn notes w/ blocked chords HS
🎹 Impertinence, G. F. Handel
   Where: 17-20 · Problem: learn notes/trills/play d e t a c h e d · Fix: Slow 60bpm HS - 2 beat per bar detached
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 16-25 · Problem: notes/dynamics · Fix: Slow 60bpm
🎹 Canon in Am, Cornelius Gurlitt
   Where: 1-8 · Problem: phrase shaping / dynamics / rests · Fix: record yourself
👂 Ear Training
   Where: RCM2 · Problem: Rhythm/melody playback · Fix: Practice
#ThePracticeRoom #PianoPractice', '2026-05-01 00:59:23.781+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-01 00:59:23.781+00');

-- Connie Witzoe · 2026-04-30
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Thursday 30 April 2026  ·  50 min
🎹 Clair de lune — Claude Debussy — Played through twice
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff
   Continued working on bar 1-16, but also started working on bar 16-19. Found an "app" where you can enter polyrythms to hear how it sounds to help with bar 19 onwards.
📝 D major scale and chords
   Went through the D Major scale and the chords in that scale using the Key Explorer.
#ThePracticeRoom #PianoPractice', '2026-04-30 22:33:30.104+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-30 22:33:30.104+00');

-- Daniel Duordoe · 2026-04-30
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Thursday 30 April 2026  ·  15 min
🎼 D Dorian, G Mixolydian, C major scale, C major pentatonic — Straight and swing, both hands, 2 octaves
💬 First time practicing jazz scales
#ThePracticeRoom #PianoPractice', '2026-04-30 22:15:56.425+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-04-30 22:15:56.425+00');

-- Daniel Duordoe · 2026-04-30
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Thursday 30 April 2026  ·  15 min
👂 Ear Training — Played edelweiss by ear/from memory
💬 Went ok. Haven''t played it months.
#ThePracticeRoom #PianoPractice', '2026-04-30 22:15:19.807+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-04-30 22:15:19.807+00');

-- Luca Chiarella · 2026-04-30
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', '🎹 Thursday 30 April 2026  ·  1h 35m
🎹 Consolation, Burgmuller
   Full piece · Need work on bars14-15 18-19
🎼 Hanon
   50 BPM 16th notes · Exercises 1 to 6 throw hands. · Exercise 7 hand separately
#ThePracticeRoom #PianoPractice', '2026-04-30 20:55:59.324+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-04-30 20:55:59.324+00');

-- Daniel Duordoe · 2026-04-30
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Thursday 30 April 2026  ·  10 min
🎹 Air on the G string by Bach — Batch 3 and 6
💬 Batch 3 - 100% and batch 6 - 75%. Both cleared.
#ThePracticeRoom #PianoPractice', '2026-04-30 20:48:08.955+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-04-30 20:48:08.955+00');

-- Luca Chiarella · 2026-04-30
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', '🎹 Thursday 30 April 2026  ·  1h 35m
🎹 Piece
🎼 Hanon
   50 BPM 16th notes · Exercises 1 to 6 throw hands. · Exercise 7 hand separately
#ThePracticeRoom #PianoPractice', '2026-04-30 14:21:14.556+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-04-30 14:21:14.556+00');

-- Cécile Dautriat · 2026-04-30
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', '🎹 Wednesday 29 April 2026  ·  37 min
👁 Sight-reading
   Where: RCM2 · Problem: Rhythm · Fix: Read pattern
🎼 Technique — G- staccato attempt
🎹 Etude in Dm, Cornelius Gurlitt
   Where: 1-end · Problem: learn notes w/ blocked chords HS
🎹 Impertinence, G. F. Handel
   Where: 17-20 · Problem: learn notes/trills/play d e t a c h e d · Fix: Slow 60bpm HS - 2 beat per bar detached
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 16-25 · Problem: notes/dynamics · Fix: Slow 60bpm
🎹 Canon in Am, Cornelius Gurlitt
   Where: 1-8 · Problem: speed · Fix: eyes on the score 120 bpm
👂 Ear Training
   Where: RCM2 · Problem: Rhythm/melody playback · Fix: Practice
#ThePracticeRoom #PianoPractice', '2026-04-30 00:38:28.303+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-04-30 00:38:28.303+00');

-- Daniel Duordoe · 2026-04-29
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Wednesday 29 April 2026  ·  15 min
🎹 Air on the G string by Bach — Batch 3 and 6
💬 Batch 3 - 67% (10 attempts) · Batch 6 - 80% (9 attempts)
#ThePracticeRoom #PianoPractice', '2026-04-29 22:53:09.348+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-04-29 22:53:09.348+00');

-- Connie Witzoe · 2026-04-29
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Wednesday 29 April 2026  ·  10 min
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — 1-16 again
💬 Didn''t have much time today because of work and other stuff going on tonight. Hopefully an uneventful night tomorrow with more time to practice then after work.
#ThePracticeRoom #PianoPractice', '2026-04-29 22:30:59.372+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-29 22:30:59.372+00');

-- Luca Chiarella · 2026-04-29
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', '🎹 Wednesday 29 April 2026  ·  1h 50m
🎼 Hanon
   50bpm 16th notes · 1--2-3-4 exercises
🎹 Farewell, Burgmuller — Full piece
🎹 A sky full of stars — Intro, 2 hands
#ThePracticeRoom #PianoPractice', '2026-04-29 22:09:17.041+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-04-29 22:09:17.041+00');

-- Connie Witzoe · 2026-04-28
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Tuesday 28 April 2026  ·  56 min
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff — Worked on bar 10-16 again and replayed 1-10 through to 16
🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through once
🎹 Clair de lune — Claude Debussy — Played through once
#ThePracticeRoom #PianoPractice', '2026-04-28 22:43:26.301+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-28 22:43:26.301+00');

-- Cécile Dautriat · 2026-04-28
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', '🎹 Tuesday 28 April 2026  ·  42 min
👁 Sight-reading
   Where: RCM2 · Problem: None · Fix: Read pattern
🎼 Technique
   Problem: 2-octave pattern in G+ · Fix: contrary motion ok @ 80bpm - speed up next · Duration (minutes): 5
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 20 · Problem: notes/dynamics · Fix: Slow 60bpm
🎹 Impertinence, G. F. Handel
   Where: 17-20 · Problem: learn notes/trills/play d e t a c h e d · Fix: Slow 60bpm HS - 2 beat per bar detached
🎹 Canon in Am, Cornelius Gurlitt
   Where: 1-8 · Problem: speed · Fix: eyes on the score / 112-120bpm reps
🎹 The Sick Doll, Pyotr Ilyich Tchaikovsky
   Where: 1-end x1 · Problem: dynamics/pedalling/form · Fix: record video
👂 Ear Training
   Where: RCM2 · Problem: Rhythm/melody playback · Fix: Practice
#ThePracticeRoom #PianoPractice', '2026-04-28 21:12:52.239+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-04-28 21:12:52.239+00');

-- Daniel Duordoe · 2026-04-28
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Tuesday 28 April 2026  ·  20 min
🎹 Air on the G string by Bach — Batch 2, 6 and 7
💬 Batch 2 - 88% accuracy, batch 6 - 50% accuracy, batch 7 - 75% accuracy
#ThePracticeRoom #PianoPractice', '2026-04-28 19:48:43.173+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-04-28 19:48:43.173+00');

-- Norman Jaillet · 2026-04-28
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'norman.jaillet@gmail.com', 'Norman Jaillet', 'practice_log', '', 'I decided to log on a weekly basis.
Total practice - 
24) 40 min
25) 74 min
26) 62 min
27) 76 min
28) 57 min (so far 🙂)
Sessions are made up of student recital pieces (feeling really good):
Chopin Preludes 4 and 7 (listening to different interpretations as well)
Schumann of Foreign Lands and Peoples (coming along)
Practice the Teachers part for me to duet with a beginner (85-year-old lady) for the recital. Very short and simple Mozart piece, but I can’t screw it up for the recital. ;)
Other
Hanon-Faber New Virtuoso Pianist exercises 
Sight-read Prelude in B minor … very slow .. trying to determine if it’s above my pay grade before investing time! ;)
Chopin - Waltz in A minor
Honor Him/ Now We Are Free from Gladiator
I Vow to Thee My Country Thaxted 1921 (Gustav Holst)
Getting the time in, my goal is 2 hours/day, haven’t hit it yet.', '2026-04-28 12:17:35.392+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-04-28 12:17:35.392+00');

-- Connie Witzoe · 2026-04-27
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Monday 27 April 2026  ·  1h 43m
🎹 Prelude Op. 23 No. 4 — Sergei Rachmaninoff
   Worked up until bar 16, repeating bar 10-16 mainly trying to memorize it, but also repeating 1-10 from yesterday
🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Played through once as per request from my son 😅
🎹 Clair de lune — Claude Debussy — Played through once
💬 I notice how Clair De Lune (which I didn''t learn by reading the sheet music), starts to go to the back of my brain when I put my full focus on a new piece, and just going a couple of days without playing it I started forgetting some parts. I now feel like I''ll have to play it at least once every day to remember it all, at the beginning of my practice sessions.
#ThePracticeRoom #PianoPractice', '2026-04-27 22:09:35.761+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-27 22:09:35.761+00');

-- Daniel Duordoe · 2026-04-27
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Monday 27 April 2026  ·  1h 15m
🎹 Air on the G string by Bach — Batch 2, 5 and 7.
💬 Batch 7 needs a lot of work. Metronome revealed a lot of issues that need fixing. Will try again tomorrow after a good night''s rest.
#ThePracticeRoom #PianoPractice', '2026-04-27 20:08:19.009+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-04-27 20:08:19.009+00');

-- Kelly Williams · 2026-04-27
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'confi1@hotmail.com', 'Kelly Williams', 'practice_log', '', '🎹 Suite de la rejouissance - Daquin
   This is definitely getting better now, still needs to brought all together at the right tempo. I plan to do this gradually to avoid making mistakes
🎹 Mixed
   Perfecting piece ready to record: · Spooky Wood Hollow - Hammond · Cloudy Day - Norton · Chromatic Rag - Fisher
👁 Sight-reading — Sight-reading — Following piano safari
🎼 Chromatic scale, C major scale
💬 Today went well on the pieces, the sight reading was tricky.  I might try and learn another new piece while continuing with the current ones.
#ThePracticeRoom #PianoPractice', '2026-04-27 17:03:38.469+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='confi1@hotmail.com' AND created_at='2026-04-27 17:03:38.469+00');

-- Sonus Lucis · 2026-04-27
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'steve@sonuslucis.com', 'Sonus Lucis', 'practice_log', '', '', '2026-04-27 13:23:07.695+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='steve@sonuslucis.com' AND created_at='2026-04-27 13:23:07.695+00');

-- Luca Chiarella · 2026-04-27
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', '🎹 Monday 27 April 2026  ·  35 min
🎼 Hanon — 100bpm exercises 1-2-3 both hands
🎹 La Chasse, Burgmuller — Full poece
🎹 Tendre Fleur, Burgmuller — Full piece,
#ThePracticeRoom #PianoPractice', '2026-04-27 11:16:48.089+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-04-27 11:16:48.089+00');

-- Connie Witzoe · 2026-04-26
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Sunday 26 April 2026  ·  1h 30m
🎹 Prelude op. 23 no. 4, Rachmaninoff
   Worked my way up to bar 11, and repeated over and over to get it all right before moving on tomorrow.
🎹 Piece
💬 I honestly don''t know how long I played for today. Could''ve been an hour. Could''ve been 2. Sat down whenever I got a chance throughout the day (kids keeping me busy) for 5-10 min here and there, and longer in the evening. · Really enjoying learning this piece so far.
#ThePracticeRoom #PianoPractice', '2026-04-26 22:43:50.078+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-26 22:43:50.078+00');

-- Daniel Duordoe · 2026-04-26
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Sunday 26 April 2026  ·  2h
📝 Watched some tutorials on hand coordination, mental practice and why our piano progress is slow.
   1. Most pop songs are based on similar rhythm patterns. 2. Sometimes mental practice can be just as beneficial or even more beneficial than physical practice. 3. Correct mistakes in your pieces as you learn them; slow down the tempo so you can catch the mistakes better. Slowing it down can help you progress faster.
#ThePracticeRoom #PianoPractice', '2026-04-26 22:36:17.858+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-04-26 22:36:17.858+00');

-- Luca Chiarella · 2026-04-26
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', '🎹 Sunday 26 April 2026  ·  30 min
🎹 La gracieuse, Burgmuller — Full piece 60% speed
🎹 La Chasse
   Full piece 60% Speed · Needs more work on bars 35-36
#ThePracticeRoom #PianoPractice', '2026-04-26 21:55:11.251+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-04-26 21:55:11.251+00');

-- Michael Page · 2026-04-26
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'michaelpage05@hotmail.co.uk', 'Michael Page', 'practice_log', '', '🎼 C major scale — Both hands @105x5 
🎼 A melodic minor scale Left hand @100x5 · Right hand @100x5 
🎼 A harmonic minor scale Left hand @100x5 · Right hand @100x5 
🎹 Dreamfall by Pianote 
🎹 Melodic Study in C major, Op. 599, No. 1 — Carl Czerny — Finding it difficult to read the note instead of the finger numbering. 

#ThePracticeRoom #PianoPractice', '2026-04-26 17:34:21.148+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-04-26 17:34:21.148+00');

-- Cécile Dautriat · 2026-04-26
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', '🎹 Sunday 26 April 2026  ·  37 min
👁 Sight-reading
   Where: RCM2 · Problem: Rhythm · Fix: Prepare/count
🎼 G major scale
   Where: G · Problem: 2-octave pattern in G+ · Fix: Isolate - only play the contrary motion part
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 22-25 · Problem: LH too loud / no staccato · Fix: Slow 60bpm
🎹 Canon in Am, Cornelius Gurlitt
   Where: 1-8 · Problem: dynamics @ 80bpm · Fix: eyes on the score / 70+bpm reps
🎹 The Sick Doll, Pyotr Ilyich Tchaikovsky
   Where: 1-end x1 · Problem: dynamics/pedalling · Fix: use pedal, push dynamics (f forte and pull back at the end of sentences)
👂 Ear Training
   Where: RCM2 · Problem: Rhythm/melody playback · Fix: Practice
#ThePracticeRoom #PianoPractice', '2026-04-26 17:19:55.731+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-04-26 17:19:55.731+00');

-- Wendy Grimshaw · 2026-04-26
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'wg33@live.co.uk', 'Wendy Grimshaw', 'practice_log', '', '🎹 Sunday 26 April 2026  ·  50 min
🎼 Voicing
   Jb duveroy op176 nr20 voicing study tempo 100 (1 beat for each 1/8  note) went well at this tempo, nice and even
🎹 Czerny legato phrasing op599 nr 19 — Played through,  focusing on phrasing and dynamics
🎹 Czerny swing 100 recreations nr 19 — Focused on even left hand and swaying rhythm of right hand
🎹 Clementi Aretta op42 nr 5 — First run through hands together very slowly
🎼 C major arpeggio — Learning finger pattern for both hands inarpeggios,  never done them before.
💬 Very good practice session,  I felt like I made quite a bit of progress on all the things I attempted.
#ThePracticeRoom #PianoPractice', '2026-04-26 17:10:40.179+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='wg33@live.co.uk' AND created_at='2026-04-26 17:10:40.179+00');

-- Connie Witzoe · 2026-04-25
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Saturday 25 April 2026  ·  55 min
📝 D major scale and chord scale
   Playing around with the D major scale and chords with it to familiarize myself with it because of the impossible new ambitious piece I''ve decided to learn.
🎹 Prelude in D Major, op. 23, no. 4 by Rachmaninoff
   Worked on the first 4-5 bars and watched videos on how on earth it''s meant to be played 🙈 · What have I gotten myself in to...
🎹 Moonlight Sonata — 1st movement (Op. 27, No. 2) — Ludwig van Beethoven — Just played through it a couple of times
🎹 Clair de lune — Claude Debussy — Played through it once
🎹 Prelude in E minor, Chopin — Played through it a couple of times
💬 I''ve listened to this Rachmaninoff Prelude on repeat for days and I just have to learn it at some point. So I''ll just do little by little and see where it gets me.
#ThePracticeRoom #PianoPractice', '2026-04-25 21:53:29.236+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-25 21:53:29.236+00');

-- Daniel Duordoe · 2026-04-25
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Saturday 25 April 2026  ·  15 min
📝 Watched a tutorial on the dominant 7th — Built on the fifth scale degree with an added 7th.
💬 This chord serves three crucial roles: confirming your key by eliminating other scale possibilities, ending phrases with the finality of a perfect cadence, and enabling seamless key changes. 
#ThePracticeRoom #PianoPractice', '2026-04-25 16:05:07.676+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-04-25 16:05:07.676+00');

-- Daniel Duordoe · 2026-04-25
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Saturday 25 April 2026  ·  15 min
📝 Other — Watched a tutorial on how long it takes to learn the piano.
💬 It''s more about having more meaningful exposures than having overly long sessions. Deliberate practice and spaced repetition are helpful.
#ThePracticeRoom #PianoPractice', '2026-04-25 15:44:50.291+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-04-25 15:44:50.291+00');

-- Daniel Duordoe · 2026-04-25
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Friday 24 April 2026  ·  1h
🎹 Air on the G string by Bach
   I played through the piece several times. I even tried to improvise some sections- disaster!
💬 Happy with the session. I am getting there.
#ThePracticeRoom #PianoPractice', '2026-04-25 13:16:24.928+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-04-25 13:16:24.928+00');

-- Luca Chiarella · 2026-04-25
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', '🎹 Saturday 25 April 2026  ·  30 min
🎼 Left hand boogie pattern
   Various left hand boogie patterns in C 12bar blues. · Right hand accompanying in easy improvisation
#ThePracticeRoom #PianoPractice', '2026-04-25 09:03:44.055+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-04-25 09:03:44.055+00');

-- Cécile Dautriat · 2026-04-25
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', '🎹 Friday 24 April 2026  ·  37 min
👁 Sight-reading
   Where: RCM2 · Problem: Rhythm · Fix: Prepare/count
🎼 Technique
🎹 Razzle Dazzle, Ailbhe McDonagh
   Where: 22-25 · Problem: LH too loud / dynamics · Fix: Slow 50bpm
🎹 Canon in Am, Cornelius Gurlitt
   Where: 1-8 · Problem: learn notes/dynamics · Fix: eyes on the score
🎹 The Sick Doll, Pyotr Ilyich Tchaikovsky
   Where: 1-end x1 · Problem: look down · Fix: listen and look at the score
👂 Ear Training
   Where: RCM2 · Problem: Rhythm/melody playback · Fix: Practice
💬 Learn pieces without looking down from the get-go
#ThePracticeRoom #PianoPractice', '2026-04-25 00:45:44.070+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-04-25 00:45:44.070+00');

-- Connie Witzoe · 2026-04-24
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Friday 24 April 2026  ·  30 min
🎹 Prelude in E minor, Chopin — Practicing the whole piece but especially bar 16-19. Over and over 😅
💬 Didn''t have much time to practice today as I came home late from work, but a little is better than nothing  :)
#ThePracticeRoom #PianoPractice', '2026-04-24 22:11:58.322+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-24 22:11:58.322+00');

-- Luca Chiarella · 2026-04-24
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'practice_log', '', '🎹 Friday 24 April 2026  ·  55 min
🎹 La candeur Burgmuller
🎹 Arabesque (Op. 100, No. 2) — Friedrich Burgmüller
🎹 Pastorale, Burgmuller
🎹 La petite reunion, Burgmuller
🎹 Innocence, Burgmuller
🎹 Progress, Burgmuller
🎹 Le courant limpide, Burgmuller
🎹 Pathétique Sonata — 1st movement (Op. 13) — Ludwig van Beethoven
💬 Just went through pieces I already knew. · As always, Burgmuller not full speed. Probably 70%
#ThePracticeRoom #PianoPractice', '2026-04-24 20:41:15.553+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-04-24 20:41:15.553+00');

-- Michael Page · 2026-04-24
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'michaelpage05@hotmail.co.uk', 'Michael Page', 'practice_log', '', '🎼 C major scale — Both hands @100x5
🎼 A melodic minor scale — Right hand @100x5
🎼 A harmonic minor scale — Right hand @100x5
🎹 Dreamfall by Pianote
🎹 Melodic Study in C major, Op. 599, No. 1 — Carl Czerny
#ThePracticeRoom #PianoPractice', '2026-04-24 14:30:09.078+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-04-24 14:30:09.078+00');

-- Kelly Williams · 2026-04-24
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'confi1@hotmail.com', 'Kelly Williams', 'practice_log', '', '🎹 Suite de la rejouissance - Daquin
   I started at half way through today to try and get it to the same playing level as the first half. I ''think'' it might have helped!
🎹 Piece
   Perfecting piece ready to record: · Spooky Wood Hollow - Hammond Cloudy Day - Norton · Chromatic Rag - Fisher
💬 I knew I had less time to practice today, so decided to use the time to go over things I''ve been working on, instead of introducing anything new.
#ThePracticeRoom #PianoPractice', '2026-04-24 13:13:59.787+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='confi1@hotmail.com' AND created_at='2026-04-24 13:13:59.787+00');

-- Daniel Duordoe · 2026-04-24
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Thursday 23 April 2026  ·  30 min
🎹 Air on the G string by Bach — Worked on batches 1,4 and 6
💬 Batch was was inconsistent and batch 6 needs a lot of work. Batch 4 was ok.
#ThePracticeRoom #PianoPractice', '2026-04-24 07:08:55.950+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-04-24 07:08:55.950+00');

-- Connie Witzoe · 2026-04-23
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'connieuitsu@gmail.com', 'Connie Witzoe', 'practice_log', '', '🎹 Thursday 23 April 2026  ·  45 min
🎹 Clair de lune — Claude Debussy
   Playing through the whole piece, but especially working on the new fingering positions in the arpeggios in bar 29-30 as that''s been wrong this whole time according to my teacher. · Also trying to work on correcting a mistake in bar 33. It''s challenging because I''ve been playing it a certain way for months and now have to get used to new fingering positions so it feels like going back to the start again.
🎵 Improvisation — Improvisation and scales in C minor
#ThePracticeRoom #PianoPractice', '2026-04-23 21:51:45.133+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-23 21:51:45.133+00');

-- Cécile Dautriat · 2026-04-23
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'practice_log', '', '🎹 Thursday 23 April 2026  ·  45 min
👁 Sight-reading
   Where: RCM2 · Problem: Rhythm · Fix: Prepare/count
🎼 Technique
   Problem: solid/broken chords HT · Fix: get it right at a slow tempo
🎹 Razzle Dazzle, Ailbhe McDonagh
   Problem: LH too loud / dynamics / G+ scales in C+ key? · Fix: Slow 60bpm / look up c-lydian mode
🎹 Canon in Am, Cornelius Gurlitt
   Where: 5-8 · Problem: forget the rests · Fix: eyes on the score
🎹 Impertinence, G. F. Handel
   Where: 17-20 · Problem: trills/play d e t a c h e d · Fix: Slow 60bpm / do scales d  e   t   a   c   h  e   d
👂 Ear Training
   Where: RCM2 · Problem: Rhythm/melody playback · Fix: Practice
#ThePracticeRoom #PianoPractice', '2026-04-23 21:36:35.621+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-04-23 21:36:35.621+00');

-- Norman Jaillet · 2026-04-23
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'norman.jaillet@gmail.com', 'Norman Jaillet', 'practice_log', '', '20 min  - short as I had work and heading to a hockey game! ;)
Chopin Prelude 4 and 7 recital prep 
Schumann - Of Foreign Lands and Peoples  - slow. repeating where i stumble and/or lose tempo', '2026-04-23 20:17:14.290+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-04-23 20:17:14.290+00');

-- Michael Page · 2026-04-23
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'michaelpage05@hotmail.co.uk', 'Michael Page', 'practice_log', '', '🎼 C major scale, A minor scale — Both hands @ 100 bmp x5
🎼 A harmonic minor scale — First time playing
🎹 Melodic Study in C major, Op. 599, No. 1 — Carl Czerny — First time playing
🎹 Dreamfall by Pianote
🎼 A melodic minor scale — First time playing
💬 Quich weekday practice
#ThePracticeRoom #PianoPractice', '2026-04-23 17:00:33.350+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-04-23 17:00:33.350+00');

-- Kelly Williams · 2026-04-23
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'confi1@hotmail.com', 'Kelly Williams', 'practice_log', '', '🎹 Suite de la rejouissance - Daquin
   Playing hands together - better than yesterday. The first half seems better than the second where articulation switches. Next time I''ll focus on the second part first
🎹 Mixed.
   Spooky Wood Hollow - Hammond — Perfecting piece ready to record · Cloudy Day - Norton — Perfecting piece ready to record · Chromatic Rag - Fisher — Perfecting piece ready to record
👁 Sight-reading — Following piano safari. Only did a small amount today
🎼 Octave scales
   This is one I''ll need to do bit by bit because it''s a stretch for me and difficult to stay relaxed
💬 Today felt like it went much better than yesterday!!
#ThePracticeRoom #PianoPractice', '2026-04-23 16:44:18.631+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='confi1@hotmail.com' AND created_at='2026-04-23 16:44:18.631+00');

-- Daniel Duordoe · 2026-04-23
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'practice_log', '', '🎹 Wednesday 22 April 2026  ·  30 min
🎹 Air on the G string by Bach — I did batches 4 & 5
👂 Ear Training — Watched a video on ear training
#ThePracticeRoom #PianoPractice', '2026-04-23 07:08:46.313+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-04-23 07:08:46.313+00');

-- Larah Szemczak · 2026-04-23
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'larahnja@gmail.com', 'Larah Szemczak', 'practice_log', '', '🎼 A major scale, A major arpeggio, F# major scale
   Hands together, finger transitions and agility. Worked on similar motion in thirds and sixths, and contrary motion. Used the ABRSM Manual of Scales, Arpeggios and Broken Chords (1980).
🎹 No. 1 from Mikrokosmos, Volume 1: Six Unison Melodies — Béla Bartók — Sight-reading.
🎹 Gymnopédie No. 1 — Erik Satie
   Worked on the first 12 bars. Practiced hands separately and then together. It felt manageable, but I struggled a bit with fingering choices in both hands. I also noticed that although I memorized the notes quickly, I made several mistakes when playing (e.g., confusing nearby notes like B, A, and G).
📝 Free play
   Spent the last 10 minutes playing pieces I already know, focusing on enjoyment and correcting small mistakes.
#ThePracticeRoom #PianoPractice', '2026-04-23 00:49:33.354+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='larahnja@gmail.com' AND created_at='2026-04-23 00:49:33.354+00');

-- Lucas França · 2026-04-22
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'lucas.fr6@gmail.com', 'Lucas França', 'practice_log', '', '🎹 Hanon No. 1 (library request)
🎹 Hanon No. 2 (library request)
🎼 C major scale, D major scale, E major scale, F major scale, G major scale, A major scale, B major scale — In 2 octaves
🎹 Adiyo Kerida — Working on rhythm and dotted notes.
🎹 Minuet in F major (K. 2) — Wolfgang Amadeus Mozart — New piece: working on left hand for the first 4 bars.
💬 Hanon technique corrections becoming more natural. No problems with scales in 2 octaves across all sharps and F major. Finally starting to make Adiyo Kerida sound good. New piece... :)
#ThePracticeRoom #PianoPractice', '2026-04-22 23:12:04.534+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='lucas.fr6@gmail.com' AND created_at='2026-04-22 23:12:04.534+00');

-- Norman Jaillet · 2026-04-22
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'norman.jaillet@gmail.com', 'Norman Jaillet', 'practice_log', '', 'Total practice - 
Session 1 (34 min)
Hanon-Faber New Virtuoso Pianist exercises 
Hanon C (alt legato up/staccato down)
Chopin Prelude 4 and 7 recital prep - working on musicality based on listening to how the pro’s do it - rinse and repeat - mindful of the pedal
Sight-read Prelude in B minor … very slow .. trying to determine if it’s above my pay grade before investing time! ;)
Session 2 (35 min)
Practice the Teachers part for me to duet with a beginner (85-year-old lady) for the recital. Very short and simple Mozart piece, but I can’t screw it up for the recital. ;)
Schumann - Of Foreign Lands and Peoples - very slow 4 measures at a time - striving for accuracy
Chopin - Waltz in A minor - I started this piece months ago but put it on the shelf as I suck at jumps (checked out Matt’s Chopin Waltz Style tips)', '2026-04-22 21:20:48.213+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-04-22 21:20:48.213+00');

-- Alexey Peshekhonov · 2026-04-22
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'alexey@peshekhonov.com', 'Alexey Peshekhonov', 'practice_log', '', '🎹 Wednesday 22 April 2026  ·  50 min
🎹 Comptine d`un autre ete (beginner version) — Adding left hand to a melody. No mistakes on slow tempo.
🎼 Technique — A teacher explaining technique and validating my technique
#ThePracticeRoom #PianoPractice', '2026-04-22 20:48:03.762+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='alexey@peshekhonov.com' AND created_at='2026-04-22 20:48:03.762+00');

-- Kelly Williams · 2026-04-22
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'confi1@hotmail.com', 'Kelly Williams', 'practice_log', '', '🎹 Suite de la rejouissance - Daquin
   Playing hands together and trying to increase the tempo. The mixed articulation changing throughout has been challenging, so going slowly and building up gradually.
🎹 Spooky Wood Hollow - Hammond — Perfecting piece ready to record
🎹 Cloudy Day - Norton — Perfecting piece ready to record
🎹 Chromatic Rag - Fisher — Perfecting piece ready to record
🎹 Minuet in F major (K. 2) — Wolfgang Amadeus Mozart
   Going very slowly. Hands separate seems ok, but when I bringing hands together it starts to fall apart - loosing rhythm, holding notes longer, pauses
👁 Sight-reading
   Following piano safari. One in particular was very challenging, I don''t think I was really sight-reading but I think it was purposely challenging
🎼 Chromatic scale
   Started off well, then got worse! Reading the fingering seems to throw me off instead of just playing the scale
💬 Suite de la rejouissance seems to be coming together gradually. When I first started this one it seemed impossible to bring hands together. This will be about bringing the tempo right down and steadily increasing. · Sight-reading was tough today, but they were particularly challenging
#ThePracticeRoom #PianoPractice', '2026-04-22 17:09:00.819+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='confi1@hotmail.com' AND created_at='2026-04-22 17:09:00.819+00');

-- Michael Page · 2026-04-22
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'michaelpage05@hotmail.co.uk', 'Michael Page', 'practice_log', '', '🎹 Wednesday 22 April 2026  ·  15 min
🎹 Dreamfall by Pianote — Played through twice. Still not got is 100%
🎼 C major scale — Both hands @ 100 bpm quarter notes
🎼 A minor scale — Both hands @ 100 bpm quarter notes
💬 Weekday 15-minute practice
#ThePracticeRoom #PianoPractice', '2026-04-22 15:20:04.569+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-04-22 15:20:04.569+00');

-- Mike Flander · 2026-04-22
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'mflander4@gmail.com', 'Mike Flander', 'practice_log', '', '🎹 Wednesday 22 April 2026  ·  32 min
🎹 You''ve Got a Friend in Me
   Have the piece in my fingers, I am now working on bringing it up to speed with a metronome and identifying the spots to work on. Today I played it around 62 bpm with a couple trip up spots to work on. Recorded my first progress midi of this song.
🎹 Peter and the Wolf — Started working on getting section 2 under in my fingers.
🎼 F major scale — Quick warm up before my pieces
💬 Good session. Putting your fingers on the keys is the best way to start a day. 
#ThePracticeRoom #PianoPractice', '2026-04-22 13:53:56.356+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='mflander4@gmail.com' AND created_at='2026-04-22 13:53:56.356+00');

-- Matthew Cawood · 2026-04-20
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'matthew@matthewcawood.com', 'Matthew Cawood', 'practice_log', '', '🎼 Ab major scale, Ab major arpeggio, Eb dominant 7th arpeggio, C# natural minor scale, C# harmonic minor scale, C# melodic minor scale — Related scales and arpeggios to the pieces.
🎹 Prelude in Jazz Style Op 53. No. 14 — Nikolai Kapustin
   Touching up the first 16 bars. Focussed down into accuracy with large chord jumps - slowed down and isolated then built back into context.
🎹 Fantaisie Impromptu (Op. 66) — Frédéric Chopin
   Reinforcing coordination of polyrhythms. Session 3 of polyrhythm work, want it to feel intuitive before increasing speed and letting muscle memory take over. Focussed on staying "p" and understated so that it becomes the natural way of playing that section.
💬 Productive, get to work quickly. Knew what I needed to work on so didn''t need to play them through before hand. Played through the Kapustin after working on it to see if the jumps fit in natural context at speed.
#ThePracticeRoom #PianoPractice', '2026-04-20 18:21:34.940+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-20 18:21:34.940+00');

-- Matthew Cawood · 2026-04-09
INSERT INTO community_posts (email, name, type, title, content, created_at, session_id)
  SELECT 'matthew@matthewcawood.com', 'Matthew Cawood', 'practice_log', '', 'This is your space to track progress and stay accountable. 
The easiest way to post here? Use the Practice Hub over on the resources site.
It guides you through logging your session: what you worked on, how long, with any notes you have on the session (what went well, what you struggled with). When you save it, it generates a ready-to-share summary. Just hit Copy Session and paste it right here.
Your practice gets logged on the Practice Hub site (with stats, streaks, and your full history). So why post here?
It keeps you accountable, even on the tough days
Others can cheer you on and share what''s working for them
Looking back on a feed full of your sessions is genuinely motivating
Don''t overthink it. A quick log is better than a perfect one. The more consistently you post, the more patterns you''ll start to notice in your own playing.', '2026-04-09 21:02:56.390+00', NULL
  WHERE NOT EXISTS (SELECT 1 FROM community_posts WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-09 21:02:56.390+00');


-- ── 2. COMMENTS ─────────────────────────────────────────────────

-- wednesday-22-april-2026-32-min-you-ve-go · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='mflander4@gmail.com' AND created_at='2026-04-22 13:53:56.356+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','Great work, You’ve Got a friend in Me is such a great song!','2026-04-22 14:01:48.745+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-22 14:01:48.745+00');

-- wednesday-22-april-2026-1h-20m · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='confi1@hotmail.com' AND created_at='2026-04-22 17:09:00.819+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','Nice work! A long session, looks like you got quite a lot done!','2026-04-22 17:37:34.878+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-22 17:37:34.878+00');

-- reply to Matthew Cawood by Kelly Williams
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='confi1@hotmail.com' AND created_at='2026-04-22 17:09:00.819+00' LIMIT 1),'confi1@hotmail.com','Kelly Williams','somehow it feels like I should always do more!! 😅','2026-04-22 17:41:06.126+00',(SELECT id FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-22 17:37:34.878+00' AND post_id=(SELECT id FROM community_posts WHERE email='confi1@hotmail.com' AND created_at='2026-04-22 17:09:00.819+00' LIMIT 1) LIMIT 1),'Matthew Cawood'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='confi1@hotmail.com' AND created_at='2026-04-22 17:41:06.126+00');

-- reply to Matthew Cawood by Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='confi1@hotmail.com' AND created_at='2026-04-22 17:09:00.819+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','That’s the curse of being a pianist 😂','2026-04-22 17:49:57.309+00',(SELECT id FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-22 17:37:34.878+00' AND post_id=(SELECT id FROM community_posts WHERE email='confi1@hotmail.com' AND created_at='2026-04-22 17:09:00.819+00' LIMIT 1) LIMIT 1),'Matthew Cawood'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-22 17:49:57.309+00');

-- thursday-23-april-2026-50-min · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='confi1@hotmail.com' AND created_at='2026-04-23 16:44:18.631+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','Your killing it with the practice Kelly! 🫢','2026-04-23 16:55:42.963+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-23 16:55:42.963+00');

-- thursday-23-april-2026-24-min · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-04-23 17:00:33.350+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','Good consistency with the scales and pieces, keeping your core scales and pieces and slowly adding new ones in is the perfect way to do it.','2026-04-23 22:48:25.423+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-23 22:48:25.423+00');

-- reply to Matthew Cawood by Michael Page
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-04-23 17:00:33.350+00' LIMIT 1),'michaelpage05@hotmail.co.uk','Michael Page','Thank you. I don’t have a lot of time during the week. But try to do 15 minutes a day. I plan to add some sight reading today.','2026-04-24 06:27:53.596+00',(SELECT id FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-23 22:48:25.423+00' AND post_id=(SELECT id FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-04-23 17:00:33.350+00' LIMIT 1) LIMIT 1),'Matthew Cawood'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-04-24 06:27:53.596+00');

-- norman-s-log-apr-23-26 · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-04-23 20:17:14.290+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','20 minutes is still a good session to get in. Many people would leave it, so nice work getting it done. 😀','2026-04-23 22:46:37.526+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-23 22:46:37.526+00');

-- 20260423 · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-04-23 21:36:35.621+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','Nice! A full session!','2026-04-23 22:34:15.535+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-23 22:34:15.535+00');

-- thursday-23-april-2026-45-min-clair-de · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-23 21:51:45.133+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','Nice work, it’s always fun having to relearn something! Nice to see some improvisation in there as well! Your smashing it.','2026-04-23 22:35:49.601+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-23 22:35:49.601+00');

-- reply to Matthew Cawood by Connie Witzoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-23 21:51:45.133+00' LIMIT 1),'connieuitsu@gmail.com','Connie Witzoe','I''ve only ever improvised in the C Major scale but I know I have to practice all the other scales and it was fun doing it that way. :)','2026-04-23 22:43:20.482+00',(SELECT id FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-23 22:35:49.601+00' AND post_id=(SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-23 21:51:45.133+00' LIMIT 1) LIMIT 1),'Matthew Cawood'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-23 22:43:20.482+00');

-- friday-24-april-2026-55-min-la-candeur · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-04-24 20:41:15.553+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','That’s some series Burgmuller-ing. A nice set of pieces though and they are very good for technique. The Pathetique is a classic!','2026-04-24 21:38:06.807+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-24 21:38:06.807+00');

-- friday-24-april-2026-30-min-prelude-in-e · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-24 22:11:58.322+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','ahhh bar 16 to 19…everything in that piece is leading to that epic but awkward part!','2026-04-24 23:40:59.232+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-24 23:40:59.232+00');

-- reply to Matthew Cawood by Connie Witzoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-24 22:11:58.322+00' LIMIT 1),'connieuitsu@gmail.com','Connie Witzoe','the left hand is definitely challenging in that part.
How do you feel about the pause between the final chord in bar 23 leading up to the final bar? I''ve never really liked that silent part before ending the piece and always want to keep the pedal down and link bar 23 and 24 together.','2026-04-24 23:54:33.808+00',(SELECT id FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-24 23:40:59.232+00' AND post_id=(SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-24 22:11:58.322+00' LIMIT 1) LIMIT 1),'Matthew Cawood'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-24 23:54:33.808+00');

-- reply to Matthew Cawood by Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-24 22:11:58.322+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','I think the silence there says a lot in that moment. Leading up to that bar there is “smorzando” which means dying away in both speed and dynamic. But at the same time as that smorzando, you get an E major chord (with the G#) and then an E minor chord (with the G natural) in bar 22..so you get this momentary feeling of weird positivity before it gets tainted by the E minor and that feels to me almost like coming to terms with and submitting to the inevitable heavy sinking feeling that the piece has (because the chords are wanting to sink from the very beginning).

So in bar 23, you have a dominant 7th which wants to resolve, but before we do that at the end of the piece, the silence feels like a breath before finally almost saying goodbye. If you hold the pedal, then I think you lose that moment of reflection and stillness. It’s almost like when you move house and before you lock the door for the final time, you turn around to look at the place.

I think the key is really to have slowed down enough and place that chord in bar 23 enough so that the silence almost feels like that natural next thing and you can feel the impact of that silence.','2026-04-25 00:07:09.940+00',(SELECT id FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-24 23:40:59.232+00' AND post_id=(SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-24 22:11:58.322+00' LIMIT 1) LIMIT 1),'Matthew Cawood'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-25 00:07:09.940+00');

-- friday-24-april-2026-30-min-prelude-in-e · Connie Witzoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-24 22:11:58.322+00' LIMIT 1),'connieuitsu@gmail.com','Connie Witzoe','Ah… what a great way of looking at it. And slowing it down even more leading up to before that chord ends will definitely make it sound less abrupt.
I think I''ll also watch more videos of how other pianists look like and handle that part to make it sound more natural, most of the audio files I''ve listened to I don''t like their interpretation of it 🙈
Thanks for the tips! 😊','2026-04-25 07:04:12.569+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-25 07:04:12.569+00');

-- saturday-25-april-2026-15-min-other · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-04-25 15:44:50.291+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','Excellent takeaways from an excellent video! 😉','2026-04-25 15:56:27.918+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-25 15:56:27.918+00');

-- norman-s-log-apr-24-28-2026 · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-04-28 12:17:35.392+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','You’ve really been putting in the time this week Norman! It’s great to see! i like the variety of pieces as well. 😀','2026-04-28 13:15:17.940+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-28 13:15:17.940+00');

-- wednesday-29-april-2026-1h-50m-hanon · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='lucaskinzo@hotmail.com' AND created_at='2026-04-29 22:09:17.041+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','Nice work, 1h 50m is quite the session!','2026-04-29 22:44:56.182+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-29 22:44:56.182+00');

-- wednesday-29-april-2026-10-min-prelude · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-04-29 22:30:59.372+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','You got to the piano, which is the main thing! 😀','2026-04-29 22:45:26.744+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-29 22:45:26.744+00');

-- wednesday-29-april-2026-15-min-air-on-th · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-04-29 22:53:09.348+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','Nice to see the passage fixer is still working for you 😊','2026-04-29 22:58:09.826+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-04-29 22:58:09.826+00');

-- a-heavily-summarised-log · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-02 16:13:50.292+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','Sight reading definitely is one of those one’s that is slower until it suddenly becomes way more efficient. 

The G#, B, G# in the left hand is worth persevering with because that shape is standard arpeggio/chord shaping for a G# minor chord. It’s a little bit more awkward in this particular piece because of the hands crossing over each other, but if you can manage it…I personally think it’s better for technique and voicing of the chord. 

Also another thing to check with those kind of things; if your left hand feels a little uncomfortable stretching to the right, it might be worth trying it sitting further back 😀','2026-05-03 10:15:53.380+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-05-03 10:15:53.380+00');

-- monday-4-may-2026-1h-15m-prelude-op-23 · Denzel R Riwai
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-04 22:55:01.485+00' LIMIT 1),'denzelriwai1@gmail.com','Denzel R Riwai','Can''t encourage that little ear training habit enough, keeps you from getting frustrated, gives you a break, ticks the ear training box ( far more beneficial and easier to recognise notes in kids songs ) that small habit will compound Into something very tangible. Absolutely do gotta work with what you can get 😆','2026-05-04 23:27:52.908+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-04 23:27:52.908+00');

-- reply to Denzel R Riwai by Connie Witzoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-04 22:55:01.485+00' LIMIT 1),'connieuitsu@gmail.com','Connie Witzoe','100%!','2026-05-04 23:37:34.166+00',(SELECT id FROM community_post_comments WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-04 23:27:52.908+00' AND post_id=(SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-04 22:55:01.485+00' LIMIT 1) LIMIT 1),'Denzel R Riwai'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-04 23:37:34.166+00');

-- monday-4-may-2026-1h-15m-prelude-op-23 · Norman Jaillet
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-04 22:55:01.485+00' LIMIT 1),'norman.jaillet@gmail.com','Norman Jaillet','That #%&* bar 21 - gave me a good chuckle!!','2026-05-05 14:47:27.639+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:47:27.639+00');

-- reply to Norman Jaillet by Connie Witzoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-04 22:55:01.485+00' LIMIT 1),'connieuitsu@gmail.com','Connie Witzoe','lol! If you tried it you''d know what i mean 😅','2026-05-05 14:50:16.637+00',(SELECT id FROM community_post_comments WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:47:27.639+00' AND post_id=(SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-04 22:55:01.485+00' LIMIT 1) LIMIT 1),'Norman Jaillet'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-05 14:50:16.637+00');

-- reply to Norman Jaillet by Norman Jaillet
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-04 22:55:01.485+00' LIMIT 1),'norman.jaillet@gmail.com','Norman Jaillet','I will! Not hopeful but … 😆','2026-05-05 14:52:56.728+00',(SELECT id FROM community_post_comments WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:47:27.639+00' AND post_id=(SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-04 22:55:01.485+00' LIMIT 1) LIMIT 1),'Norman Jaillet'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:52:56.728+00');

-- reply to Norman Jaillet by Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-04 22:55:01.485+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','you’ll have to get the calculator out for that 😬','2026-05-05 14:59:48.399+00',(SELECT id FROM community_post_comments WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:47:27.639+00' AND post_id=(SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-04 22:55:01.485+00' LIMIT 1) LIMIT 1),'Norman Jaillet'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-05-05 14:59:48.399+00');

-- tuesday-5-may-2026-45-min · Daniel Duordoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-05-05 12:09:28.028+00' LIMIT 1),'danielduordoe@yahoo.co.uk','Daniel Duordoe','Glad to have you back.','2026-05-05 12:27:33.997+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-05 12:27:33.997+00');

-- reply to Daniel Duordoe by Michael Page
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-05-05 12:09:28.028+00' LIMIT 1),'michaelpage05@hotmail.co.uk','Michael Page','Thank you. Life just got busy and I wasn’t feeling well.','2026-05-05 13:13:22.021+00',(SELECT id FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-05 12:27:33.997+00' AND post_id=(SELECT id FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-05-05 12:09:28.028+00' LIMIT 1) LIMIT 1),'Daniel Duordoe'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-05-05 13:13:22.021+00');

-- tuesday-5-may-2026-45-min · Denzel R Riwai
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-05-05 12:09:28.028+00' LIMIT 1),'denzelriwai1@gmail.com','Denzel R Riwai','You''re ticking a lot of boxes at once, it''s great to have you back at it.. maybe you feel a little cleaner upon your return? Sometimes a break does more then a practice session.','2026-05-05 15:25:07.243+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-05 15:25:07.243+00');

-- reply to Denzel R Riwai by Michael Page
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-05-05 12:09:28.028+00' LIMIT 1),'michaelpage05@hotmail.co.uk','Michael Page','Yeah. Some of it was time restraints.','2026-05-05 16:18:38.629+00',(SELECT id FROM community_post_comments WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-05 15:25:07.243+00' AND post_id=(SELECT id FROM community_posts WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-05-05 12:09:28.028+00' LIMIT 1) LIMIT 1),'Denzel R Riwai'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='michaelpage05@hotmail.co.uk' AND created_at='2026-05-05 16:18:38.629+00');

-- norman-s-log-apr-29-may-5 · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:44:30.563+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','Nice work Norman, congratulations on the recital and I’m glad it went well. The photo looks great! 🎉','2026-05-05 14:56:50.414+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-05-05 14:56:50.414+00');

-- norman-s-log-apr-29-may-5 · Denzel R Riwai
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:44:30.563+00' LIMIT 1),'denzelriwai1@gmail.com','Denzel R Riwai','Absolutely Amazing, don''t ever forget that performing for others alone is a feat that takes a lot of confidence and practice. You''re certainly on your way to heights you''re not ready for with practice like this Norman.. your practice is super diligent too, you''re even considering wether it''s worth investing more time into specific pieces lest they return less than you hope.

Would you recommend hanons pianist excercises? 

And yes, we see the virtuoso in the plaid shirt! Looking good Norman, keep it up.','2026-05-05 15:22:10.872+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-05 15:22:10.872+00');

-- reply to Denzel R Riwai by Norman Jaillet
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:44:30.563+00' LIMIT 1),'norman.jaillet@gmail.com','Norman Jaillet','i would recommend Hanon to get the fingers going but I also got the Faber-Hanon edition recently. Worth checking out.','2026-05-05 16:10:57.953+00',(SELECT id FROM community_post_comments WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-05 15:22:10.872+00' AND post_id=(SELECT id FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:44:30.563+00' LIMIT 1) LIMIT 1),'Denzel R Riwai'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 16:10:57.953+00');

-- norman-s-log-apr-29-may-5 · Daniel Duordoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:44:30.563+00' LIMIT 1),'danielduordoe@yahoo.co.uk','Daniel Duordoe','That''s wonderful! Great job! Do you all get together often for recitals?','2026-05-05 18:09:41.974+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-05 18:09:41.974+00');

-- reply to Daniel Duordoe by Norman Jaillet
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:44:30.563+00' LIMIT 1),'norman.jaillet@gmail.com','Norman Jaillet','My first one! Been taking lessons for 2 years, after a 50 yr hiatus from playing accordion!','2026-05-05 21:03:26.872+00',(SELECT id FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-05 18:09:41.974+00' AND post_id=(SELECT id FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:44:30.563+00' LIMIT 1) LIMIT 1),'Daniel Duordoe'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 21:03:26.872+00');

-- norman-s-log-apr-29-may-5 · Daniel Duordoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:44:30.563+00' LIMIT 1),'danielduordoe@yahoo.co.uk','Daniel Duordoe','Please do Moonlight sonata. I am working on the first movement this month. I believe  also has it in her repertoire.','2026-05-05 18:42:01.744+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-05 18:42:01.744+00');

-- norman-s-log-apr-29-may-5 · Norman Jaillet
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:44:30.563+00' LIMIT 1),'norman.jaillet@gmail.com','Norman Jaillet','It’s on the list!! 😁','2026-05-05 21:04:15.075+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 21:04:15.075+00');

-- norman-s-log-apr-29-may-5 · Cécile Dautriat
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:44:30.563+00' LIMIT 1),'cecile.dautriat@gmail.com','Cécile Dautriat','Amazing! Congrats on the recital.','2026-05-05 22:18:42.234+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-05 22:18:42.234+00');

-- reply to Cécile Dautriat by Norman Jaillet
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:44:30.563+00' LIMIT 1),'norman.jaillet@gmail.com','Norman Jaillet','thanks so much!','2026-05-06 12:27:05.758+00',(SELECT id FROM community_post_comments WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-05 22:18:42.234+00' AND post_id=(SELECT id FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-05 14:44:30.563+00' LIMIT 1) LIMIT 1),'Cécile Dautriat'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-06 12:27:05.758+00');

-- ultra-beginner-improvisation-technique · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-06 06:24:01.761+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','Nice work! You’re right…the black keys are a great way of improvising without having the extra barrier of worrying about which keys are a part/not part of the scale. 

They make a pentatonic scale which is what guitarists use all the time for guitar solos and it’s also used a lot for stereotypical asian sounding music. If you want to add an extra layer on top you could add an “A” to the scale. That makes an F# major blues scale (F# G# A A# C# D#) which can sound cool. 

You’re doing great! Your sense of rhythm and ability to just play like this is more impressive than you think. Those are skills you get from doing this kind of improvisation stuff and is a massive part of being a well rounded musician that many people struggle with. I’m glad you felt encouraged to post something!','2026-05-06 08:44:51.955+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-05-06 08:44:51.955+00');

-- reply to Matthew Cawood by Denzel R Riwai
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-06 06:24:01.761+00' LIMIT 1),'denzelriwai1@gmail.com','Denzel R Riwai','Thank you for the feedback Matt, do you have a favourite scale? Or do you jump between them depending on emotion.','2026-05-07 04:42:13.529+00',(SELECT id FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-05-06 08:44:51.955+00' AND post_id=(SELECT id FROM community_posts WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-06 06:24:01.761+00' LIMIT 1) LIMIT 1),'Matthew Cawood'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-07 04:42:13.529+00');

-- ultra-beginner-improvisation-technique · Cécile Dautriat
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='denzelriwai1@gmail.com' AND created_at='2026-05-06 06:24:01.761+00' LIMIT 1),'cecile.dautriat@gmail.com','Cécile Dautriat','Thanks for sharing, it never crossed my mind to try that out…','2026-05-06 23:28:22.214+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='cecile.dautriat@gmail.com' AND created_at='2026-05-06 23:28:22.214+00');

-- friday-8-may-2026-15-min-improvisation · Daniel Duordoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-08 23:06:52.875+00' LIMIT 1),'danielduordoe@yahoo.co.uk','Daniel Duordoe','Nice! I watched a two-hour improvisation tutorial today. It''s a fascinating concept.','2026-05-09 00:41:16.812+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-09 00:41:16.812+00');

-- reply to Daniel Duordoe by Connie Witzoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-08 23:06:52.875+00' LIMIT 1),'connieuitsu@gmail.com','Connie Witzoe','it can be quite fun. :)','2026-05-09 08:19:31.174+00',(SELECT id FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-09 00:41:16.812+00' AND post_id=(SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-08 23:06:52.875+00' LIMIT 1) LIMIT 1),'Daniel Duordoe'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-09 08:19:31.174+00');

-- sunday-10-may-2026-1h-5m-air-on-the-g · Daniel Duordoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-10 23:10:35.299+00' LIMIT 1),'danielduordoe@yahoo.co.uk','Daniel Duordoe','Haha. We swapped pieces.','2026-05-11 07:52:38.220+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-11 07:52:38.220+00');

-- reply to Daniel Duordoe by Connie Witzoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-10 23:10:35.299+00' LIMIT 1),'connieuitsu@gmail.com','Connie Witzoe','haha I know 😅 Matt suggested a Bach piece and it was already in my library. Did you do it in C Major? How''s the moonlight sonata going for you?','2026-05-11 07:58:53.955+00',(SELECT id FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-11 07:52:38.220+00' AND post_id=(SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-10 23:10:35.299+00' LIMIT 1) LIMIT 1),'Daniel Duordoe'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-11 07:58:53.955+00');

-- reply to Daniel Duordoe by Daniel Duordoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-10 23:10:35.299+00' LIMIT 1),'danielduordoe@yahoo.co.uk','Daniel Duordoe','Yes my version is in C major. It''s not totally done yet - It''s now in the ''Polishing'' phase. I have only done the first line of the Moonlight sonata to be honest; I started it on Friday.','2026-05-11 11:24:03.821+00',(SELECT id FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-11 07:52:38.220+00' AND post_id=(SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-10 23:10:35.299+00' LIMIT 1) LIMIT 1),'Daniel Duordoe'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-11 11:24:03.821+00');

-- reply to Daniel Duordoe by Connie Witzoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-10 23:10:35.299+00' LIMIT 1),'connieuitsu@gmail.com','Connie Witzoe','have you seen the D major version with all the chords in the right hand? 🙈 I''m like “no thanks” 😂
You should record it when you''ve  polished it 😊','2026-05-11 11:36:27.729+00',(SELECT id FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-11 07:52:38.220+00' AND post_id=(SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-10 23:10:35.299+00' LIMIT 1) LIMIT 1),'Daniel Duordoe'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-11 11:36:27.729+00');

-- monday-11-may-2026-2h-25m-air-on-the-g · Daniel Duordoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-11 22:51:01.203+00' LIMIT 1),'danielduordoe@yahoo.co.uk','Daniel Duordoe','That''s my version in C major.','2026-05-12 05:17:42.316+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-12 05:17:42.316+00');

-- reply to Daniel Duordoe by Connie Witzoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-11 22:51:01.203+00' LIMIT 1),'connieuitsu@gmail.com','Connie Witzoe','ooh thanks! Saves me trying to find it. Appreciate it 😊','2026-05-12 07:07:52.200+00',(SELECT id FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-12 05:17:42.316+00' AND post_id=(SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-11 22:51:01.203+00' LIMIT 1) LIMIT 1),'Daniel Duordoe'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-12 07:07:52.200+00');

-- norman-s-log-may-6-may-15 · Matthew Cawood
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-15 13:15:34.555+00' LIMIT 1),'matthew@matthewcawood.com','Matthew Cawood','Nice work Norman, you’ve been through quite the collection of pianos! 

You’re back is just congratulating you for consistent playing, a tough decision though - heal the back or play piano 🤔 - especially when you have this to play on!','2026-05-15 14:50:14.594+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='matthew@matthewcawood.com' AND created_at='2026-05-15 14:50:14.594+00');

-- sunday-17-may-2026-2h-5m-prelude-op-23-n · Norman Jaillet
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-17 23:29:18.340+00' LIMIT 1),'norman.jaillet@gmail.com','Norman Jaillet','That’s a long time on the bench! Did you break up the session? My goal is 2 hrs/day …. haven’t come close yet!','2026-05-18 11:44:46.294+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-18 11:44:46.294+00');

-- reply to Norman Jaillet by Connie Witzoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-17 23:29:18.340+00' LIMIT 1),'connieuitsu@gmail.com','Connie Witzoe','yeah I have to do split it up. In the day I''ve got the kids around me so sometimes only get 5 min in here and there, then in the evenings I can sometimes do an hour+ stretch. Monday mornings I often get 1-2 hours in while this kids are in school/nursery so I get the most done then 😊','2026-05-18 11:53:40.206+00',(SELECT id FROM community_post_comments WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-18 11:44:46.294+00' AND post_id=(SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-17 23:29:18.340+00' LIMIT 1) LIMIT 1),'Norman Jaillet'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-18 11:53:40.206+00');

-- monday-18-may-2026-2h-31m-prelude-op-23 · Daniel Duordoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-18 22:34:03.144+00' LIMIT 1),'danielduordoe@yahoo.co.uk','Daniel Duordoe','How many pieces do you learn at a go, if you don''t mind me asking? You''re really racing through the pieces. I am still toying with the idea of doing at least a new piece a month but I am quite interested in improvisation as well and my time is quite limited.','2026-05-19 13:39:07.623+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-19 13:39:07.623+00');

-- reply to Daniel Duordoe by Connie Witzoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-18 22:34:03.144+00' LIMIT 1),'connieuitsu@gmail.com','Connie Witzoe','at the moment I''m switching between about 3 different pieces. Rachmaninoff''s prelude, Florian Christl''s Vivalidi Variation (roughly half way through that one now, been practicing a lot today), and I''m still working on Air on the G string. 
However I started Arabesque no 1 and Chopin''s Nocturne in C# minor a couple of months ago and stopped about 1.5 pages in, so I''ll likely pick up those again soon.
The other pieces (moonlight sonata, clair de lune, Passacaglia, prelude in C minor etc) are pieces I''ve already learned and just playing through regularly so I don''t forget them.','2026-05-19 13:56:03.417+00',(SELECT id FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-19 13:39:07.623+00' AND post_id=(SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-18 22:34:03.144+00' LIMIT 1) LIMIT 1),'Daniel Duordoe'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-19 13:56:03.417+00');

-- reply to Daniel Duordoe by Daniel Duordoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-18 22:34:03.144+00' LIMIT 1),'danielduordoe@yahoo.co.uk','Daniel Duordoe','That makes sense. Nicely done.','2026-05-19 20:20:44.618+00',(SELECT id FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-19 13:39:07.623+00' AND post_id=(SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-18 22:34:03.144+00' LIMIT 1) LIMIT 1),'Daniel Duordoe'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='danielduordoe@yahoo.co.uk' AND created_at='2026-05-19 20:20:44.618+00');

-- tuesday-19-may-2026-3h-20m-prelude-op-28 · Norman Jaillet
INSERT INTO community_post_comments (post_id,email,name,content,created_at)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-19 22:09:29.786+00' LIMIT 1),'norman.jaillet@gmail.com','Norman Jaillet','3hr+!!! With kids and all … wow!','2026-05-20 09:48:34.188+00'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-20 09:48:34.188+00');

-- reply to Norman Jaillet by Connie Witzoe
INSERT INTO community_post_comments (post_id,email,name,content,created_at,parent_comment_id,reply_to_name)
  SELECT (SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-19 22:09:29.786+00' LIMIT 1),'connieuitsu@gmail.com','Connie Witzoe','2 hours in the morning when they were in school/nursery. Then the rest in parts throughout the day and evening :)','2026-05-20 10:20:31.126+00',(SELECT id FROM community_post_comments WHERE email='norman.jaillet@gmail.com' AND created_at='2026-05-20 09:48:34.188+00' AND post_id=(SELECT id FROM community_posts WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-19 22:09:29.786+00' LIMIT 1) LIMIT 1),'Norman Jaillet'
  WHERE NOT EXISTS (SELECT 1 FROM community_post_comments WHERE email='connieuitsu@gmail.com' AND created_at='2026-05-20 10:20:31.126+00');
