-- ============================================================
-- Circle historic gap-fill migration 2026-05-28
-- INSERTs every liker/comment found in the Circle sweep that isn't
-- already in the corresponding DB table. Idempotent via WHERE NOT EXISTS.
-- ============================================================

BEGIN;

INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Harmonic analysis' AND created_at = '2026-05-22 21:26:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Harmonic analysis' AND created_at = '2026-05-22 21:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Harmonic analysis' AND created_at = '2026-05-22 21:26:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Harmonic analysis' AND created_at = '2026-05-22 21:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Harmonic analysis' AND created_at = '2026-05-22 21:26:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Harmonic analysis' AND created_at = '2026-05-22 21:26:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Daniel, it’s incredibly important. However it becomes much more useful if you add a step after that too. Without understanding the harmony that you are playing you have no way of really knowing what the music means (other than intuition and feeling). If you understand the harmony then you know what chord it is in the scale, if it contains interesting notes or predictable notes, if it’s a functional chord like a dominant 7th and therefore creates tension that leads somewhere. Without knowing the harmony you don’t really have a chance at interpreting the music with any conviction. However, the important step after working it out is to ask 2 questions: 1. Why? 2. What does that mean? That anchors the understanding of the harmony into something that you can use to create music that has meaning. The aim should always be to know and understand what you are looking at, but after that we need to know how that is going to impact our playing and what it means about the music. For example lets say you have a piece in D major and you work out that in particular bar you have a D major chord. The answer to question 1 is “because that is home”, the answer to question 2 is “it means we are comfortable and safe”. Whereas if you are in the key of D major and come across a dominant 7th (A7 - A C# E G in this case). Then the answer to question 1 is “to build tension in anticipation of returning home” and the answer to question 2 is “it means that an audience will feel the tension and when they hear chord 1 afterwards the relief will be even more satisfying”. Now understanding the harmony is actionable, right? If a chord feels like home, how do we make it sound even more like home? If a chord builds tension in anticipation of the chord after it, how do we make it sound more tense and more satisfying afterwards? This is where storytelling really lives in music 😀', NULL, NULL, '2026-05-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Harmonic analysis' AND created_at = '2026-05-22 21:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Harmonic analysis' AND created_at = '2026-05-22 21:26:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Daniel, it’s incredibly important. However it becomes much more useful if yo'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Harmonic analysis' AND created_at = '2026-05-22 21:26:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Glad to know I am not wasting my time.', NULL, NULL, '2026-05-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Harmonic analysis' AND created_at = '2026-05-22 21:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Harmonic analysis' AND created_at = '2026-05-22 21:26:00+00' LIMIT 1)
      AND email = 'danielduordoe@yahoo.co.uk'
      AND LEFT(content, 80) = 'Glad to know I am not wasting my time.'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Question' AND created_at = '2026-05-21 14:49:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Question' AND created_at = '2026-05-21 14:49:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Question' AND created_at = '2026-05-21 14:49:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Question' AND created_at = '2026-05-21 14:49:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Question' AND created_at = '2026-05-21 14:49:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Question' AND created_at = '2026-05-21 14:49:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Bobby, I can definitely recommend some pieces if you have a certain style that you like in mind (so I can suggest something that you will like). It would also be helpful to know what the piece is you are trying to learn so I have an idea as to the type of thing you want to be able to play. In this situation it can definitely be demotivating if you are finding it a bit of a slog to practice the piece, but if you like it then I would treat it like a B piece. So, have it as a long term piece that you chip away at over the long term, but have another piece as well that is going to get you some quick wins. That way you are still attacking the harder piece but you also feel like you are progressing because you have another piece that you can push through a bit quicker and learn a lot from. You can then spend most of your practice on the new piece, but save 10 minutes each time to keep pushing that piece forward. It’s also ok to leave the piece for a while too, there are many pieces that I have started and decided that it’s not the right time for the piece. you may or may not come back to it in the future, but everything that you have learnt from it will still be there, so nothing is lost. 😀', NULL, NULL, '2026-05-21 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Question' AND created_at = '2026-05-21 14:49:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Question' AND created_at = '2026-05-21 14:49:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Bobby, I can definitely recommend some pieces if you have a certain style th'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Question' AND created_at = '2026-05-21 14:49:00+00' LIMIT 1), 'bobbymi003@gmail.com', 'BOBBY', 'That is good to hear, I will attach the sheet music to this reply and maybe you can take a look. Its a cover of a foreign song so there isn’t a complete audio I can listen to so im just trying to work it out the musicality by ear as I play. P.s what should i do with the pedal , i dont understand it. How should i use it so its not all muddled up and my left hand is way too strong so it kind of drowns the right hand out. And any piece that is short and maybe 2-4 ABRSM level should be good. Something I could realistically learn in a few weeks. Tum-Ho-Rockstar-Solo-Sheet-zfzws... 109.12 KB', NULL, NULL, '2026-05-21 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Question' AND created_at = '2026-05-21 14:49:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Question' AND created_at = '2026-05-21 14:49:00+00' LIMIT 1)
      AND email = 'bobbymi003@gmail.com'
      AND LEFT(content, 80) = 'That is good to hear, I will attach the sheet music to this reply and maybe you '
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Question' AND created_at = '2026-05-21 14:49:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Perfect, I’ve attached two pieces here that are both interesting that I think might help in different ways. Spiegel Im Spiegel is a more musically demanding piece that uses 3 staves. but it has that same rotating arpeggio type pattern from this piece in a slower easier way. Depending on if you like this this kind of music, it’s long enough to feel like you are really pushing through it, but not so technically demanding enough that you will get super stuck anywhere. Reflection is from Hollow Night and is very chord based, once again not sure if you know it. This one is just 1.5-2 pages and is more about finding shapes on the piano and getting the melody to sing out. In answer to your questions, the pedal should change every time the chord changes, which by the looks of it seems to be almost every bar of the piece/song. So at the start of each bar try to lift your foot up and put it back down again, but be careful that you don’t lift your foot up until you have played the first note of the next bar, otherwise you will have a gap. So at the start of the piece your foot goes down with the chord, then after that at the start of each bar it should be: Fingers down, foot up, foot down, fingers up, continue… With your left hand been too strong, thats a fairly common problem…for that my advice would be to try to use gravity in your right hand to fall on the notes and in your left hand try to stay more close to the keys. This will mean that your left hand can’t produce a lot of volume but your right hand is letting gravity do all the work. spiegel-im-spiegel-final-score-d... 70.53 KB Reflection.pdf 816.27 KB', NULL, NULL, '2026-05-21 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Question' AND created_at = '2026-05-21 14:49:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Question' AND created_at = '2026-05-21 14:49:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Perfect, I’ve attached two pieces here that are both interesting that I think mi'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Just to also cover you mentioning it sounding too disconnected, this is usually due to direct pedalling rather than indirect pedalling. When you have the pedal down already and want to change pedal for a new chord, you need to make sure you don’t let go of the pedal before you play the new chord otherwise you will have a gap. So your foot needs to come up at the same time (or just after) you play the new chord and then straight back down again. 😀', NULL, NULL, '2026-05-15 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Just to also cover you mentioning it sounding too disconnected, this is usually '
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1), 'tdalavoy@gmail.com', 'Tulika Dalavoy', 'Matthew Cawood Hi Matt. Thanks for your quick response. I am using indirect pedaling, so I raise and press the pedal while changing the chord. This is what it sounds like when I play the staccato part from bar 10 and the octaves from bar 14. Should I press the pedal all the way down or press lightly? I have limited control with my digital piano but it''s good to have an idea.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-15 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-16 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1)
      AND email = 'tdalavoy@gmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood Hi Matt. Thanks for your quick response. I am using indirect peda'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Tulika Dalavoy The first part sounds great…I would maybe try to lean on the 1st and 3rd beat of the bar a little more so that you get more of a rocking sound to the music. I would also try to hold onto those particular notes that are on beat 1 and 3 of the bar just a touch longer than the others to emphasise them a bit. The second part, there doesn’t appear to be a pedal change between the beats 2 & 3, if you are pedalling there, your foot might not be coming up enough so it’s not clearing the sound. I heard a pedal change at the start of the 2nd bar of that section but for the other ones the notes from the previous chords were carrying through which is where that blurry sound is coming from. So every time you play a low left hand octave and then a high left hand chord it needs to be re-pedalled on the next low octave. 😀', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-15 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-16 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Tulika Dalavoy The first part sounds great…I would maybe try to lean on the 1st '
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1), 'tdalavoy@gmail.com', 'Tulika Dalavoy', 'Matthew Cawood Ok, will work on the pedaling in those sections. Is it better to press the pedal all the way down or press lightly?', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-15 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-16 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Wellerman song' AND created_at = '2026-05-16 15:43:00+00' LIMIT 1)
      AND email = 'tdalavoy@gmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood Ok, will work on the pedaling in those sections. Is it better to '
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Sight reading' AND created_at = '2026-05-12 13:25:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Sight reading' AND created_at = '2026-05-12 13:25:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sight reading' AND created_at = '2026-05-12 13:25:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Sight reading' AND created_at = '2026-05-12 13:25:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Sight reading' AND created_at = '2026-05-12 13:25:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sight reading' AND created_at = '2026-05-12 13:25:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Yes! For those that have used my sight reading book in the past, I have often recommended going back and repeating a section in specific circumstances if they feel like they need to consolidate the difficulty and the next section means that there would be too many errors in the exercise even at a slow speed. Really what I would recommend is to try to progress the difficulty but adapt the piece/exercise to make the piece difficult but just about manageable…however, although it is true that replaying an exercise again to fix mistakes is no longer sight reading, that really only applies to repetition in order to fixing thing where you can no longer guarantee that the only thing you are relying on is your instant recognition. If you are returning to it after weeks and you know you won’t recognise it (which should be the case if you truly did only play it once) then you are definitely getting the sight reading value from it again. So I would suggest, trying to keep moving on and progressing where possible, adapting the exercises to mitigate making so many mistakes that it’s hard to work out what things are the errors (by slowing it down)…but if you feel like you need to consolidate the difficulty level then you can absolutely go back to old exercises that you can’t remember. The purpose of not repeating the exercise no longer applies if you can’t remember it and you still get the sight reading practice 😀', NULL, NULL, '2026-05-11 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Sight reading' AND created_at = '2026-05-12 13:25:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Sight reading' AND created_at = '2026-05-12 13:25:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Yes! For those that have used my sight reading book in the past, I have often re'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Hand Independence - left hand arpeggios' AND created_at = '2026-05-12 11:59:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Hand Independence - left hand arpeggios' AND created_at = '2026-05-12 11:59:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Hand Independence - left hand arpeggios' AND created_at = '2026-05-12 11:59:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Hand Independence - left hand arpeggios' AND created_at = '2026-05-12 11:59:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Hand Independence - left hand arpeggios' AND created_at = '2026-05-12 11:59:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Hand Independence - left hand arpeggios' AND created_at = '2026-05-12 11:59:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Rob! To Summarise: 1. Pick an arpeggio pattern in the left hand 2. Play until very comfortable (perhaps using different chords) 3. Layer up the left hand 1 level at a time (single note, single chord, chord on each beat, chord on off beats, arpeggiating right hand, playing scale in right hand, playing a melody…) 4. Play across different chords in a simple scale (e.g. C major) 5. Change scales 6. Start again with a slightly different arpeggio pattern. Pieces that help arpeggio patterns: Czerny Op. 599 No.84 and No. 86.', NULL, NULL, '2026-05-11 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Hand Independence - left hand arpeggios' AND created_at = '2026-05-12 11:59:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Hand Independence - left hand arpeggios' AND created_at = '2026-05-12 11:59:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Rob! To Summarise: 1. Pick an arpeggio pattern in the left hand 2. Play unti'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'For Children — No. 1 in C major' AND created_at = '2026-05-12 08:38:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'For Children — No. 1 in C major' AND created_at = '2026-05-12 08:38:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'For Children — No. 1 in C major' AND created_at = '2026-05-12 08:38:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'For Children — No. 1 in C major' AND created_at = '2026-05-12 08:38:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'For Children — No. 1 in C major' AND created_at = '2026-05-12 08:38:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'For Children — No. 1 in C major' AND created_at = '2026-05-12 08:38:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Michael, you are correct the video was not correct for the piece! Now I have changed that so it should be, also the description of difficulty was making reference to the collection of pieces as a whole which does use 3/4 in it, but it’s irrelevant for the piece. I’ve changed it so that the title, video and description of the piece is now more accurate.', NULL, NULL, '2026-05-11 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'For Children — No. 1 in C major' AND created_at = '2026-05-12 08:38:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'For Children — No. 1 in C major' AND created_at = '2026-05-12 08:38:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Michael, you are correct the video was not correct for the piece! Now I have'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Camera angle' AND created_at = '2026-05-10 21:30:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Camera angle' AND created_at = '2026-05-10 21:30:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Camera angle' AND created_at = '2026-05-10 21:30:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Camera angle' AND created_at = '2026-05-10 21:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Camera angle' AND created_at = '2026-05-10 21:30:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Camera angle' AND created_at = '2026-05-10 21:30:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Luca, any camera angle facing your hands should work. I can hear technical issues usually. However, if you want to optimise, then either having the camera beside you facing your hands/arms or above you looking down on your hands/arms is great. Similar for settings, as long as I can hear you and see the way that your hands are moving then the settings aren’t too integral, just with enough light to see what’s going on. (Probably with the exception of a fisheye lens and having the camera facing you like in my videos - because this will likely distort the angle of your fingers).', NULL, NULL, '2026-05-10 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Camera angle' AND created_at = '2026-05-10 21:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Camera angle' AND created_at = '2026-05-10 21:30:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Luca, any camera angle facing your hands should work. I can hear technical i'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Sight reading practice' AND created_at = '2026-05-10 19:29:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Sight reading practice' AND created_at = '2026-05-10 19:29:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sight reading practice' AND created_at = '2026-05-10 19:29:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Sight reading practice' AND created_at = '2026-05-10 19:29:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Sight reading practice' AND created_at = '2026-05-10 19:29:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sight reading practice' AND created_at = '2026-05-10 19:29:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Tulika, it’s good that you are thinking about adding it in. It’s definitely one of the most useful skills you can add. For material, ABRSM have two series of books that are sight reading exercises by the grade. The first one is the Piano Specimen Sight-Reading Tests and the other is called Improve Your Sight Reading by Paul Harris each of these series have grades 1-8. However, if you feel like your sight reading might be a little behind the kind of pieces that you are learning, then I would recommend getting any of the beginner books. My personal recommendation is “It’s Never Too Late to Play Piano” by Pam Wedgwood - this way it will start out super simple and you can find your level of sight reading. Sight reading typically lags behind the level of the pieces that you learn by a couple of grades because you don’t have the luxury of fixing and replaying the music. For coordination, this is usually a rhythm recognition problem and a good way of building that skill is to do some sight reading exercises where you just play a single note in each hand but play the correct rhythms in the exercise. This means that you are taking away the cognitive load of finding the notes and allow yourself to focus on the coordination and rhythm. Because sight reading is a skill that is only developed on completely new music, you are essentially trying to improve your approach to recognising the rhythms with each new exercise. Treble clef and bass clef at the same time, this is another one that takes a bit of time to develop and if you find a particular weakness in reading the left hand try to add some left hand only practice to sight reading as well so that your instant recognition of the notes in the bass clef is also building. However, you are right in the fact that notes are not always strictly chord notes, they can be “passing notes” or “auxiliary notes” too (or chord notes that aren’t immediately obvious - like 7ths or 9ths). Finding these notes will actually improve quite quickly the more analysis you do of the pieces you are learning. For the pieces that you are working on, trying to work out what chords are being used and which notes in a bar are notes from that chord or notes that are forming some kind of melody idea in-between the chord notes will make the pattern recognition much stronger for when you are sight reading and see these kind of ideas. The difficult thing about sight reading is that (unlike pieces) there is no immediate fix to each mistake. The idea is to spot a weakness (which it feels like you have an idea as to where those might be), then lean your sight reading practice on that weakness so that over several weeks it becomes noticeably stronger. Then you will start to notice that sight reading will have a massive impact on your ability to learn pieces quickly and understand the various features of the music without needing to spent a lot of time deliberately working them out 😀', NULL, NULL, '2026-05-09 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Sight reading practice' AND created_at = '2026-05-10 19:29:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Sight reading practice' AND created_at = '2026-05-10 19:29:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Tulika, it’s good that you are thinking about adding it in. It’s definitely '
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sight reading practice' AND created_at = '2026-05-10 19:29:00+00' LIMIT 1), 'tdalavoy@gmail.com', 'Tulika Dalavoy', 'Matthew Cawood Thanks Matt. Great ideas and suggestions. Will definitely try these.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Sight reading practice' AND created_at = '2026-05-10 19:29:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-09 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-10 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Sight reading practice' AND created_at = '2026-05-10 19:29:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Sight reading practice' AND created_at = '2026-05-10 19:29:00+00' LIMIT 1)
      AND email = 'tdalavoy@gmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood Thanks Matt. Great ideas and suggestions. Will definitely try the'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Two octave scales' AND created_at = '2026-05-10 16:48:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Two octave scales' AND created_at = '2026-05-10 16:48:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Two octave scales' AND created_at = '2026-05-10 16:48:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Two octave scales' AND created_at = '2026-05-10 16:48:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Two octave scales' AND created_at = '2026-05-10 16:48:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Two octave scales' AND created_at = '2026-05-10 16:48:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Wendy, that’s very common problem actually! The first octave feels contained enough with only one finger change in each hand, but when adding the second octave the change over in the middle along with have 3 crossovers in each hand at different times can feel like it throws everything off. There are a couple of ways I would suggest practicing this to help that problem. Firstly, playing scales hands separately doesn’t immediately translate to playing hands together because it can feel like you almost need to divide your focus between the two scales at the same time. Another way of breaking down the scale so that you focus on the coordination and you tackle one thing at a time is to do something I call “stair stepping”.  This is where you play the scale ascending and descending, but you add one note at a time… So you begin with just C-D-C, this should be straight forward because there are no finger crossings. Once that is comfortable then try C-D-E-D-C. Once again there are no finger crossings here. However C-D-E-F-E-D-C now requires a thumb on the F in the right hand and then a 3rd finger back on the E on the way down. This is also kind of a perfect use case for the passage fixed game in the hub, having to get to 5 points on each of these before adding a note helps you know if it feels secure. If you do this using the fingers for a two octave scale then you are essentially tackling one problem at a time. It can be difficult to think about all the crossings in one go, but just tackling one problem on the new note that you’ve added makes it much more manageable and will help you iron out the scale. The second thing I would suggest is to use “common finger checkpoints”. There are certain moments in a C major scale where both hands land on the same finger. There are 3s on Es and 3s on As then there is also 1s on the C that’s in the middle of the two octave scale. Once you have done the stair stepping, you can focus on these Es, As and that C as you go through the scale to help you mentally break up the scale and double check you’ve landed in the right place. I hope that helps 😊', NULL, NULL, '2026-05-09 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Two octave scales' AND created_at = '2026-05-10 16:48:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Two octave scales' AND created_at = '2026-05-10 16:48:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Wendy, that’s very common problem actually! The first octave feels contained'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Two octave scales' AND created_at = '2026-05-10 16:48:00+00' LIMIT 1), 'wg33@live.co.uk', 'Wendy Grimshaw', 'Matthew Cawood Hi Matt, thanks very much for that, I definitely have a plan now and will try all of your suggestions, including using the passage fix game. I need to start thinking about fixing one problem at a time more often in my practice!', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Two octave scales' AND created_at = '2026-05-10 16:48:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-09 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-10 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Two octave scales' AND created_at = '2026-05-10 16:48:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Two octave scales' AND created_at = '2026-05-10 16:48:00+00' LIMIT 1)
      AND email = 'wg33@live.co.uk'
      AND LEFT(content, 80) = 'Matthew Cawood Hi Matt, thanks very much for that, I definitely have a plan now '
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk'
WHERE (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1)::text, 'danielduordoe@yahoo.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1)::text AND ar.email = 'danielduordoe@yahoo.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1), 'norman.jaillet@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1)::text, 'norman.jaillet@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1)::text AND ar.email = 'norman.jaillet@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'I second this question.', NULL, NULL, '2026-05-09 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1)
      AND email = 'danielduordoe@yahoo.co.uk'
      AND LEFT(content, 80) = 'I second this question.'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Connie Yes is the easy answer. However, it does mean you need to be efficient with your time to keep them all improving. It’s pretty typical and expected to have to juggle several pieces at the same time, for exams you need to juggle 3-4 pieces and for concert recitals you need to be learning many pieces simultaneously, so it’s a skill that’s worth building anyway. Also, the problem with learning one piece at a time is that you may only be solving one type of problem from one type of piece before then moving onto another, which can perhaps slow progress down. On the other hand, you have to be careful to not over stretch yourself because then you can end up not spending enough time on each piece and not really progressing either. So it’s definitely a balance. However, I think for you, learning the Prelude, Nocturne and the Arabesque all at the same time shouldn’t be a problem and they are a nice collection of pieces (although I’d personally swap out the nocturne for a Bach piece so that each piece is a different era and targeting different skills - but if you like the pieces then learning these 3 is also good). What I would say though is that it becomes a little more important to plan your practice (even if just mentally before you sit down) and make sure your practice sessions are task based. If you divide each piece into 2; learning new notes and correcting (2 or less/more) problems in each piece, then you will have 9 tasks to work through each practice (+ I would always recommend the respective scales and a bit of sight reading). So a session might look like: 3+ Scales (5-8 mins) Sight Reading (5-8 mins) Piece 1 - New Notes (5 mins) Piece 1 - Problem Solving (10 mins) Piece 2 - New Notes (5 mins) Piece 2- Problem Solving (10 mins) Piece 3 - New Notes (5 mins) Piece 3 - Problem Solving (10 mins) You’ll probably find that your sessions become a lot more streamlined and while each piece has a lot less time, you are really targeting and improving just the same. It also doesn’t hurt to do a rotation like you suggested…2 pieces per practice and rotate or even 1 piece per practice. However, if you opt for 1 piece per practice then I would probably suggest treating each practice like you have a focus piece to problem solve for that session. That would mean you can still chip away at some new notes in the other pieces so that it isn’t too long between seeing the same piece and you forget what you had learned in the last session.', NULL, NULL, '2026-05-09 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Connie Yes is the easy answer. However, it does mean you need to be efficien'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Thanks for you reply! Hmm interesting, I actually have Bach''s "Air on the G string" in my to-learn-list (my mom used to play it on her organ when I was a kid so was gonna learn it for her), and it''s a lot easier than the Nocturne so I could put that in for noe and pick up the Nocturne once I''ve finished it. :) thanks for the tip. Thanks for the example of what a session could look like. Took a screenshot. But when you say sight reading, isn''t that then part of the practice of the new notes in the pieces as I have to read the sheet music to learn the new notes? 🙈 or do you mean sight reading a completely different and easy piece on its own and then work on the actual pieces after?', NULL, NULL, '2026-05-09 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Thanks for you reply! Hmm interesting, I actually have Bach''s "Air on the G stri'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Connie Witzoe Air on the G String is a great piece and would compliment the other two nicely. Sight reading is only the very first time you see and attempt the notes. When you are learning new notes, there is usually some repetition and working it out involved and you are attempting to learn from your mistakes pretty much immediately. So while there is a tiny bit of sight reading from that very first look and attempt at the notes, it’s not really sight reading in the same way that dedicated a little time to training the meta skill of your approach to playing something you’ve never seen before.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1) AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-09 23:00:00+00' LIMIT 1), 'Connie Witzoe', '2026-05-09 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Connie Witzoe Air on the G String is a great piece and would compliment the othe'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Matthew Cawood aha ok. Will start doing that as well then. :)', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1) AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-09 23:00:00+00' LIMIT 1), 'Connie Witzoe', '2026-05-09 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood aha ok. Will start doing that as well then. :)'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Matthew Cawood oh actually, I was wondering, do you have access to the sheet music for Florian Christl''s "Vivaldi variation" ? I really wanna learn that piece but can''t find the sheet music anywhere and that''s definitely from a different era.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1) AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-09 23:00:00+00' LIMIT 1), 'Connie Witzoe', '2026-05-09 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Learning multiple pieces at once' AND created_at = '2026-05-10 09:06:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood oh actually, I was wondering, do you have access to the sheet mus'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Question for livestream !' AND created_at = '2026-05-09 18:47:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Question for livestream !' AND created_at = '2026-05-09 18:47:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Question for livestream !' AND created_at = '2026-05-09 18:47:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Question for livestream !' AND created_at = '2026-05-09 18:47:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Question for livestream !' AND created_at = '2026-05-09 18:47:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Question for livestream !' AND created_at = '2026-05-09 18:47:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'https://thepracticeroom.matthewcawood.com/c/matt-s-content-feed/tips-for-learning-the-piano-and-daily-practice-tips', NULL, NULL, '2026-05-08 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Question for livestream !' AND created_at = '2026-05-09 18:47:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Question for livestream !' AND created_at = '2026-05-09 18:47:00+00' LIMIT 1)
      AND email = 'danielduordoe@yahoo.co.uk'
      AND LEFT(content, 80) = 'https://thepracticeroom.matthewcawood.com/c/matt-s-content-feed/tips-for-learnin'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Question for livestream !' AND created_at = '2026-05-09 18:47:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Bobby, that’s a big question and an interesting one! You are correct that for a runner they have specific components to their training that are there for a very specific purpose. I actually am a runner myself and have run a number of marathons, so I definitely relate to the example you gave of the training for a sprinter. Training (practicing) on the piano is actually incredibly similar in the respect that each aspect of your practice is there to provide you with a specific skill that will help you produce better music. Ultimately the aim of any pianist is to be able to sit at the piano and produce music that they like, irrespective of the genre. For many players the problem is that they don’t know why they are learning certain things in their playing. For example, many players learn scales because their teacher said to, but they don’t know what a scale is or why they are learning it. The most important role for me is to show exactly what each aspect of practice actually does to help your playing and ultimately achieve that goal of being able to play what you want to play on the piano. So the easy answer and the most direct answer to your question “what actually is piano practice?”… It is to do a balance between doing the things that are the most beneficial for future you and doing things that keep you going. This means having intention behind each element in your practice and also being aware of whether doing too much of those things are taking the enjoyment away and therefore it needs to be balanced with doing whatever feels fun. So, this means that that there are typically 6 different aspects that we can practice: Scales (and technique) Sight Reading Pieces Ear Training Improvisation Theory The first three are fundamental, but it really depends on whether you are approaching them with intention. The scales aren’t there just to do scales, they are there because each piece of music uses a scale and each song/piece is founded on the concept of a particular scale. So really, you are learning the scale to engrain that set of notes into your hands. This is why I would always focus on the scales that are in the pieces/songs you are learning first, because this makes them directly relatable to real music. Sight Reading; ultimately reading is the easiest way of understanding and comprehending a piece of music. So we practice sight reading to make this process much faster, it also helps you recognised the patterns that make up music much faster. Pieces; this is why we learn music, right? It’s also where we can apply all of the knowledge we’ve learnt and see it in real life. you see the scale, you see the chords, you see all of the other theory and techniques that you have learnt in a real context. Ear training, once again ear training tests your understanding of scales and chords and puts it under a different kind of pressure where you have to work backwards. You aren’t working out the scales chords from a page, but you have to work it out based purely on theory and your ears. Improvisation; this is just applied music theory and a testing ground for what you know in music. If you just learned that a C major scale has 7 triads, then improvisation allows you to test and drill this knowledge. If you just learned that a chord 5-1 feels like a full stop/period then improvisation allows you to test this knowledge. Theory; this is where you learn what to look for in your pieces which then become what you test in your improvisation, what you see in your sight reading etc… So really the aim is not to just go through the motions of learning something and trying to sit at the piano for a particular length of time, but it’s really to find a knowledge gap and fill it so that you are ready for when you need it. If you don’t know a scale, learn it. If you make a mistake sight reading, then find out why that mistake happened and put it under pressure. If you find a technique difficult in a piece, drill it. If you can’t understand how a song you are listening to has been written, work it out. If you don’t feel a particular music concept feels secure, improvise around it. If you can’t understand something in music, learn the theory. This is essentially the reason that we practice, to fill in the gaps and ultimately be able to play and navigate the piano freely! hopefully that answers your question to some extent!', NULL, NULL, '2026-05-08 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Question for livestream !' AND created_at = '2026-05-09 18:47:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Question for livestream !' AND created_at = '2026-05-09 18:47:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Bobby, that’s a big question and an interesting one! You are correct that fo'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Daniel, Interesting question! I don’t know if I have any specific book recommendations…but I can offer some thoughts and maybe recommend some things to look into that might result in some interesting books to read. You are correct in the fact that improvisation doesn’t really originate in Jazz although now we thing of it to be where improvisation lives. The history of written sheet music plays a much larger role in the origin story of what we now consider to be improvisation. In the medieval times, while modern sheet music was being developed, pretty much all music was improvised to some degree, but we had a much different understanding and feeling towards music. For example the modern “full stop/period” in music is chord 5-1, but historically it was originally chords 4-1. That’s why in much of church music (older music that’s stood the test of time) chords 4-1 are used to complete musical phrases, because that was what was considered the natural way to complete a musical phrase at the time. However (before I get sidetracked), the best place to look into improvisation if you are interested is to look into “figured bass”. In baroque music, figured bass was a writing system used as a shorthand way of showing not only what chords to play but also the voicing of those chords. Although in modern recordings it doesn’t sound like it, the specific notes/rhythms that you needed to play were typically improvised in quite a lot of baroque music. At the time the harpsichord was the keyboard instrument that was written for and this didn’t allow for dynamic contrast, but it was the instrument that was most frequently used for accompanying soloists that did have a noted melodic line to follow. In the classical/romantic period, a lot of these baroque improvised pieces were standardised by editors to some extent, but it was originally intended to be quite free and it was only in the classical period that music become much more prescriptive, particularly when the piano become an option! In the later classical/romantic period, the most obvious case of improvisation is the “cadenza” which is intended to be a section of music for a soloist that is explicitly there to show off and improvise. However, once again in modern times a lot of these have been standardised and written into the music itself. It does go to show that music is not necessarily intended to be as regimented and prescriptive as it can come across in modern music (particularly in exam situations where it feels like there is a correct and an incorrect way). Originally music was an idea between melody and harmony that was left to the player to interpret and then it become more more structured in the classical/romantic period. But to answer your question: If you want to look into improvisation I would look into “figured bass”, “cadenzas” and for more theoretical understanding “modes” (for jazz) and the theory (even the frequency science) behind “cadences”. These are all things that will help you understand improvisation and music better. Improvisation is essentially “applied music theory” so the more you understand music theory and how music has historically been put together (and is currently put together), the more you will be able to play around with it yourself and see how what you play creates particular effects (which is ultimately the best way to understand). I hope that kind of answers your question in a round about way!', NULL, NULL, '2026-05-08 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Daniel, Interesting question! I don’t know if I have any specific book recom'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'It does. Thank you so much. I spent the whole day going down the improv rabbit hole. I think it''s an interesting field worth exploring. The way I see it, the more you understand what you are playing, the more fluent you will be at the piano. I think it will help with memorization as well. Just in case anyone else may be interested, I found a couple of books that seem like they may be worth checking out - The pianist''s guide to historic improvisation by John Mortensen and Improvisation at the Piano by Brian Chung.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-08 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-08 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Improvisation' AND created_at = '2026-05-09 08:26:00+00' LIMIT 1)
      AND email = 'danielduordoe@yahoo.co.uk'
      AND LEFT(content, 80) = 'It does. Thank you so much. I spent the whole day going down the improv rabbit h'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Sonata not so facile K545 😄' AND created_at = '2026-05-04 19:52:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Sonata not so facile K545 😄' AND created_at = '2026-05-04 19:52:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sonata not so facile K545 😄' AND created_at = '2026-05-04 19:52:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Sonata not so facile K545 😄' AND created_at = '2026-05-04 19:52:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Sonata not so facile K545 😄' AND created_at = '2026-05-04 19:52:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sonata not so facile K545 😄' AND created_at = '2026-05-04 19:52:00+00' LIMIT 1), 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'I might have found the right sequence. First G maj run. Then 1 on the high G, 23121234 3214321 23412345 4321321 23412345 4321321 2312345 Sorry if it makes no sense 😀', NULL, NULL, '2026-05-03 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Sonata not so facile K545 😄' AND created_at = '2026-05-04 19:52:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Sonata not so facile K545 😄' AND created_at = '2026-05-04 19:52:00+00' LIMIT 1)
      AND email = 'lucaskinzo@hotmail.com'
      AND LEFT(content, 80) = 'I might have found the right sequence. First G maj run. Then 1 on the high G, 23'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sonata not so facile K545 😄' AND created_at = '2026-05-04 19:52:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Luca Chiarella Hey Luca, where possible it’s best to try do as normal scale fingers if you can. This is kind of the exact pattern that was in the right hand at the beginning of the piece. If you work through the scale with normal fingers but on the way down crossing after finger 4 instead of after finger 3 (like before) so that you can start 1 note lower in the next bar that is ideal, and that is the case for bars 2,3 and 4 here..so you would have this: 5 4 3 2 1 3 2 1 - 2 3 4 1 2 3 4 5 However, in the first bar the Bb makes this a little difficult, so this will need a little alternation. So I would use normal fingers ascending - 5 4 3 2 1 3 2 1, then descending try to use relatively normal fingers trying to land in a position that enables you to ascend again, with a 1 at the top you can then do 2, 1, 2, 3, 1, 2, 3 - the problem here is you will land on a 4 at the bottom to start the next bar meaning you can then use 4, 3, 2, 1, 4, 3, 2, 1 in the next bar to land back in the realm of normality. So here are the fingers; 5 4 3 2 1 3 2 1 - 2 1 2 3 1 2 3 - 4 3 2 1 4 3 2 1 - 2 3 4 1 2 3 4 - 5 4 3 2 1 3 2 1 - 2 3 4 1 2 3 4 5 - 4 3 2 1 3 2 1 - 2 3 1 2 3 4 5 I thought it would be most hopeful to give you some reasoning here so you can see how fingers are usually thought about for these slightly non traditional sections.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Sonata not so facile K545 😄' AND created_at = '2026-05-04 19:52:00+00' LIMIT 1) AND email = 'lucaskinzo@hotmail.com' AND created_at = '2026-05-03 23:00:00+00' LIMIT 1), 'Luca Chiarella', '2026-05-03 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Sonata not so facile K545 😄' AND created_at = '2026-05-04 19:52:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Sonata not so facile K545 😄' AND created_at = '2026-05-04 19:52:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Luca Chiarella Hey Luca, where possible it’s best to try do as normal scale fing'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sonata not so facile K545 😄' AND created_at = '2026-05-04 19:52:00+00' LIMIT 1), 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'This is perfect Matt, thanks for the explanation. I need to print the sheet in order to wright down the fingers numbers. I''m sure there would be apps for that, but wouldn''t know which.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Sonata not so facile K545 😄' AND created_at = '2026-05-04 19:52:00+00' LIMIT 1) AND email = 'lucaskinzo@hotmail.com' AND created_at = '2026-05-03 23:00:00+00' LIMIT 1), 'Luca Chiarella', '2026-05-03 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Sonata not so facile K545 😄' AND created_at = '2026-05-04 19:52:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Sonata not so facile K545 😄' AND created_at = '2026-05-04 19:52:00+00' LIMIT 1)
      AND email = 'lucaskinzo@hotmail.com'
      AND LEFT(content, 80) = 'This is perfect Matt, thanks for the explanation. I need to print the sheet in o'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'K545' AND created_at = '2026-05-01 10:44:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'K545' AND created_at = '2026-05-01 10:44:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'K545' AND created_at = '2026-05-01 10:44:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'K545' AND created_at = '2026-05-01 10:44:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'K545' AND created_at = '2026-05-01 10:44:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'K545' AND created_at = '2026-05-01 10:44:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Luca, sure! Interestingly that’s the D melodic minor scale at the start of this run of notes with the raised 6 & 7 notes from a normal D natural minor scale. So, the First part is typical scale fingers from the D to the D in bar 9. Then we have a 1 on the A to almost do normal scale fingers again, however that changes near the top because there’s a thumb in the G to be able to run fingers 1, 2, 3, 4 up to the C and back down again to the G. Then a 3rd finger crosses for the F# and you then keep your hand in that position for the rest of the notes until the C which is a finger 2. So the fingers are: 1-2-3-1-2-3-4-5 1-2-3-1-2-3 1-2-3-4-3-2-1 3-2-3-4-5-4-3-2-1-2 to land on 1 on the B in the next bar.', NULL, NULL, '2026-04-30 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'K545' AND created_at = '2026-05-01 10:44:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'K545' AND created_at = '2026-05-01 10:44:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Luca, sure! Interestingly that’s the D melodic minor scale at the start of t'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'K545' AND created_at = '2026-05-01 10:44:00+00' LIMIT 1), 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'Perfecto 💪🏻', NULL, NULL, '2026-04-30 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'K545' AND created_at = '2026-05-01 10:44:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'K545' AND created_at = '2026-05-01 10:44:00+00' LIMIT 1)
      AND email = 'lucaskinzo@hotmail.com'
      AND LEFT(content, 80) = 'Perfecto 💪🏻'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Practice Room - Pieces Library' AND created_at = '2026-04-30 17:12:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Practice Room - Pieces Library' AND created_at = '2026-04-30 17:12:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Practice Room - Pieces Library' AND created_at = '2026-04-30 17:12:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Practice Room - Pieces Library' AND created_at = '2026-04-30 17:12:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Practice Room - Pieces Library' AND created_at = '2026-04-30 17:12:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Practice Room - Pieces Library' AND created_at = '2026-04-30 17:12:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hi Norman, so the rating system tends to be something like this: Absolute Beginner: Pre grade 1 Beginner: Grade 1-2/3 Lower Intermediate: Grade 3-4 Upper Intermediate: Grade 5-7 Advanced: Grade 8 - Diplomas Elite: Widely considered professional repertoire So there can be a difference between an upper intermediate piece that’s grade 5 and another that is grade 7. Similarly between the beginner grade 1 vs grade 2-3. The moonlight, while on the lower end of that scale, it’s a piece that requires an understanding of harmony, balance and is much more musically challenging. The notes and rhythms themselves would probably be considered on the lower end, but the musicality pushes it up. The Schumann is pretty much the exact opposite. That one is maybe on the top end of beginner for technique but requires much less than the moonlight with regards to musicality. It’s also a much shorter piece. Having said that, the rankings are a little subjective so you may look at a piece and feel for your particular skill set that it is much easier than another piece in the same tier.', NULL, NULL, '2026-04-29 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Practice Room - Pieces Library' AND created_at = '2026-04-30 17:12:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Practice Room - Pieces Library' AND created_at = '2026-04-30 17:12:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hi Norman, so the rating system tends to be something like this: Absolute Beginn'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Practice Room - Pieces Library' AND created_at = '2026-04-30 17:12:00+00' LIMIT 1), 'norman.jaillet@gmail.com', 'Norman Jaillet', 'Thanks for the explanation sir!! 👊', NULL, NULL, '2026-04-29 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Practice Room - Pieces Library' AND created_at = '2026-04-30 17:12:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Practice Room - Pieces Library' AND created_at = '2026-04-30 17:12:00+00' LIMIT 1)
      AND email = 'norman.jaillet@gmail.com'
      AND LEFT(content, 80) = 'Thanks for the explanation sir!! 👊'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Scales progress' AND created_at = '2026-04-29 01:17:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Scales progress' AND created_at = '2026-04-29 01:17:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scales progress' AND created_at = '2026-04-29 01:17:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Scales progress' AND created_at = '2026-04-29 01:17:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Scales progress' AND created_at = '2026-04-29 01:17:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scales progress' AND created_at = '2026-04-29 01:17:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Rob, A scale is never really complete in the same sense as a piece where one day you will move onto something else. Scales are finite and will typically coexist alongside pieces. So its a bit like spinning plates where eventually you will just be attacking the weakest ones that you haven’t done in a while. However, I think I can answer your question by splitting it into two; When do you add new scales? and when you have a lot of scales when does a scale fall out of rotation? I think adding a new scale can happen when the scale you previously were working on can be played accurately 2 hands together for 2 octaves more than 50-60% of the time. By that point you might have a little brain space left to give to a new scale. In a single practice session, if you are working on new scales then you probably don’t want to be working on more than 1-2 new scales at a time and 1-2 scales that you are still perfecting and 1-2 scales that are worth checking in on. So if you have more than 6 scales then the earliest ones that you learnt might fall out of your practice rotation…but you can occasionally revisit them in one of those “perfecting” scale slots. For the best order of scales. There is a typical way that I would recommend working through the scales, and that is in levels based on fingers and to some degree the circle of fifths. Although I would also include the scale from any pieces you are learning if you haven’t already done the scale. Level 1 (all same fingers) C major, G major, D major, A major, E major Level 2 (still the same fingers) A minor, E minor (natural, harmonic and melodic minors) Level 3 (different fingers - either starting or finishing on a 4) F major, B major (same as Cb major) Level 4 (starting on black note fingers) Bb major, Eb major, Ab major Level 5 (fingers the same as previous major scales) B minor, D minor, G minor, C minor, F minor Level 6  (similar finger patterns) Db major (C# major), Gb major (F# major) Level 7 (black note minors) F# minor, C# minor, G# minor (Ab minor) Level 8 (harder black note minors) D# minor (Eb minor), Bb minor (A# minor)', NULL, NULL, '2026-04-28 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Scales progress' AND created_at = '2026-04-29 01:17:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Scales progress' AND created_at = '2026-04-29 01:17:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Rob, A scale is never really complete in the same sense as a piece where one'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scales progress' AND created_at = '2026-04-29 01:17:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Rob Ayres It will definitely help in the run, so I''d would definitely just take a handful like you have and add to that one at a time once you have them nailed down. It’s always worth throwing a piece of music to learn in there as well though, because then you can use that knowledge you are gaining. 😀', NULL, NULL, '2026-04-29 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Scales progress' AND created_at = '2026-04-29 01:17:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Scales progress' AND created_at = '2026-04-29 01:17:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Rob Ayres It will definitely help in the run, so I''d would definitely just take '
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scales progress' AND created_at = '2026-04-29 01:17:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Sonus Lucis Hey Sonus, minor keys operate a little differently to major keys in this sense. With a major key there is 1 scale and 1 set of notes that the key will use. So if a piece of music is in the key of C major it will just use a C major scale and those notes will be C, D, E, F, G, A, B. However, for minor keys, the key is like a box that contains 3 scales that are used for various situations. The natural minor: this is what we see in a key signature and this is exactly the same notes as the relative major. So an A natural minor scale contains exactly the same notes as a C major scale. The harmonic minor scale: this scale is used for harmony (chords), so sometimes chords will use the harmonic minor scale instead. The only difference in this scale from the natural minor scale is that the 7th note in the scale is sharpened. (A harmonic minor: A B C D E F G#) The melodic minor scale: this scale is used for melodies. The difference with this scale is that if a melody is ascending we sharpen both the 6th and 7th notes in the scale but if it’s descending they are back to normal and the same as the natural minor (A melodic minor: A B C D E F# G# - if ascending). So the relative minor key is the box that contains all of these minor scales depending on the situation. Meaning that the relative minor key of the key of C major is the key of A minor. The key of C major uses just the C major scale, whereas the key of A minor uses the natural, harmonic and melodic minor scale. Hopefully that makes sense!', NULL, NULL, '2026-04-29 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Scales progress' AND created_at = '2026-04-29 01:17:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Scales progress' AND created_at = '2026-04-29 01:17:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Sonus Lucis Hey Sonus, minor keys operate a little differently to major keys in '
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Bench Position' AND created_at = '2026-04-27 13:47:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Bench Position' AND created_at = '2026-04-27 13:47:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Bench Position' AND created_at = '2026-04-27 13:47:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Bench Position' AND created_at = '2026-04-27 13:47:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Bench Position' AND created_at = '2026-04-27 13:47:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Bench Position' AND created_at = '2026-04-27 13:47:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hi Sonus, sure! Typically this can happen if you’re shoulders are lifting a bit while playing (which happens quite frequently). If that does happen to be aggravating it then while you are playing occasionally just checking to make sure your shoulders are relaxed can help. If they are relaxed, then it could be coming from forcing a more upright seated position. Typically, you don’t want to be slouched while playing, but at the same time if you over extend, you can also be asking your back to tense in order to hold itself there for a long period of time. Il definitely make a video on it though if that’s helpful. Also regarding bench height, that’s an interesting topic…but my general recommendation is that you want your arms to bend at the elbow at just over a right angle when your elbows are against your body and your upper leg/lower leg to be just over a right angle to the pedal.', NULL, NULL, '2026-04-27 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Bench Position' AND created_at = '2026-04-27 13:47:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Bench Position' AND created_at = '2026-04-27 13:47:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hi Sonus, sure! Typically this can happen if you’re shoulders are lifting a bit '
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Coping with young learners' AND created_at = '2026-04-27 10:27:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Coping with young learners' AND created_at = '2026-04-27 10:27:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Coping with young learners' AND created_at = '2026-04-27 10:27:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Coping with young learners' AND created_at = '2026-04-27 10:27:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Coping with young learners' AND created_at = '2026-04-27 10:27:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Coping with young learners' AND created_at = '2026-04-27 10:27:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hi Jamie, I’ve often found with young children that gamifying it a bit tends to work or competing against you in some way. That typically ads a self fulfilling reason to do a task. Using something physical to represent “points” and using a game like the game I add to the practice hub (although for a child I’d probably recommend doing it manually). For example, if he gets it right he gets a point and if he gets it wrong he loses 2 points (trying to get to 5 points) but having a visual representation of the points he’s earning or a reward for getting to 5. That usually helps keep focus for that particular task. Other things that can help are things like rhythm games. You can get some flash cards that show different note lengths and you can get him to clap for the 8th notes (quavers) and stomp for the quarter notes (crotchets). If he is struggling with a particular rhythm in a piece of music then you can kind of build up to that rhythm by swapping out note lengths using the flash cards. Another thing I have found the children tend to like is, improvising with constraints. For example, if you want him to understand a particular key signature. You can tell him which notes he can play (or just tell him the key if he knows it already), then you can play some simple repetitive bass notes in that key and let him see if he can make something up only using those notes. You can also make this harder by making more notes off limits, or only using notes from a specific chord. You may find that you don’t need to do these types of games all the time, but if he’s getting a bit antsy then it might be a nice way of breaking up the practice and add some fun. 😀', NULL, NULL, '2026-04-27 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Coping with young learners' AND created_at = '2026-04-27 10:27:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Coping with young learners' AND created_at = '2026-04-27 10:27:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hi Jamie, I’ve often found with young children that gamifying it a bit tends to '
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Piano learning app' AND created_at = '2026-04-26 17:16:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Piano learning app' AND created_at = '2026-04-26 17:16:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Piano learning app' AND created_at = '2026-04-26 17:16:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Piano learning app' AND created_at = '2026-04-26 17:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Piano learning app' AND created_at = '2026-04-26 17:16:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Piano learning app' AND created_at = '2026-04-26 17:16:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Mateusz Gepert , not sure if this ones for me…but I thought I’d jump in anyway. From my experience of testing these kind of apps, they do a good job at helping with getting that initial understanding of note reading as they tend to guide you through it, some of them stop to hear you play the correct note for example. They also do a good job at giving you easier versions of songs/pieces if you prefer playing simplified versions of songs you like. I would say their positives though, also tend to be an their problem. For example, it helps you read notes because it waits for you to play the right notes…but that in turn might be a problem for learning rhythm and keeping a constant pulse. They also have a strong focus on the process of note reading and they don’t talk about how those notes form chords or how to think about the music to decide how it should sound. Having said that, many people like Playground Sessions and any tool that you like means that you will spend time at the piano and inevitably get better. I’d be interested to hear from those that have used them from a learners perspective though. 😀', NULL, NULL, '2026-04-25 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Piano learning app' AND created_at = '2026-04-26 17:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Piano learning app' AND created_at = '2026-04-26 17:16:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Mateusz Gepert , not sure if this ones for me…but I thought I’d jump in anyw'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Luca, for which scale? I mentioned before the blues scales, is that the one you are referring to? Starting on any particular note or another one? 😀', NULL, NULL, '2026-04-25 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Luca, for which scale? I mentioned before the blues scales, is that the one '
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1), 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'Hi Matt, Blues major scale, starting in C', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-04-25 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-04-25 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1)
      AND email = 'lucaskinzo@hotmail.com'
      AND LEFT(content, 80) = 'Hi Matt, Blues major scale, starting in C'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', '', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-04-25 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-04-25 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = ''
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1), 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'Matthew Cawood Thanks Matt, perfect 💪🏻', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-04-25 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-04-25 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Blues scale' AND created_at = '2026-04-26 17:10:00+00' LIMIT 1)
      AND email = 'lucaskinzo@hotmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood Thanks Matt, perfect 💪🏻'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'How much to practise an exercise' AND created_at = '2026-04-26 09:20:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'How much to practise an exercise' AND created_at = '2026-04-26 09:20:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'How much to practise an exercise' AND created_at = '2026-04-26 09:20:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'How much to practise an exercise' AND created_at = '2026-04-26 09:20:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'How much to practise an exercise' AND created_at = '2026-04-26 09:20:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'How much to practise an exercise' AND created_at = '2026-04-26 09:20:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hi Jane, are you focussing on a scale or a particular technical exercise? My general advice would be; If you feel like you are able to play it correctly relatively consistently, then I would look to do something to either: 1. Push the challenge a little further. That could be speeding it up or playing it staccato etc. 2. Finding a new challenge to tackle. Sometimes technical exercises do take many practice sessions to feel comfortable due to the nature of how technique improves. So, it could be worth checking back in with that particular exercise in a future session to see if it is still ok, then think about making it harder by speeding it up (or some other way of increasing the difficulty), but in the meantime you could add a new scale/technique to your practice so that you are expanding your ability that way too. 😀', NULL, NULL, '2026-04-25 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'How much to practise an exercise' AND created_at = '2026-04-26 09:20:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'How much to practise an exercise' AND created_at = '2026-04-26 09:20:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hi Jane, are you focussing on a scale or a particular technical exercise? My gen'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Changing fingers' AND created_at = '2026-04-24 16:29:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Changing fingers' AND created_at = '2026-04-24 16:29:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Changing fingers' AND created_at = '2026-04-24 16:29:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Changing fingers' AND created_at = '2026-04-24 16:29:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Changing fingers' AND created_at = '2026-04-24 16:29:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Changing fingers' AND created_at = '2026-04-24 16:29:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Michael, it does indeed! More generally, if you see a repeated note with a finger change it’s because playing the same key twice with the same finger has a slightly different quality of sound because of the way we release our fingers and play it again, we can also move faster with multiple fingers. So in pieces where you have very fast repeated notes on 1 key, you’ll typically see a different finger playing that same key. However, in this case it’s something slightly different. This is essentially trying to train you to not rely on being in one hand position. With these early pieces, our hands can become glued to the same 5 keys. So you may end up seeing a G in the right hand (for example) and thinking “finger 5” instead of “G”. So in this case the piece is trying to get you to rely on your knowledge of the key itself rather than which finger is playing it…and so it changes to a different finger.', NULL, NULL, '2026-04-23 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Changing fingers' AND created_at = '2026-04-24 16:29:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Changing fingers' AND created_at = '2026-04-24 16:29:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Michael, it does indeed! More generally, if you see a repeated note with a f'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Daniel, I do indeed! There are two types of exams that ABRSM do now, the regular exams and the performance exams (since 2021 - I think). If it’s been a while since you last had a go at one, you might not know about those second ones that many people do now. The regular exams are the Scales/Arpeggios, Sight Reading, Aural Tests and 3 Pieces in an exam centre. The performance exams are just 4 Pieces and can be recorded at home. The 3 pieces are 1 piece from each section in the syllabus (section A, B and C) and then a fourth piece from any of the sections. Interestingly if you want to take the Jazz route, the jazz piano grades are a little different because for those there is just 5 grades rather than the 8 grades (plus diplomas) that most people know. They also have some improvised sections in the pieces where just the chords are given. I can definitely help though and I’m happy to help with piece selection, giving some feedback or anything else and nearer exams I have often done mock exams with students as well and the estimated mark that I give is usual not too far away from the results.', NULL, NULL, '2026-04-23 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Daniel, I do indeed! There are two types of exams that ABRSM do now, the reg'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Howard Garner Apparently so for recorded performance grades! It will be interesting to see how they are marked, because previously the grade 5 jazz exam pieces and marks were much harsher than the regular grade 8 exam.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-04-23 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-04-24 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Howard Garner Apparently so for recorded performance grades! It will be interest'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Thanks Matthew Cawood . I didn''t know about the performance exams. I am guessing that was in response to the COVID pandemic. How shall we proceed then? Is it possible to have a introductory call for us to work out a plan? Thank you.', NULL, NULL, '2026-04-23 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1)
      AND email = 'danielduordoe@yahoo.co.uk'
      AND LEFT(content, 80) = 'Thanks Matthew Cawood . I didn''t know about the performance exams. I am guessing'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'I think it was, they wanted to keep exams going and it became popular! Sure, you can send me a a private message if you want some direct help. Alternatively, I’ve just added One-to-One Clinics in the links if you want some One-to-One help to work on anything or talk through it.', NULL, NULL, '2026-04-23 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prep for ABRSM exams' AND created_at = '2026-04-24 13:44:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'I think it was, they wanted to keep exams going and it became popular! Sure, you'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'That’s an interesting one. I think it’s when the main objective of the piece has been fulfilled. When starting a piece earlier on in your playing career, each piece will have a role. At the very start it’s to familiarise yourself with the notes and the rhythms, then it becomes about maybe hand jumps in the music (for example), then it might be that the piece contains a lot staccato notes to practice. If you can identify what the piece was really trying to help you do, then you can work out if it has fulfilled its purpose yet. Of course, firstly you should be able to play through the piece and include all of the details (like dynamics etc.), but if you feel like you have learnt a piece and the mistakes you are making now are different each time. Then I would assess it by asking if the piece has served it’s purpose and you would get more out of tackling a piece that poses a set of new problems! Often, once you have attacked a new piece…if for some reason you ever returned to that piece, then it will be far easier because of the new set of challenges you’ve just overcome in a new piece. If you are like me and like numbers, I would say if you are getting 95% correct then moving on is a perfectly reasonable thing to do. 😀', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'That’s an interesting one. I think it’s when the main objective of the piece has'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'Matthew Cawood thank you! I like numbers too. 🤓', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-04-22 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-04-23 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Practice Question' AND created_at = '2026-04-23 22:20:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood thank you! I like numbers too. 🤓'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Movement' AND created_at = '2026-04-23 18:27:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Movement' AND created_at = '2026-04-23 18:27:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Movement' AND created_at = '2026-04-23 18:27:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Movement' AND created_at = '2026-04-23 18:27:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Movement' AND created_at = '2026-04-23 18:27:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Movement' AND created_at = '2026-04-23 18:27:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'I think it’s an interesting topic. I think movement should never be a conscious part of playing…movements is a result of what really is important and that is the thing that should really be focussed on. The thing that should be focussed on is the emotional contents of the music. Often, we need movement to fully express what the music is trying to say and get the music to sound the way we want it to feel. It’s a little bit like trying to tell a story to children without embodying the characters of the story. It becomes much easier to feel and understand when showing those emotions through gestures and physical movement. However, moving is a symptom of feeling those emotions and trying to really express them on the piano rather than the other way around (moving around to try and feel something or moving around for technical reasons). Often, the reason you see performers moving a lot is for exactly the reason you said, to entertain, but it’s often not entertainment in the sense of doing it to deliberately exaggerate. But more, the performer is trying to express and tell you a story and therefore can’t help but try and do that with body language to. So, my advice would be to think about the emotional contents of the piece you are playing, what does it mean and how does it feel. Then, over time, as you build the ability to trust your hands in that particular piece and your main focus shifts to how it feels…you will natural move with more fluidity and ease as you try to express that. 😀', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Movement' AND created_at = '2026-04-23 18:27:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Movement' AND created_at = '2026-04-23 18:27:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'I think it’s an interesting topic. I think movement should never be a conscious '
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk'
WHERE (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1)::text, 'danielduordoe@yahoo.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1)::text AND ar.email = 'danielduordoe@yahoo.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1), 'michaelpage05@hotmail.co.uk'
WHERE (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1)::text, 'michaelpage05@hotmail.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1)::text AND ar.email = 'michaelpage05@hotmail.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Steve! Done! I’ve added a youtube link for all of the pieces!', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Previews' AND created_at = '2026-04-23 16:33:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Steve! Done! I’ve added a youtube link for all of the pieces!'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1), 'michaelpage05@hotmail.co.uk'
WHERE (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1)::text, 'michaelpage05@hotmail.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1)::text AND ar.email = 'michaelpage05@hotmail.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'That’s a great idea. Maybe a feature piece this month or something (maybe akin to a book club)? Possibly 1 from each of the 5 difficulty levels for those at different levels.', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'That’s a great idea. Maybe a feature piece this month or something (maybe akin t'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Matthew Cawood Yeahhhh. Something like that.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-04-22 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1)
      AND email = 'danielduordoe@yahoo.co.uk'
      AND LEFT(content, 80) = 'Matthew Cawood Yeahhhh. Something like that.'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Michael Page Excellent suggestion.', NULL, NULL, '2026-04-23 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Community challenges' AND created_at = '2026-04-23 16:02:00+00' LIMIT 1)
      AND email = 'danielduordoe@yahoo.co.uk'
      AND LEFT(content, 80) = 'Michael Page Excellent suggestion.'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Memorizing Music' AND created_at = '2026-04-23 11:46:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Memorizing Music' AND created_at = '2026-04-23 11:46:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Memorizing Music' AND created_at = '2026-04-23 11:46:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Memorizing Music' AND created_at = '2026-04-23 11:46:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Memorizing Music' AND created_at = '2026-04-23 11:46:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Memorizing Music' AND created_at = '2026-04-23 11:46:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hi Mike, generally I agree with Jeff with regards to the fact that memorisation shouldn’t be too much of a priority (unless you are playing professional concert recitals). However, what I would say is that memorisation is a good tool for detecting how well and in what sense you know a piece of music. Firstly, memory of a piece of music becomes much stronger if you are relient on multiple forms of memory. For example muscle memory and the motor memory of where your hand should go is one form of memory, but it tends to be quite delicate and easily lost if you daydream. Another form of memory would be the structural memory of the piece, is the piece in ABA structure and you are in section A right now? (for example). Then there is harmonic memory, do you know the wider shapes and chords that make up what is happening in the music, much of the time when I’m playing I’m thinking about the chords and where they are going. Then there is the emotional memory, are you in the section of the piece that feels defiant or melancholy etc. Each of these touch points form what becomes solid memory of the piece as a whole, it’s possible that if you are slipping when losing a bit of focus that some of these forms might be less than other forms. Secondly, on a more general level and perhaps less relevant in this case…but for those that are breaking a part the music and aiming for understanding the story, if the memory isn’t there yet, it can be a good detector as to whether that section has been given enough time yet. Generally though, I wouldn’t aim for memory as the end goal, but more as a barometer for what your understanding is of the music. It’s also important to make sure that when memory does start to become a factor, that you memorise in a way that is helpful for your future self. For example, many players tend to end up looking at there hands when they’ve memorised the music, it’s much more useful to memorise the music, but do so while following the music to pick up on any missed details. 😀', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Memorizing Music' AND created_at = '2026-04-23 11:46:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Memorizing Music' AND created_at = '2026-04-23 11:46:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hi Mike, generally I agree with Jeff with regards to the fact that memorisation '
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning timing.....?' AND created_at = '2026-04-23 08:43:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Learning timing.....?' AND created_at = '2026-04-23 08:43:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning timing.....?' AND created_at = '2026-04-23 08:43:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Learning timing.....?' AND created_at = '2026-04-23 08:43:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Learning timing.....?' AND created_at = '2026-04-23 08:43:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning timing.....?' AND created_at = '2026-04-23 08:43:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Learning timing.....?' AND created_at = '2026-04-23 08:43:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning timing.....?' AND created_at = '2026-04-23 08:43:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Learning timing.....?' AND created_at = '2026-04-23 08:43:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Learning timing.....?' AND created_at = '2026-04-23 08:43:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning timing.....?' AND created_at = '2026-04-23 08:43:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Metronome like Michael is suggesting, but also listening to other pianists playing that particular piece and learn how it should sound. When I learn a piece I listen to it over and over to learn the timing, rhythm, phrasing, where the melody should come out more etc to the point where I walk around singing the piece. It makes it a lot easier to play it on the keyboard when you already know what it should sound like in your head.', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Learning timing.....?' AND created_at = '2026-04-23 08:43:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Learning timing.....?' AND created_at = '2026-04-23 08:43:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Metronome like Michael is suggesting, but also listening to other pianists playi'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Learning timing.....?' AND created_at = '2026-04-23 08:43:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Jamie, for your particular situation where you are trying to bridge the gap between an exercise and a real world situation, it’s really a bout creating levels to get yourself to the desired place. It sounds like right now, exercises are too easy to push your rhythm skills, but a piece is too difficult to allow you to focus on that particular problem. So what I would suggest is 1. Isolate a section of any piece you are learning where you are losing the timing (maybe a bar or two). 2. As an exercise, take that same rhythm and play it on a single note to a metronome. 3. Play the correct notes in one hand and just a single note in the left hand to a metronome. 4. Play the correct notes in both hands for that section with a metronome. 5. Play with wider context (a few bars before and after the section) - with a metronome (of course). 6. Remove the metronome and see if that section is comfortable in time. This will work both if you have a specific timing problem in a piece of music, but also more generally. Essentially, you are trying to find the exact level of difficulty where timing becomes an issue and spending sometime at that threshold to raise that particular skill. A little bit like threshold training in running/cycling. 😀', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Learning timing.....?' AND created_at = '2026-04-23 08:43:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Learning timing.....?' AND created_at = '2026-04-23 08:43:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Jamie, for your particular situation where you are trying to bridge the gap '
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1), 'amandaperfect@comcast.net'
WHERE (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1)::text, 'amandaperfect@comcast.net', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1)::text AND ar.email = 'amandaperfect@comcast.net'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hopefully this will give you some steps you can progress through.', NULL, NULL, '2026-04-21 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Hand coordination practice routine' AND created_at = '2026-04-22 16:28:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hopefully this will give you some steps you can progress through.'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1), 'amandaperfect@comcast.net'
WHERE (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1)::text, 'amandaperfect@comcast.net', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1)::text AND ar.email = 'amandaperfect@comcast.net'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'One other thing I’d add to this ramble is that it’s a good idea to practice the scale for the piece you are learning too, so if you do want to tackle a piece in G major (that has 1 sharp - F#) then practicing a G major scale will help demystify the piece a lot 😊 01:09', NULL, NULL, '2026-04-21 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Where to start' AND created_at = '2026-04-22 15:11:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'One other thing I’d add to this ramble is that it’s a good idea to practice the '
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)::text, 'danielduordoe@yahoo.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)::text AND ar.email = 'danielduordoe@yahoo.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1), 'gnpedgar@yahoo.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)::text, 'gnpedgar@yahoo.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)::text AND ar.email = 'gnpedgar@yahoo.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1), 'tdalavoy@gmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)::text, 'tdalavoy@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)::text AND ar.email = 'tdalavoy@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Sums up the British weather in a day! lol.', NULL, NULL, '2026-05-25 23:00:00+00'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM content_feed_comments
    WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)
      AND email = 'danielduordoe@yahoo.co.uk'
      AND LEFT(content, 80) = 'Sums up the British weather in a day! lol.'
  );
INSERT INTO content_feed_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Daniel Duordoe It definitely does!', (SELECT id FROM content_feed_comments WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) AND email = 'danielduordoe@yahoo.co.uk' AND created_at = '2026-05-25 23:00:00+00' LIMIT 1), 'Daniel Duordoe', '2026-05-26 23:00:00+00'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM content_feed_comments
    WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Daniel Duordoe It definitely does!'
  );
INSERT INTO content_feed_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'That looks like a fun challenge!', NULL, NULL, '2026-05-25 23:00:00+00'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM content_feed_comments
    WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'That looks like a fun challenge!'
  );
INSERT INTO content_feed_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Cécile Dautriat It is fun, although changing feelings is mentally quite draining 😂', (SELECT id FROM content_feed_comments WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) AND email = 'cecile.dautriat@gmail.com' AND created_at = '2026-05-25 23:00:00+00' LIMIT 1), 'Cécile Dautriat', '2026-05-26 23:00:00+00'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM content_feed_comments
    WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Cécile Dautriat It is fun, although changing feelings is mentally quite draining'
  );
INSERT INTO content_feed_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1), 'confi1@hotmail.com', 'Kelly Williams', 'I would ace one for "haphazard confusion" 😂🤣', NULL, NULL, '2026-05-26 23:00:00+00'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM content_feed_comments
    WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)
      AND email = 'confi1@hotmail.com'
      AND LEFT(content, 80) = 'I would ace one for "haphazard confusion" 😂🤣'
  );
INSERT INTO content_feed_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Kelly Williams ahhh your an emotional specialist 😂', (SELECT id FROM content_feed_comments WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) AND email = 'confi1@hotmail.com' AND created_at = '2026-05-26 23:00:00+00' LIMIT 1), 'Kelly Williams', '2026-05-26 23:00:00+00'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM content_feed_comments
    WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Emotion Improv Challenge: Perhaps a New Feature? 👀' AND created_at = '2026-05-26 15:15:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Kelly Williams ahhh your an emotional specialist 😂'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1)::text, 'danielduordoe@yahoo.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1)::text AND ar.email = 'danielduordoe@yahoo.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1), 'gnpedgar@yahoo.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1)::text, 'gnpedgar@yahoo.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1)::text AND ar.email = 'gnpedgar@yahoo.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1), 'tdalavoy@gmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1)::text, 'tdalavoy@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Playing Confidently When Playing For Others' AND created_at = '2026-05-25 18:32:00+00' LIMIT 1)::text AND ar.email = 'tdalavoy@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic - 25th May - Topic Poll' AND created_at = '2026-05-22 11:24:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Also wouldn''t mind some tips on how to be more confident playing in front of others. :)', NULL, NULL, '2026-05-21 23:00:00+00'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic - 25th May - Topic Poll' AND created_at = '2026-05-22 11:24:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM content_feed_comments
    WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic - 25th May - Topic Poll' AND created_at = '2026-05-22 11:24:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Also wouldn''t mind some tips on how to be more confident playing in front of oth'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1)::text, 'danielduordoe@yahoo.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1)::text AND ar.email = 'danielduordoe@yahoo.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1), 'gnpedgar@yahoo.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1)::text, 'gnpedgar@yahoo.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1)::text AND ar.email = 'gnpedgar@yahoo.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'I love that song. Do you mind adding it to the pieces library? I could have sworn there was a button for ''request piece'' within the library section but I can''t seem to find it.', NULL, NULL, '2026-05-20 23:00:00+00'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM content_feed_comments
    WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Shaping in Grade 8 Pieces' AND created_at = '2026-05-21 11:35:00+00' LIMIT 1)
      AND email = 'danielduordoe@yahoo.co.uk'
      AND LEFT(content, 80) = 'I love that song. Do you mind adding it to the pieces library? I could have swor'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text, 'danielduordoe@yahoo.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text AND ar.email = 'danielduordoe@yahoo.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1), 'lucaskinzo@hotmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text, 'lucaskinzo@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text AND ar.email = 'lucaskinzo@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1), 'gnpedgar@yahoo.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text, 'gnpedgar@yahoo.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text AND ar.email = 'gnpedgar@yahoo.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1), 'norman.jaillet@gmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text, 'norman.jaillet@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text AND ar.email = 'norman.jaillet@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1), 'shaun.purbrick@gmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text, 'shaun.purbrick@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text AND ar.email = 'shaun.purbrick@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1), 'wg33@live.co.uk'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text, 'wg33@live.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Tension When Playing Accents' AND created_at = '2026-05-18 19:26:00+00' LIMIT 1)::text AND ar.email = 'wg33@live.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)::text, 'danielduordoe@yahoo.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)::text AND ar.email = 'danielduordoe@yahoo.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1), 'lucaskinzo@hotmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)::text, 'lucaskinzo@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)::text AND ar.email = 'lucaskinzo@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1), 'michaelpage05@hotmail.co.uk'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)::text, 'michaelpage05@hotmail.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)::text AND ar.email = 'michaelpage05@hotmail.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1), 'gnpedgar@yahoo.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)::text, 'gnpedgar@yahoo.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)::text AND ar.email = 'gnpedgar@yahoo.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1), 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'Thank you Matt, this sounds lovely.', NULL, NULL, '2026-05-12 23:00:00+00'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM content_feed_comments
    WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)
      AND email = 'lucaskinzo@hotmail.com'
      AND LEFT(content, 80) = 'Thank you Matt, this sounds lovely.'
  );
INSERT INTO content_feed_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Lovely. Sounds like church worship accompaniment. What I am beginning to realise about music is that it''s all about patterns. The moment you spot the patterns, it gets easier. Thanks, Matt.', NULL, NULL, '2026-05-12 23:00:00+00'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM content_feed_comments
    WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)
      AND email = 'danielduordoe@yahoo.co.uk'
      AND LEFT(content, 80) = 'Lovely. Sounds like church worship accompaniment. What I am beginning to realise'
  );
INSERT INTO content_feed_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'Thanks Matt! I’m in shock, I was told it never rains in the UK…', NULL, NULL, '2026-05-12 23:00:00+00'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM content_feed_comments
    WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'Thanks Matt! I’m in shock, I was told it never rains in the UK…'
  );
INSERT INTO content_feed_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Michael Page It can definitely be difficult, I forget regularly if I keep going without doing anything to remember something I just played (that I liked). In a practice situation I often stop and make a voice note. However, generally I would say that if you can mentally give yourself multiple anchor points to remember it, you might be able to remember better. E.g. I played in X key, I played X chords, I played eighth notes (quavers). These kind of more general labels to help categorise the things you played and organise your memory of it can help a lot! 😊', NULL, NULL, '2026-05-13 23:00:00+00'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM content_feed_comments
    WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Starting to Improvise' AND created_at = '2026-05-13 15:46:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Michael Page It can definitely be difficult, I forget regularly if I keep going '
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1)::text, 'danielduordoe@yahoo.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1)::text AND ar.email = 'danielduordoe@yahoo.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1), 'lucaskinzo@hotmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1)::text, 'lucaskinzo@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1)::text AND ar.email = 'lucaskinzo@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1), 'gnpedgar@yahoo.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1)::text, 'gnpedgar@yahoo.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1)::text AND ar.email = 'gnpedgar@yahoo.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Good session. Thanks Matthew Cawood', NULL, NULL, '2026-05-10 23:00:00+00'
WHERE (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM content_feed_comments
    WHERE post_id = (SELECT id FROM content_feed_posts WHERE title = 'Live Practice Clinic: Building Finger Control, Balance & Coordination' AND created_at = '2026-05-11 20:17:00+00' LIMIT 1)
      AND email = 'danielduordoe@yahoo.co.uk'
      AND LEFT(content, 80) = 'Good session. Thanks Matthew Cawood'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1), 'norman.jaillet@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1)::text, 'norman.jaillet@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1)::text AND ar.email = 'norman.jaillet@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Nice! This is a nice piece and deceptively challenging with the consistency of the right hand. Firstly, I don’t think this one needs pedal because there are a lot of repeated chords in the right hand and they can get lost and blend into one if there is pedal. Also you might lose the rests between phrases. So there are two things going on here that are interesting but also make it challenging. Firstly this right hand idea and secondly the melody line being in the left hand and needing to be projected more. So… Firstly, the Right hand chords. For this particular type of repetitive movement, at the moment I''m seeing you use quite a lot of finger and arm movement. I think for this type of technique you need a lot of wrist movement particularly on the strong beats of the bar. If you aim for beats one and three of the bar (or even just beat one), with a larger wrist movement and you''re thinking about pushing the music forward with a little bit of momentum and then using your wrist more on those particular notes to relax and to create a slight extra bit of emphasis, that can help you aim for something and that will help the beats have consistency. This will actually also help your left hand because there are, as you''ve rightly got written down in the music, natural crescendos and diminuendos that want to happen in that left hand as the melody ascends and then descends again. If you are aiming for beats 1 and 3 in the right hand with your wrist whilst also trying to connect those left hand notes and giving some momentum to your left hand as it’s rising and falling, that will help both your left hand to naturally be the leader out of the two hands but it will also help your right hand to stay more even. The other thing to think about with regards to your left hand needing to be the leader is that it’s better to think about the left hand being louder rather than the right hand being quieter. Your right hand playing this kind of pattern will naturally want to be at a certain volume. Really what we aim to do is try and have a relative difference in dynamics so mp in one piece can be different from mp in a different piece. In this case if your right hand is playing consistent notes, if you try and mute those notes it means that you will be trying to force your hand to do a certain thing and can lead to less natural control, which can cause unevenness. Whereas if you naturally sit at a certain volume in your right hand (that allows a bit of freedom) then in your left hand your focus can be on making that relatively louder than your right hand. This piece also has some natural phrasing. Every four bars it seems is where the phrase ends and you return to a D minor chord (for the most part). In those places you can kind of taper off the dynamics (in the melody especially), it''s also a moment where you can let your right hand slow down just a touch in order to make it feel like it''s landed on the end of the phrase and then starting a new one.', NULL, NULL, '2026-05-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Nice! This is a nice piece and deceptively challenging with the consistency of t'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'I remember what you said for the pedal, I just tried out of despair. 😆 Thank you so much for your help!', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-22 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-23 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'I remember what you said for the pedal, I just tried out of despair. 😆 Thank you'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', '…marginal progress is progress. 😬', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-22 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-27 21:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Etude in Dm' AND created_at = '2026-05-23 11:30:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = '…marginal progress is progress. 😬'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1), 'norman.jaillet@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)::text, 'norman.jaillet@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)::text AND ar.email = 'norman.jaillet@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1), 'tdalavoy@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)::text, 'tdalavoy@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)::text AND ar.email = 'tdalavoy@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1), 'wg33@live.co.uk'
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)::text, 'wg33@live.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)::text AND ar.email = 'wg33@live.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Stolen? Impossible! 😉', NULL, NULL, '2026-05-19 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)
      AND email = 'danielduordoe@yahoo.co.uk'
      AND LEFT(content, 80) = 'Stolen? Impossible! 😉'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'Daniel Duordoe 😂 It was very impertinent of the British to steal “impossible”!', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) AND email = 'danielduordoe@yahoo.co.uk' AND created_at = '2026-05-19 23:00:00+00' LIMIT 1), 'Daniel Duordoe', '2026-05-19 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'Daniel Duordoe 😂 It was very impertinent of the British to steal “impossible”!'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Well done! Never heard this one before. Sounds and looks like fun to play, might add it to my list. :) Btw, is that a Bose headset you''re using?', NULL, NULL, '2026-05-19 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Well done! Never heard this one before. Sounds and looks like fun to play, might'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'Connie Witzoe it’s fun and I would love to hear you play it! Bose headset, exact. I initially bought them for my frequent air travel, but they work great for my keyboard too.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-19 23:00:00+00' LIMIT 1), 'Connie Witzoe', '2026-05-19 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'Connie Witzoe it’s fun and I would love to hear you play it! Bose headset, exact'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Cécile Dautriat nice! I don''t have the cable for mine anymore but might buy one so I can use it for my piano as well, rather than the cheap uncomfortable ones that came with the piano when I bought it 😅', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-19 23:00:00+00' LIMIT 1), 'Connie Witzoe', '2026-05-19 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Cécile Dautriat nice! I don''t have the cable for mine anymore but might buy one '
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'Connie Witzoe I would consider a bluetooth adapter if I had to replace my cable. The cable is never in my way but I think it’s only because I don’t venture too far from the middle C (yet).', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-19 23:00:00+00' LIMIT 1), 'Connie Witzoe', '2026-05-20 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'Connie Witzoe I would consider a bluetooth adapter if I had to replace my cable.'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'The French should probably not leave their words laying around to be stolen so easily. 😁 Nice work, it’s nice to see some Handel. You play it very nicely. Because this piece is by Handel and was no doubt written for the harpsichord rather than the piano, there are a couple of things that are particularly interesting for a piece like this. Firstly, (as you are correctly doing) there is no pedal. Secondly, the urtext (or the original) version of this wouldn’t have had dynamics written in because the harpsichord can’t change dynamics. Thirdly, without dynamics, players would use timing to create expression in the piece. Having said that, because now we obviously play the piece on a piano we have the luxury of being able to add dynamics in (because it’s pretty impossible not to change the dynamics at least a little throughout) in order to create expression. So, there are a couple of things that I can suggest: Firstly, in these kind of contrapuntal pieces where you have two melodic lines dancing together, I think you can highlight the left hand melodic ideas a little more. For example, in bar 4 that G, A, B, C can be a little more present so that our attention is drawn there. Secondly, the melodies themselves in this kind of music tend to travel quite a lot, in the first 3 notes you play an arpeggio and travel from a D to a Bb. The dynamics can also be used to highlight the high moments and come down again for the low moments much more in baroque music. The written dynamics here won’t have been in the original, so these give you a good birdseye view of how someone else would interpret each larger section of the music, but within that you have a little more room to play around and you can question the interpretation. However, I would also say that louder dynamics in this style of piece tend to be a little more rounded and less forceful, everyone in the courts back then were very civilised and wouldn’t want to be startled 😂. Timing and phrase endings, this is perhaps one of the most important things in this style of music. While in more romantic music rubato is used to express, in baroque music its used to show where the sentences are and what is important in the music. In bar 7-8 for example, the music is coming to the end of a phrase so I would slow down here (like a harpsichordist would) so that we feel the sense of resolution at the end of bar 8. I would also soften off on phrase endings so they feel like they are nice and complete. In this particular style of music there are moments where it feels like one hand (one voice) is tapering off while the other is doing something interesting (like in bars 2 and 4), and this is what makes this more difficult to play. I hope that gives you some things that you might not have thought about! You play it very well!', NULL, NULL, '2026-05-19 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'The French should probably not leave their words laying around to be stolen so e'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'It hadn’t occurred to me that detaching the notes was not the only way to give it a Baroque sound. Thank you, Matt! I’ll try this out.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-19 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-19 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'It hadn’t occurred to me that detaching the notes was not the only way to give i'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'Matthew Cawood This one sounds better, I think. The last few bars may still be a little too loud. I apologize to the court. ☺️', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-19 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-20 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood This one sounds better, I think. The last few bars may still be a'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Cécile Dautriat Wow! This is great! You have nice shaping, the melodic lines stand out really nicely in the left hand and you phrase of the sections nicely. You’ve done a great job! One thing I did notice which I think is an easy one to miss. For the trills, typically the trills start on the note above (like you are doing, which is great). However, if the note before the trill is the note above (for example at the end) then we alter it so that the trill starts on the main note itself so you don’t have to try and repeat the same note twice in a row 😀', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-19 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-21 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Impertinence (Stolen French word)' AND created_at = '2026-05-19 22:16:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Cécile Dautriat Wow! This is great! You have nice shaping, the melodic lines sta'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1), 'norman.jaillet@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1)::text, 'norman.jaillet@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1)::text AND ar.email = 'norman.jaillet@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1), 'wg33@live.co.uk'
WHERE (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1)::text, 'wg33@live.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1)::text AND ar.email = 'wg33@live.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Tulika, nice playing and I love this song, I was singing along! You have a nice clear melody over the top of your left hand harmony which is great and this is a tough song to play with all of the left hand arpeggios, you’ve done a great job. There are a few things I can suggest; Pedalling - this is a similar problem to the Wellerman Shanty, the chords are merging into each other in places. At the very beginning the song has the same chord for the entire introduction before the melody comes in so the pedal can stay down there. But as soon as the melody comes in the chords change to a 4 beat, 2 beat, 2 beat pattern. So you have C major for 4 beats then your left hand moves up to F for 2 beats and then back to C for 2 beats. This means that the pedal needs to left up and back down again for the F and then again when you return to the C. Typically in this kind of song; when the lowest note of your left hand changes, the chord is changing and thats when the pedal needs to come all the way up and then down again. For this kind of thing, you can break it down so you can make the pedalling a little more automatic. Firstly you can just play the left hand by itself to syncronise the pedal with those chord changes without having the coordination of the melody to worry about. You can also just play the first note of each chord change (so for the example I gave - just a C, then an F, then a C) so you are coordinating the foot with those notes. Then when you add the rest of the left hand back in your foot works automatically with those notes. Secondly, I think you did a nice job of building the song and making it feel more full at 1:54. With this kind of song it has a verse/chorus structure and typically the verses will feel a little more calm and the chorus a bit more full. I think you can maybe exaggerate this a little with the dynamics. When you get to the “and at last I seeeeee the liiiigggghhhttt” (that’s me singing it for you), this can be a slightly bigger moment I think. A lot of the time size comes from the left hand because bass note travel more. So, you could try make that left hand a little louder for those chorus moments (and your right hand will inevitably be bigger too) and a little less for the verse moments. Lastly, the octaves that you play at 2:20 look a little tense with your wrist lifting up and fingers straightening out. It might be worth lowering the piano a touch if you have that option. Typically, with your hands sitting on the keys, your elbow angle should be somewhere between just under a right angle and just over a right angle. Here your arms are tilted upwards quite a bit which might make it more challenging to play those octaves. But another way to make sure these feel relaxed is to do something like; play a C major scale in octaves (in both hands), play each note using a relaxed forward motion with the wrist and then immediately after each note use your arm to lift your hands away from the keys so that they are completely relaxed. If you can train your fingers, wrist and arms to be relaxed after each note, then it will become easier to string a series of octaves together with that same relaxed feeling. It sounds really nice, it’s a great song and you’ve done a great job learning it!', NULL, NULL, '2026-05-19 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Tulika, nice playing and I love this song, I was singing along! You have a n'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1), 'tdalavoy@gmail.com', 'Tulika Dalavoy', 'Matthew Cawood Thanks for the suggestions. I agree I need to work on pedaling and dynamics to take this to the next level. You''re right, it was challenging to learn the left hand since the arpeggios are a bit complicated and the patterns keep changing in every bar. I tried pedaling practice with only left hand arpeggios. Sometimes I have difficulty judging how much to release the foot without sounding disconnected. The octave issue I have in Wellerman and Moonlight Sonata as well. In the latter case my hands feel strained from playing octaves for almost the entire piece. I will try out the scale exercises and see if it helps.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-19 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-19 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1)
      AND email = 'tdalavoy@gmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood Thanks for the suggestions. I agree I need to work on pedaling an'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Tulika Dalavoy Normally that is caused by the foot coming up very slightly before the note goes down rather than how much the foot is coming up. If you already have your foot down and you want to change the pedal, if you lift the foot before you play the note where you want to change you will have small gaps where there is no sound before you play the notes from the new chord. To check if its that you could try play a each of the chords in C major (C E G, D F A, E G B, F A C, G B D, A C E, B D F) just as normal triads in your right hand and try to connect them with the pedal without them overlapping. That way you can check if that is the problem and practice the mechanics slowly. At the start your hand and foot go down at the same time, then: 1. Your hand goes down 2. Your foot comes up 3. Your foot goes down 4. Your hand comes up', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-19 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-20 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Tulika Dalavoy Normally that is caused by the foot coming up very slightly befor'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1), 'tdalavoy@gmail.com', 'Tulika Dalavoy', 'Matthew Cawood Ok, now I get it. I was lifting the foot and playing the first note of the chord at the same time, and a slight mismatch in timing was causing the disconnect. Thanks for pointing it out.🙂', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-19 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-20 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'I see the light' AND created_at = '2026-05-19 18:55:00+00' LIMIT 1)
      AND email = 'tdalavoy@gmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood Ok, now I get it. I was lifting the foot and playing the first no'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)::text, 'danielduordoe@yahoo.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)::text AND ar.email = 'danielduordoe@yahoo.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'norman.jaillet@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)::text, 'norman.jaillet@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)::text AND ar.email = 'norman.jaillet@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'shaun.purbrick@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)::text, 'shaun.purbrick@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)::text AND ar.email = 'shaun.purbrick@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'tdalavoy@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)::text, 'tdalavoy@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)::text AND ar.email = 'tdalavoy@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'norman.jaillet@gmail.com', 'Norman Jaillet', 'Nice job Connie! Bravo!  I recently did this piece for our “adult” recital. I think this is one of those pieces where you have a lot of leeway to make it your own! I made a short playlist performed by Eric Lu, Martha Argerich, Vikingur Olafsson and Khatia Buniatishvilli and listened to them over and over while driving etc. I think you get a lot of inspiration hearing them performed by others! They bend the “rules” a lot!', NULL, NULL, '2026-05-18 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)
      AND email = 'norman.jaillet@gmail.com'
      AND LEFT(content, 80) = 'Nice job Connie! Bravo!  I recently did this piece for our “adult” recital. I th'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Thank you. :) How did the recital go? Ah yes, I''ve listened to many versions, some I like, some I don''t 🙈', NULL, NULL, '2026-05-18 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Thank you. :) How did the recital go? Ah yes, I''ve listened to many versions, so'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'norman.jaillet@gmail.com', 'Norman Jaillet', 'It went very well, thanks for asking! My feedback was good; played with a lot of emotion, put myself into it, etc. There are definitely bits and pieces that I stole to make it happen—going for the musicality vibe and being loose.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-18 23:00:00+00' LIMIT 1), 'Connie Witzoe', '2026-05-18 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)
      AND email = 'norman.jaillet@gmail.com'
      AND LEFT(content, 80) = 'It went very well, thanks for asking! My feedback was good; played with a lot of'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Norman Jaillet well done! That''s great! And that''s how you make it your own  :)', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-18 23:00:00+00' LIMIT 1), 'Connie Witzoe', '2026-05-18 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Norman Jaillet well done! That''s great! And that''s how you make it your own  :)'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Nicely done! You''re really doing a good job going through the pieces. I wouldn''t worry too much about the difficulty with the touch of the piano; digital pianos do have limitations. Is that a Roland fp 30x btw?', NULL, NULL, '2026-05-18 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)
      AND email = 'danielduordoe@yahoo.co.uk'
      AND LEFT(content, 80) = 'Nicely done! You''re really doing a good job going through the pieces. I wouldn''t'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Daniel Duordoe thank you. :) Yes it is. I''m very happy with the piano, but I want a silent acoustic one. Got my eye on a Yamaha B2SC3 but I''ll have to save up for a looong time to afford one', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) AND email = 'danielduordoe@yahoo.co.uk' AND created_at = '2026-05-18 23:00:00+00' LIMIT 1), 'Daniel Duordoe', '2026-05-18 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Daniel Duordoe thank you. :) Yes it is. I''m very happy with the piano, but I wan'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Connie Witzoe I see. We have the same keyboard. I have a more modest ambition of upgrading to the FP 90x.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) AND email = 'danielduordoe@yahoo.co.uk' AND created_at = '2026-05-18 23:00:00+00' LIMIT 1), 'Daniel Duordoe', '2026-05-18 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)
      AND email = 'danielduordoe@yahoo.co.uk'
      AND LEFT(content, 80) = 'Connie Witzoe I see. We have the same keyboard. I have a more modest ambition of'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Daniel Duordoe nice! They''re pricey too for a digital. I''ve never tried one', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) AND email = 'danielduordoe@yahoo.co.uk' AND created_at = '2026-05-18 23:00:00+00' LIMIT 1), 'Daniel Duordoe', '2026-05-18 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Daniel Duordoe nice! They''re pricey too for a digital. I''ve never tried one'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Nicely played! Your tempo, your sense of cut time and your shaping is all really nice. I actually think you play this very well and I’m a little reluctant to suggest too much, but let’s see if I can provide some things that I might do and see what you think. The opening; the first bar of any piece is very important because it sets the tone of the piece and often establishes the key that we are playing in (and therefore what a listeners expectations are). In this case, you play these first 2 notes (the B and B) really nicely. When playing that first E minor chord though, to me I want to feel more melancholy so that we know the state of mind we are then working from for the rest of the piece - the chords then descend (feeling more depressed), the flourishes are attempts at escaping that depression, the large part is defiance and the ending is acceptance. That story begins with how we feel at the start of the story in bar 1. However, creating that sense of melancholy is actually quite difficult to do while keeping the forward momentum and the sense of cut time. So what I would suggest is taking a bit more time in that first bar to build into the tempo that you want, so that it feels less energetic and more lifeless (a happy thought 😂). The next part the melody is rising and falling (but ultimately falling) and I really liked how you played this, so I don’t really have much to add. You had a nice sense of sinking and the melody had a rise and fall which followed the contour of the melody. When you get to bar 10-12 we have kind of bottomed out, the chords go up and down and the melody repeats the A to F# a few times. With any repeat its always good to do something with it. In this section before the first escape attempt (bar 12), it feels like the music is been beaten down, so for these each time the A should maybe be a little less animated and the F# a little more resigned. Technically speaking, I would do that by letting your hands movement become less and less. Bar 12 - here, the difference between the lowest note of the bar (B) and the highest note of the bar (D) can be really contrasting. You mentioned about the dynamics being less in the recording apposed to in the room, so you might hear this more in real life…but worth mentioning anyway. It’s trying to fight out of that low point and ultimately the music finds itself back where it started, on the E minor chord. Bar 16-18 - This part is the real attempt at breaking out of the sadness in this piece and once again it’s worth mentioning the more extreme dynamic change (although as you said the recording is probably not doing your crescendo justice). However, also in this moment I would use a lot more momentum to push the music forward. If you play these chords too measured it can sound “grand” or “full” when really we want “angry” or “shouting at someone and storming out crying” type of feeling 👀. Because there is rubato throughout the piece, this is a moment to push, be loud and annoyed before finally submitting when it returns to “p”. Bar 21 - I really like how you made that C major chord feel bright, it’s an unusually bright chord to land on since everything up until then has been minor and sad. That is kind of the first sign of acceptance, it’s the “contentness” feeling. I think you did that well. Bar 22 - here you have an E major chord on beat 2 (which is also unusual and bright), but it immediately gets tainted by the change to E minor. it would be nice for you to use rubato here to help us feel that turn into the darkness. Bar 23 - the chord here doesn’t want to be too long, the silence is really the moment where we can feel the impact of everything that has come before it. The ending just becomes a formality and a final acceptance. That’s just a few of my thoughts, but you played this very well and it was really emotionally impactful! 😀', NULL, NULL, '2026-05-18 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Nicely played! Your tempo, your sense of cut time and your shaping is all really'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Matthew Cawood wow thank you for the detailed feedback! I will try to -re-record it at some point and try to make these changes to improve it, and hopefully I can manage to play it in a way where the recording will still pick up on the crescendo and contrast between f and p as well.  :)', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-18 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-18 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood wow thank you for the detailed feedback! I will try to -re-record'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'Sounds great! 🫠', NULL, NULL, '2026-05-18 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'Sounds great! 🫠'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Cécile Dautriat thank you  :)', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) AND email = 'cecile.dautriat@gmail.com' AND created_at = '2026-05-18 23:00:00+00' LIMIT 1), 'Cécile Dautriat', '2026-05-18 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Prelude in E minor, Op. 28 No 4. - Chopin' AND created_at = '2026-05-19 09:26:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Cécile Dautriat thank you  :)'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk'
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1)::text, 'danielduordoe@yahoo.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1)::text AND ar.email = 'danielduordoe@yahoo.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1), 'norman.jaillet@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1)::text, 'norman.jaillet@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1)::text AND ar.email = 'norman.jaillet@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Tulika, nice work..it’s a tricky piece to get your fingers around, but you handle it nicely. There’s a couple of things that could help with this one: 1. Fingers vs wrist; for the melody in this one, I notice that your fingers are working quite hard which can make it hard to keep the notes even. The melody is written in phrases and it can be useful to use your wrist to move through this in one sweeping motion, essentially aiming for the final note of each section. In par 1-2 for example, if you start the first C in the right hand but move your wrist to the right to support the E and then back down towards the C then your fingers don’t have to work quite as hard and it can help with the evenness. It’s worth practicing wrist movement at a slow speed first to feel how the motion of the wrist supports the notes. 2. Chord motion; this piece has some nice bouncy, staccato chords in the left hand, but you can help them feel important by leaning into them a bit more as the pitch ascends and backing away as the pitch descends again. For example, in bar 1 you have a C and an E (outlining a C major chord) but in bar 2 your E lifts to an F (changes to an F chord) you can perhaps lean into this a little more to show the rise of the notes and then fall back down afterwards when it returns to an E. 3. Repeating ideas; typically when an idea repeats we want to make it slightly different in some way. Typically that’s in one of two ways, we make it slightly louder (to reinforce the idea), or we back off a little (like an echo). In bar 9 when the initial idea repeats, it might be nice to play that a fraction less than the first time. 4. Note flourishes; bar 13-15 and 49-51 and also in some other places you have a run of right hand notes. In these places, I’d maybe suggest falling with those notes in dynamic as well. 5. modulation; in bar 25 we have F#s in the music and we have these for a while, which means we are now using a G major scale (G A B C D E F#). This is interesting because the music has travelled somewhere, in this moment in bar 25, I’d move into that bar a tiny bit slower (rubato), so that we feel the surprise that comes with changing to G major. Similarly in bar 45 when it moves back to C major with the same initial theme, that feels like we have returned home and comfortable. It would be nice to make is wait a little for that turning of the corner back into the main theme. You played it really nicely, so I’ve given you quite a bit of detail there, so let me know if anything doesn’t make sense and il happily explain!', NULL, NULL, '2026-04-30 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Tulika, nice work..it’s a tricky piece to get your fingers around, but you h'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1), 'tdalavoy@gmail.com', 'Tulika Dalavoy', 'Matthew Cawood Hi Matt. Thanks for the detailed feedback. I loved these ideas; will definitely try them.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-04-30 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-04-30 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1)
      AND email = 'tdalavoy@gmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood Hi Matt. Thanks for the detailed feedback. I loved these ideas; w'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1), 'tdalavoy@gmail.com', 'Tulika Dalavoy', 'Matthew Cawood Hi Matt. One thing I don''t quite understand is how wrist movement can be leveraged in pieces like this where notes are very close like in playing scales. I use wrist movements while doing leaps or playing octave chords or arpeggios to make it easier to move between octaves. I try observing hand movements in the youtube videos as well but I just don''t get how I can move the wrist without getting my finger on the wrong note in this one. I might help maybe sometime if you could post a video on hand movements and how to leverage them in different types of passages.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-04-30 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-04-30 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1)
      AND email = 'tdalavoy@gmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood Hi Matt. One thing I don''t quite understand is how wrist movement'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Tulika Dalavoy Hey Tulika, hopefully this helps with this specific piece. At full speed it’s harder to put quite so much effort into moving like this, so doing the slow practice with deliberate movements means that when you play it faster although the wrist movement will be small it will naturally be there. I’ll definitely do a video on this particular topic though, because these kind of movements are quite hard to work out how to do.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-04-30 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-01 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Tulika Dalavoy Hey Tulika, hopefully this helps with this specific piece. At ful'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1), 'tdalavoy@gmail.com', 'Tulika Dalavoy', 'This is very helpful. Thanks Matt for making this video. It''s clear now.', NULL, NULL, '2026-05-01 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina' AND created_at = '2026-05-01 08:59:00+00' LIMIT 1)
      AND email = 'tdalavoy@gmail.com'
      AND LEFT(content, 80) = 'This is very helpful. Thanks Matt for making this video. It''s clear now.'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk'
WHERE (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1)::text, 'danielduordoe@yahoo.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1)::text AND ar.email = 'danielduordoe@yahoo.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1), 'norman.jaillet@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1)::text, 'norman.jaillet@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1)::text AND ar.email = 'norman.jaillet@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1), 'robert.m.ayres@outlook.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1)::text, 'robert.m.ayres@outlook.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1)::text AND ar.email = 'robert.m.ayres@outlook.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Nice! A great piece for working on lots of different things. The chords in this are clear, it also makes you practice giving the importance to each hand too. Firstly, you play it really nicely and you’ve clearly worked hard on making sure all the details are in there. Your annotations make it really clear that you are thinking about what is happening in the music as well, which is really great. A think maybe my best approach to feedback on this one is to work through the things I noticed in order as it’s a short piece I can be precise: 1. Phrase shaping; with patterns like the A, B, C, B, A in bar 1 it would be nice to try and show the shape of those types of melodic ideas by leaning towards the C and then pulling away again towards the A. You can do this with a mini crescendo and diminuendo before it then echos in the left hand. That will give you contrast when you push through with the crescendo thats written in bar 2 as the melody ascends, almost like the music is trying to rise but then fails before trying again and succeeding. You can then do the opposite in bar 5 because the pattern descends and then ascends. This should also help with a feeling of control in the fingers because you are leading towards and away from somewhere. 2. Bar 4-5; the rest was cut a little short at the end of bar 4 so bar 5 entered a bit early. Because we are in 4/4, if you place a little more emphasis on the B (in the right hand) in bar 5 (maybe using arm weight to drop on it a little) making sure that beat 1 is the strong beat in the bar, then it might be a bit easier to feel where that pulse is entering into that bar. 3. dynamics; when pieces have a limited dynamic range (no ppp’s or fff’s), then you can expand what those dynamics mean a little. If the highest dynamic we reach is mf with a crescendo, then this can be your peak. So I would try to make your mf section contrast a little more to the mp section. 4. rests; you actually played the rests great for the most part, these are really easy to miss in a piece like this so nice work! There was just one in bar 7 that the A lingered through…but I have a feeling that isn’t a real issue for you as the other ones were all there! You played it great though, you’ve thought about pretty much all of the important features of the piece!', NULL, NULL, '2026-04-28 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Nice! A great piece for working on lots of different things. The chords in this '
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'Matthew Cawood thank you! 🙂', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-04-28 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-04-29 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood thank you! 🙂'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'I think that sounds less “rushed”', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-04-28 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-01 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'I think that sounds less “rushed”'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Cécile Dautriat It sounds great…you shape it really nicely in this one. You also got the counting in bar 4-5 and I can here the difference between the quality of the E major chord in bar 5 and the A minor chord in bar 1 much more distinctly!', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-04-28 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-02 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Canon in Am' AND created_at = '2026-04-29 23:15:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Cécile Dautriat It sounds great…you shape it really nicely in this one. You also'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1), 'andilammer@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)::text, 'andilammer@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)::text AND ar.email = 'andilammer@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1), 'jeff_epstein@yahoo.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)::text, 'jeff_epstein@yahoo.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)::text AND ar.email = 'jeff_epstein@yahoo.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1), 'lucaskinzo@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)::text, 'lucaskinzo@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)::text AND ar.email = 'lucaskinzo@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1), 'mortenjensen@me.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)::text, 'mortenjensen@me.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)::text AND ar.email = 'mortenjensen@me.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1), 'norman.jaillet@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)::text, 'norman.jaillet@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)::text AND ar.email = 'norman.jaillet@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'To answer your specific questions: I think, in this piece for the tempo I think you played it very well. But I would also be tempted to try pushing forward a little but as the dynamic increases and pulling back a little bit towards the end of phrases. You are probably naturally wanting to do that because it helps express the sentiment of the piece; and thats ok! If it’s something you do for every piece regardless of the style then I would try using scales to vary dynamics while maintaining tempo, but if it is just in this context…then that might be telling you something about what you feel about the music. Pedalling, hopefully I answered that in the video. The pedal is only really not good to be used in 2 situations. Firstly if the piece is a Baroque piece (around 1700s or earlier) or if the piece deliberately has detached notes (lots of rests or staccato). With this kind of piece, with clear chords, I would definitely use the pedal. arm weight, I think your technique looks generally good. If you want to feel more in control of which part is control the motion (arm, wrist, fingers). Try some staccato scales, slowly and try only using your fingers to create the staccato, then only using your wrist and then only using your arm. You will start to get a feel of which pivot point is being used. Recording yourself is always a great way of seeing what’s going on! 😂', NULL, NULL, '2026-04-24 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'To answer your specific questions: I think, in this piece for the tempo I think '
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'Matthew Cawood Thank you so much for your feedback. I’ll try to make this doll suffer a little more. Your French is quite good. ☺️', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-04-24 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-04-24 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood Thank you so much for your feedback. I’ll try to make this doll s'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'Matthew Cawood Does that sound better?', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-04-24 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-04-27 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood Does that sound better?'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Cécile Dautriat 👏👏👏 I think it definitely sounds better, what do you think? The pedalling adds more presence and weight to the piece and I like your crescendo to forte, it was much more impactful and you climbed down from it really nicely. You have a really nice way of placing chords as well, an example of that being that very final right hand chord in the last bar…you placed it perfectly. I also think the slightly more falling forward feeling makes the crescendo feel a little more anxious which is nice. There’s always things you can play around within a piece like this and many of them are equally valid, slight variation in tempos to get the effect you want is a good example of that. But I’m interested to know what you think?', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-04-24 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-04-27 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Sick Doll Attempt' AND created_at = '2026-04-25 13:38:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Cécile Dautriat 👏👏👏 I think it definitely sounds better, what do you think? The '
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'amandaperfect@comcast.net'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text, 'amandaperfect@comcast.net', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text AND ar.email = 'amandaperfect@comcast.net'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text, 'danielduordoe@yahoo.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text AND ar.email = 'danielduordoe@yahoo.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'janesimpson50@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text, 'janesimpson50@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text AND ar.email = 'janesimpson50@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'lucaskinzo@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text, 'lucaskinzo@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text AND ar.email = 'lucaskinzo@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'michaelpage05@hotmail.co.uk'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text, 'michaelpage05@hotmail.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text AND ar.email = 'michaelpage05@hotmail.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'norman.jaillet@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text, 'norman.jaillet@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text AND ar.email = 'norman.jaillet@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'paulinehkloh@yahoo.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text, 'paulinehkloh@yahoo.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text AND ar.email = 'paulinehkloh@yahoo.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'rafal.andrzej.puzio@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text, 'rafal.andrzej.puzio@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text AND ar.email = 'rafal.andrzej.puzio@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'csikzsuzsi@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text, 'csikzsuzsi@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)::text AND ar.email = 'csikzsuzsi@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Omg. That was amazing. You played it beautifully and at a steady tempo. This is the next piece on my to-learn list. Hopefully I can play as beautifully as this. Bravo!', NULL, NULL, '2026-04-21 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)
      AND email = 'danielduordoe@yahoo.co.uk'
      AND LEFT(content, 80) = 'Omg. That was amazing. You played it beautifully and at a steady tempo. This is '
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Daniel Duordoe thanks so much :) hope you enjoy learning it  :)', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) AND email = 'danielduordoe@yahoo.co.uk' AND created_at = '2026-04-21 23:00:00+00' LIMIT 1), 'Daniel Duordoe', '2026-04-21 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Daniel Duordoe thanks so much :) hope you enjoy learning it  :)'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Jeff L Epstein thank you for your comment :) Does the volume on the piano actually affect the recording? I haven''t tested the differences with low and high volume on a recording.. (I like a high volume I pay to feel the impact on the crescendo etc more but not so high that it wakes up the kids 😅) Oh interesting, the teacher at my first lesson yesterday was sitting so low and had me sitting lower than I felt comfortable doing, as I''m already sat quite high at home. (My lower arms aren''t perpendicular to the floor, elbows are slightly higher than the wrists already.) Would it help for me to sit further back instead? Ah thanks, yes I love the Roland. Gives you a lot of value for a fairly low price. :)', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Jeff L Epstein thank you for your comment :) Does the volume on the piano actual'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Wow Connie Witzoe , very beautifully played! I love the way you use rubato to slow down into and place the notes at the end of phrases so that we feel like the music is landing somewhere. You also have a really nice separation between your melody and the harmony underneath, particularly when the melody first appears. That’s a tricky thing to do in this piece, especially at the beginning after setting the scene with the introduction and having to layer that melody over the top. Interestingly, I think the quiet dynamic here is very nice, but here is something that might help the way you think about it. I think the tendency for many people when playing pieces like the Moonlight Sonata is to aim for “quiet” rather than aiming for “defeated”. Dynamics typically point towards a particular emotion that the music is trying to express. In this case my personal feeling is that the music feels defeated and those moments where the dynamic increases are moments of “defiance”. If you think in these terms, you can allow yourself the freedom to not necessarily hold the music back, but instead think in relativity. how “defiant” is your cresc. compared to the defeated softer dynamics? The piece also has a 2/2 time signature, which means that each bar feels like there are 2 strong pulses in the bar. I think this does 2 things to the music that are interesting to think about. Firstly, it means the music falls forward so that each beat connects to each other, with the rotating triplets helping that falling forward feeling. Secondly when you have moments where the left hand is playing quarter notes/crotchets, you feel the heaviness of the one that lands on the mid point of the bar more so than the second one in the bar. You play it really great, very poignant and I can tell you really understand the music.', NULL, NULL, '2026-04-21 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Wow Connie Witzoe , very beautifully played! I love the way you use rubato to sl'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Wow thank you for such a detailed comment  :) I like you describing it as “defeated”. That''s the way I think about Chopin''s Prelude in E minor as well, and it definitely changed the way I play it. Thanks a lot for the feedback. I look forward to playing it again with that in mind when I finish work. :)', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-04-21 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Wow thank you for such a detailed comment  :) I like you describing it as “defea'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Michael Page aww thanks a lot! It''s a really nice piece to play, and it was the first piece I learned to play many years ago.', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Michael Page aww thanks a lot! It''s a really nice piece to play, and it was the '
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Michael Page it might be closer thank you think. :)', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Michael Page it might be closer thank you think. :)'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Mike Flander haha thank you. Funny you say that as I accidentally had page 2 up when I started playing and had to flick back to page 1 😅', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Mike Flander haha thank you. Funny you say that as I accidentally had page 2 up '
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'tdalavoy@gmail.com', 'Tulika Dalavoy', 'Very nice and expressive. I loved the crescendo and the way you maintained the tempo till the end. I have been practicing this piece for a while. The main challenge I have is that I feel strain in my hands from playing octaves for an extended period, so finger movements get restricted. Any suggestions on how to address this? I feel like if my hands are more relaxed I will be able to play it more musically.', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)
      AND email = 'tdalavoy@gmail.com'
      AND LEFT(content, 80) = 'Very nice and expressive. I loved the crescendo and the way you maintained the t'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Tulika Dalavoy I had this exact same problem, and sometimes it still comes back. The teacher I saw yesterday actually addressed that I''m trying to keep my wrists too high up when playing the octaves and that affects my reach and causes strain (I''ve had it in my head about curved fingers but this isn''t ideal when doing octaves). By lowering my wrist and flattening my hand a bit more my reach could go to the 9th key more easily (which happens sometimes in the melody in the right hand in this piece) and I felt a lot less strain. Another thing that helps is when you''ve played for a bit, before you get the strain, put your arms down to the sides and relax them and your shoulders. Shake them out a little and let them hang before you continue playing.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) AND email = 'tdalavoy@gmail.com' AND created_at = '2026-04-22 23:00:00+00' LIMIT 1), 'Tulika Dalavoy', '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Tulika Dalavoy I had this exact same problem, and sometimes it still comes back.'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'tdalavoy@gmail.com', 'Tulika Dalavoy', 'Connie Witzoe I tried that too. But how do you avoid unintentionally hitting other keys when you keep you wrist lower? I have this issue with octaves in other pieces as well.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) AND email = 'tdalavoy@gmail.com' AND created_at = '2026-04-22 23:00:00+00' LIMIT 1), 'Tulika Dalavoy', '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)
      AND email = 'tdalavoy@gmail.com'
      AND LEFT(content, 80) = 'Connie Witzoe I tried that too. But how do you avoid unintentionally hitting oth'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Tulika Dalavoy the further down the edge on the keys you press the easier it is. The further in on the keyboard you press it gets harder to avoid hitting the keys with the palm of your hand. So white keys are obviously easier to play with a flat hand as the palm of your hand has nothing to touch, (if you press the edge of the keys which gives you better control anyway) but black keys you still need to raise your wrist high enough to not hit the white keys underneath. Hope that makes sense, I guess it would be easier if I showed you a video but I don''t have my piano in front of me right now 🙈', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) AND email = 'tdalavoy@gmail.com' AND created_at = '2026-04-22 23:00:00+00' LIMIT 1), 'Tulika Dalavoy', '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Tulika Dalavoy the further down the edge on the keys you press the easier it is.'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'David Hamilton oh wow thank you so much :)  it''s a great keyboard :)', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'David Hamilton oh wow thank you so much :)  it''s a great keyboard :)'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'gnpedgar@yahoo.com', 'Norma Edgar', 'Beautiful Connie! 👏😊There is so much to learn from this piece, Beethoven was such an amazing composer. Great job!', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)
      AND email = 'gnpedgar@yahoo.com'
      AND LEFT(content, 80) = 'Beautiful Connie! 👏😊There is so much to learn from this piece, Beethoven was suc'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Norma Edgar thank you :) It really is such a beautiful piece and the more I play it the more I appreciate the melody and variations in the chords and how dramatic the piece really is.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) AND email = 'gnpedgar@yahoo.com' AND created_at = '2026-04-22 23:00:00+00' LIMIT 1), 'Norma Edgar', '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Norma Edgar thank you :) It really is such a beautiful piece and the more I play'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1), 'gnpedgar@yahoo.com', 'Norma Edgar', 'Beautiful Connie! 👏😊There is so much to learn from this piece, Beethoven was such an amazing composer. Great job!', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Moonlight Sonata' AND created_at = '2026-04-22 21:18:00+00' LIMIT 1)
      AND email = 'gnpedgar@yahoo.com'
      AND LEFT(content, 80) = 'Beautiful Connie! 👏😊There is so much to learn from this piece, Beethoven was suc'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1), 'amandaperfect@comcast.net'
WHERE (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1)::text, 'amandaperfect@comcast.net', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1)::text AND ar.email = 'amandaperfect@comcast.net'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', '', NULL, NULL, '2026-04-20 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = ''
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'BONJOUR!! 😃', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'BONJOUR!! 😃'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Cécile Dautriat can you tell that I’m learning French 😂', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1) AND email = 'cecile.dautriat@gmail.com' AND created_at = '2026-04-22 23:00:00+00' LIMIT 1), 'Cécile Dautriat', '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Cécile Dautriat can you tell that I’m learning French 😂'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'Matthew Cawood This is a great initiative! I can tell you’re playing your C-scale a lot better when you speak French. 🤣', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1) AND email = 'cecile.dautriat@gmail.com' AND created_at = '2026-04-22 23:00:00+00' LIMIT 1), 'Cécile Dautriat', '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Scales Help' AND created_at = '2026-04-21 15:58:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'Matthew Cawood This is a great initiative! I can tell you’re playing your C-scal'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1), 'gnpedgar@yahoo.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1)::text, 'gnpedgar@yahoo.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1)::text AND ar.email = 'gnpedgar@yahoo.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1), 'norman.jaillet@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1)::text, 'norman.jaillet@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1)::text AND ar.email = 'norman.jaillet@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1), 'tarthurfarrell@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1)::text, 'tarthurfarrell@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1)::text AND ar.email = 'tarthurfarrell@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Nice! Really liked the gradual build-up with the octaves etc. :)', NULL, NULL, '2026-05-15 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Nice! Really liked the gradual build-up with the octaves etc. :)'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Denzel, this is really nice…a great way of really internalising a scale/key too. I agree with Connie, the way you build the music makes a big impact on how it feels. Also, moving around octaves in the right hand like that is not so easy, particularly with how relaxed you seem. Recording progress is really good, it never has to be perfect. I’ll give you two examples from 2016 of my practice recording.', NULL, NULL, '2026-05-15 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Denzel, this is really nice…a great way of really internalising a scale/key '
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'This one is a Bach piece and I couldn’t remember what I was supposed to play and was clearly annoyed at that fact 😂', NULL, NULL, '2026-05-15 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'This one is a Bach piece and I couldn’t remember what I was supposed to play and'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'This one I got the first note wrong! 😂 But even with that, now it’s good to look back at and see progression and also remember the piece and how it felt to learn vs now.', NULL, NULL, '2026-05-15 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Just some improvising' AND created_at = '2026-05-16 03:31:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'This one I got the first note wrong! 😂 But even with that, now it’s good to look'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1), 'gnpedgar@yahoo.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1)::text, 'gnpedgar@yahoo.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1)::text AND ar.email = 'gnpedgar@yahoo.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1), 'tarthurfarrell@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1)::text, 'tarthurfarrell@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1)::text AND ar.email = 'tarthurfarrell@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Tulika, this is great! Your scale sections are nice and even! 😊 The book “A Dozen a Day” might be helpful for the staccato practice if you want to isolate that particular problem. That book is aimed at particular techniques and they are really short little pieces that are programmatic (they depict a particular scene or idea), so it helps to imagine what it’s about to make the movements easier. www.mypiano.com.au/uploads/1/5/5/7/15579660/a_dozen_a_day_-_book_one_-_primary.pdf Group 4: No. 5 & No.11 Group 5: No. 6 & No. 7 Group 4 No. 11 in particular has those moving thirds pattern in. You could also try Group 5 No. 10 but make it staccato.', NULL, NULL, '2026-05-12 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Clementi sonatina opus 36 no. 3' AND created_at = '2026-05-13 08:58:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Hey Tulika, this is great! Your scale sections are nice and even! 😊 The book “A '
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1), 'tarthurfarrell@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1)::text, 'tarthurfarrell@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1)::text AND ar.email = 'tarthurfarrell@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Wow I think that''s really impressive in 9 days. The sheet music for this piece makes my eyes cross more than the hands, so well done! You''re almost at the fun part! If you need a week before moving on then do that, but maybe try to play through the parts you know at least once a day so you don''t have to re-learn it again in a week? Oh and the second we start recording ourselves we will never feel that we play as well as when we play for just ourselves. I can''t wait to start playing this piece myself. Great job!', NULL, NULL, '2026-05-09 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Wow I think that''s really impressive in 9 days. The sheet music for this piece m'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Denzel R Riwai great memory! I am that person 😊 (though I''m really from Norway, just happen to live in Wales 😅) And yes I really wanna learn this piece, and I have the sheet music ready. Oh wow yeah if you wanna share that with me I''d be very grateful 😊 looks like you can send personal messages on here so whenever you''re ready, send me a message. 😊 Oh and about your flat-mates: dunno if you already have a headset to practice with, but that''s what I would use to get them off my back.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1) AND email = 'connieuitsu@gmail.com' AND created_at = '2026-05-09 23:00:00+00' LIMIT 1), 'Connie Witzoe', '2026-05-10 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Denzel R Riwai great memory! I am that person 😊 (though I''m really from Norway, '
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Nice work! To get these notes learned with this accuracy on this kind of piece is a tall order for such a short learning time, so you’ve done a great job. What made you decide to learn this piece in particular? Was it a big motivation for you to learn the piano? I can also understand, like Connie, the frustration with recording. I did some recordings of a Chopin etude many years ago and I remember recording it maybe 120 times and I still wasn’t happy enough with it to do anything with that recording!', NULL, NULL, '2026-05-09 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Nice work! To get these notes learned with this accuracy on this kind of piece i'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Denzel R Riwai it definitely has its technical, musical and theoretical challenges, but it’s also an exciting piece and I spent many hours motivated by it when I first learnt it too. To really play the piece well, it might take a bit of consolidation time as well as raw practice hours, particularly for the technical difficulties in the middle section…but I have no doubt you’ll get there if you keep going. You are also right that it’s good for people to see that these kind of pieces don’t need to be unapproachable 😊', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1) AND email = 'matthew@matthewcawood.com' AND created_at = '2026-05-09 23:00:00+00' LIMIT 1), 'Matthew Cawood', '2026-05-09 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Close enough to a week milestone - Rach''s prelude in C sharp minor' AND created_at = '2026-05-10 09:51:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Denzel R Riwai it definitely has its technical, musical and theoretical challeng'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1), 'larahnja@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)::text, 'larahnja@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)::text AND ar.email = 'larahnja@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1), 'gnpedgar@yahoo.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)::text, 'gnpedgar@yahoo.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)::text AND ar.email = 'gnpedgar@yahoo.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1), 'tarthurfarrell@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)::text, 'tarthurfarrell@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)::text AND ar.email = 'tarthurfarrell@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1), 'wg33@live.co.uk'
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)::text, 'wg33@live.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)::text AND ar.email = 'wg33@live.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Nice work Michael Page ! The counting is very good, you nailed it! 👌', NULL, NULL, '2026-05-04 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Melodic Study in C major, Op. 599, No. 1' AND created_at = '2026-05-05 19:58:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Nice work Michael Page ! The counting is very good, you nailed it! 👌'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = '30 minutes Rach''s Prelude in C sharp minor.' AND created_at = '2026-05-05 06:38:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = '30 minutes Rach''s Prelude in C sharp minor.' AND created_at = '2026-05-05 06:38:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = '30 minutes Rach''s Prelude in C sharp minor.' AND created_at = '2026-05-05 06:38:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = '30 minutes Rach''s Prelude in C sharp minor.' AND created_at = '2026-05-05 06:38:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = '30 minutes Rach''s Prelude in C sharp minor.' AND created_at = '2026-05-05 06:38:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = '30 minutes Rach''s Prelude in C sharp minor.' AND created_at = '2026-05-05 06:38:00+00' LIMIT 1), 'gnpedgar@yahoo.com'
WHERE (SELECT id FROM community_posts WHERE title = '30 minutes Rach''s Prelude in C sharp minor.' AND created_at = '2026-05-05 06:38:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = '30 minutes Rach''s Prelude in C sharp minor.' AND created_at = '2026-05-05 06:38:00+00' LIMIT 1)::text, 'gnpedgar@yahoo.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = '30 minutes Rach''s Prelude in C sharp minor.' AND created_at = '2026-05-05 06:38:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = '30 minutes Rach''s Prelude in C sharp minor.' AND created_at = '2026-05-05 06:38:00+00' LIMIT 1)::text AND ar.email = 'gnpedgar@yahoo.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = '30 minutes Rach''s Prelude in C sharp minor.' AND created_at = '2026-05-05 06:38:00+00' LIMIT 1), 'bobbymi003@gmail.com', 'BOBBY', 'good work', NULL, NULL, '2026-05-04 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = '30 minutes Rach''s Prelude in C sharp minor.' AND created_at = '2026-05-05 06:38:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = '30 minutes Rach''s Prelude in C sharp minor.' AND created_at = '2026-05-05 06:38:00+00' LIMIT 1)
      AND email = 'bobbymi003@gmail.com'
      AND LEFT(content, 80) = 'good work'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1), 'janesimpson50@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text, 'janesimpson50@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text AND ar.email = 'janesimpson50@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1), 'lucaskinzo@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text, 'lucaskinzo@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text AND ar.email = 'lucaskinzo@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1), 'mortenjensen@me.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text, 'mortenjensen@me.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text AND ar.email = 'mortenjensen@me.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1), 'norman.jaillet@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text, 'norman.jaillet@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text AND ar.email = 'norman.jaillet@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1), 'paulinehkloh@yahoo.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text, 'paulinehkloh@yahoo.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text AND ar.email = 'paulinehkloh@yahoo.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1), 'rafal.andrzej.puzio@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text, 'rafal.andrzej.puzio@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text AND ar.email = 'rafal.andrzej.puzio@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1), 'tarthurfarrell@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text, 'tarthurfarrell@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text AND ar.email = 'tarthurfarrell@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1), 'wg33@live.co.uk'
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text, 'wg33@live.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)::text AND ar.email = 'wg33@live.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1), 'confi1@hotmail.com', 'Kelly Williams', 'This is really nice, well done for posting! 👏', NULL, NULL, '2026-04-25 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)
      AND email = 'confi1@hotmail.com'
      AND LEFT(content, 80) = 'This is really nice, well done for posting! 👏'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1), 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'Well played sir! May I ask what brand your piano is?', NULL, NULL, '2026-04-25 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)
      AND email = 'lucaskinzo@hotmail.com'
      AND LEFT(content, 80) = 'Well played sir! May I ask what brand your piano is?'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Wow Greg ! Very beautifully played. You play with a really nice sensitivity. 😀', NULL, NULL, '2026-04-25 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Wow Greg ! Very beautifully played. You play with a really nice sensitivity. 😀'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1), 'gnpedgar@yahoo.com', 'Norma Edgar', 'Glad you posted this Greg! Nicely done.', NULL, NULL, '2026-04-26 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Solitude' AND created_at = '2026-04-26 17:35:00+00' LIMIT 1)
      AND email = 'gnpedgar@yahoo.com'
      AND LEFT(content, 80) = 'Glad you posted this Greg! Nicely done.'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1), 'gregvant@btinternet.com'
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text, 'gregvant@btinternet.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text AND ar.email = 'gregvant@btinternet.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1), 'jeff_epstein@yahoo.com'
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text, 'jeff_epstein@yahoo.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text AND ar.email = 'jeff_epstein@yahoo.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1), 'lucaskinzo@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text, 'lucaskinzo@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text AND ar.email = 'lucaskinzo@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1), 'michaelpage05@hotmail.co.uk'
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text, 'michaelpage05@hotmail.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text AND ar.email = 'michaelpage05@hotmail.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1), 'rafal.andrzej.puzio@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text, 'rafal.andrzej.puzio@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text AND ar.email = 'rafal.andrzej.puzio@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1), 'tarthurfarrell@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text, 'tarthurfarrell@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)::text AND ar.email = 'tarthurfarrell@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Very nice! It sounds like something from a Ghibli movie. 😊', NULL, NULL, '2026-04-25 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Very nice! It sounds like something from a Ghibli movie. 😊'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1), 'confi1@hotmail.com', 'Kelly Williams', 'This is nice and relaxing 😌', NULL, NULL, '2026-04-25 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)
      AND email = 'confi1@hotmail.com'
      AND LEFT(content, 80) = 'This is nice and relaxing 😌'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Really nicely played Sonus Lucis ! there’s some really interesting chords in there and you make them sing really nicely!', NULL, NULL, '2026-04-25 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Really nicely played Sonus Lucis ! there’s some really interesting chords in the'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1), 'gnpedgar@yahoo.com', 'Norma Edgar', 'Hi Sonus, it’s a very nice song. You played the chords so well! It’s a very relaxing song', NULL, NULL, '2026-04-26 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'A Warbler Sings' AND created_at = '2026-04-26 14:30:00+00' LIMIT 1)
      AND email = 'gnpedgar@yahoo.com'
      AND LEFT(content, 80) = 'Hi Sonus, it’s a very nice song. You played the chords so well! It’s a very rela'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1), 'janesimpson50@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text, 'janesimpson50@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text AND ar.email = 'janesimpson50@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1), 'larahnja@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text, 'larahnja@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text AND ar.email = 'larahnja@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1), 'rafal.andrzej.puzio@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text, 'rafal.andrzej.puzio@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text AND ar.email = 'rafal.andrzej.puzio@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1), 'tarthurfarrell@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text, 'tarthurfarrell@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text AND ar.email = 'tarthurfarrell@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1), 'tdalavoy@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text, 'tdalavoy@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text AND ar.email = 'tdalavoy@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1), 'csikzsuzsi@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text, 'csikzsuzsi@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)::text AND ar.email = 'csikzsuzsi@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'Sounds good! Do you have a special technique for the “swing” rhythm or do you go by feel? I struggle with this, but I find that playing the (groups of two) eighth notes as triplets and then tying the first two notes together helps (to some extent).', NULL, NULL, '2026-04-21 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'Sounds good! Do you have a special technique for the “swing” rhythm or do you go'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1), 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'Jeff L Epstein It makes sense! Thank you for taking the time to explain. 🙂', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) AND email = 'cecile.dautriat@gmail.com' AND created_at = '2026-04-21 23:00:00+00' LIMIT 1), 'Cécile Dautriat', '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)
      AND email = 'cecile.dautriat@gmail.com'
      AND LEFT(content, 80) = 'Jeff L Epstein It makes sense! Thank you for taking the time to explain. 🙂'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Nice work, sounds great and it’s a great piece! 😀', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Nice work, sounds great and it’s a great piece! 😀'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Very nice! It sounds and looks like a fun piece to play!', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Very nice! It sounds and looks like a fun piece to play!'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1), 'gnpedgar@yahoo.com', 'Norma Edgar', 'IñGreat song, and nice job with the stride piano! 😊', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Scott Joplin''s Bethena (1904) - learning piano for 1 year and 9 months' AND created_at = '2026-04-23 00:39:00+00' LIMIT 1)
      AND email = 'gnpedgar@yahoo.com'
      AND LEFT(content, 80) = 'IñGreat song, and nice job with the stride piano! 😊'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1), 'amandaperfect@comcast.net'
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text, 'amandaperfect@comcast.net', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text AND ar.email = 'amandaperfect@comcast.net'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1), 'janesimpson50@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text, 'janesimpson50@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text AND ar.email = 'janesimpson50@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1), 'larahnja@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text, 'larahnja@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text AND ar.email = 'larahnja@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1), 'lucaskinzo@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text, 'lucaskinzo@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text AND ar.email = 'lucaskinzo@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1), 'matthew@matthewcawood.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text, 'matthew@matthewcawood.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text AND ar.email = 'matthew@matthewcawood.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1), 'rafal.andrzej.puzio@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text, 'rafal.andrzej.puzio@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text AND ar.email = 'rafal.andrzej.puzio@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1), 'shaun.purbrick@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text, 'shaun.purbrick@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text AND ar.email = 'shaun.purbrick@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1), 'steve@sonuslucis.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text, 'steve@sonuslucis.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text AND ar.email = 'steve@sonuslucis.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1), 'tarthurfarrell@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text, 'tarthurfarrell@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text AND ar.email = 'tarthurfarrell@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1), 'csikzsuzsi@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text, 'csikzsuzsi@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)::text AND ar.email = 'csikzsuzsi@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Sounds great! and well done for being the first one to post! 👏', NULL, NULL, '2026-04-21 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Sounds great! and well done for being the first one to post! 👏'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1), 'gnpedgar@yahoo.com', 'Norma Edgar', 'That was beautiful. Nice job!! 👏', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)
      AND email = 'gnpedgar@yahoo.com'
      AND LEFT(content, 80) = 'That was beautiful. Nice job!! 👏'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1), 'gnpedgar@yahoo.com', 'Norma Edgar', 'That was beautiful. Nice job!! 👏', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'Ballade pour Adeline' AND created_at = '2026-04-22 20:02:00+00' LIMIT 1)
      AND email = 'gnpedgar@yahoo.com'
      AND LEFT(content, 80) = 'That was beautiful. Nice job!! 👏'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'amandaperfect@comcast.net'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text, 'amandaperfect@comcast.net', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text AND ar.email = 'amandaperfect@comcast.net'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'cecile.dautriat@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text, 'cecile.dautriat@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text AND ar.email = 'cecile.dautriat@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text, 'danielduordoe@yahoo.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text AND ar.email = 'danielduordoe@yahoo.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'hivoltageroc@aol.com'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text, 'hivoltageroc@aol.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text AND ar.email = 'hivoltageroc@aol.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'janesimpson50@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text, 'janesimpson50@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text AND ar.email = 'janesimpson50@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'larahnja@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text, 'larahnja@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text AND ar.email = 'larahnja@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'lucaskinzo@hotmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text, 'lucaskinzo@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text AND ar.email = 'lucaskinzo@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'michaelpage05@hotmail.co.uk'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text, 'michaelpage05@hotmail.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text AND ar.email = 'michaelpage05@hotmail.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'paulinehkloh@yahoo.com'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text, 'paulinehkloh@yahoo.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text AND ar.email = 'paulinehkloh@yahoo.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'rafal.andrzej.puzio@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text, 'rafal.andrzej.puzio@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text AND ar.email = 'rafal.andrzej.puzio@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_likes (post_id, email)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'tarthurfarrell@gmail.com'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text, 'tarthurfarrell@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)::text AND ar.email = 'tarthurfarrell@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Thanks Michael Page 😀', NULL, NULL, '2026-04-21 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Thanks Michael Page 😀'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'matthew@matthewcawood.com', 'Matthew Cawood', 'Jeff L Epstein It was a bit of improvisation, but it does sound suspiciously like many songs!', NULL, NULL, '2026-04-21 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)
      AND email = 'matthew@matthewcawood.com'
      AND LEFT(content, 80) = 'Jeff L Epstein It was a bit of improvisation, but it does sound suspiciously lik'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'So calming and relaxing. This could definitely be part of a Pixar soundtrack.', NULL, NULL, '2026-04-21 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)
      AND email = 'lucaskinzo@hotmail.com'
      AND LEFT(content, 80) = 'So calming and relaxing. This could definitely be part of a Pixar soundtrack.'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'connieuitsu@gmail.com', 'Connie Witzoe', 'Wow this was beautiful! I could easily listen to a full album of your improvisations. And your reach is insane 😮', NULL, NULL, '2026-04-22 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)
      AND email = 'connieuitsu@gmail.com'
      AND LEFT(content, 80) = 'Wow this was beautiful! I could easily listen to a full album of your improvisat'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Connie Witzoe Yeah. I noticed the reach too.', (SELECT id FROM community_post_comments WHERE post_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) AND email = 'connieuitsu@gmail.com' AND created_at = '2026-04-22 23:00:00+00' LIMIT 1), 'Connie Witzoe', '2026-04-24 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)
      AND email = 'danielduordoe@yahoo.co.uk'
      AND LEFT(content, 80) = 'Connie Witzoe Yeah. I noticed the reach too.'
  );
INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at)
SELECT (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1), 'gnpedgar@yahoo.com', 'Norma Edgar', 'Hi Matt, I am just getting used to the site and just found this. Thanks for sharing this with us! I love the improvisations, rhythm changes, arpeggios… Beautiful song.', NULL, NULL, '2026-04-26 23:00:00+00'
WHERE (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_post_comments
    WHERE post_id = (SELECT id FROM community_posts WHERE title = 'An Improvisation - For Fun' AND created_at = '2026-04-21 15:19:00+00' LIMIT 1)
      AND email = 'gnpedgar@yahoo.com'
      AND LEFT(content, 80) = 'Hi Matt, I am just getting used to the site and just found this. Thanks for shar'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1), 'connieuitsu@gmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1)::text, 'connieuitsu@gmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1)::text AND ar.email = 'connieuitsu@gmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1), 'danielduordoe@yahoo.co.uk'
WHERE (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1)::text, 'danielduordoe@yahoo.co.uk', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1)::text AND ar.email = 'danielduordoe@yahoo.co.uk'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1), 'confi1@hotmail.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1)::text, 'confi1@hotmail.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1)::text AND ar.email = 'confi1@hotmail.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );
INSERT INTO content_feed_likes (post_id, email)
SELECT (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1), 'gnpedgar@yahoo.com'
WHERE (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1) IS NOT NULL
ON CONFLICT (post_id, email) DO NOTHING;
INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1)::text, 'gnpedgar@yahoo.com', '❤️', 'post', now()
WHERE (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_reactions ar
    WHERE ar.item_id = (SELECT id FROM content_feed_posts WHERE title = '🎯 Weekly Practice Focus - 25th May 2026' AND created_at = '2026-05-25 07:12:00+00' LIMIT 1)::text AND ar.email = 'gnpedgar@yahoo.com'
      AND ar.emoji = '❤️' AND ar.event_type = 'post'
  );

COMMIT;