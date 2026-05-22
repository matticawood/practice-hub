-- ================================================================
-- Add missing Circle comment/post videos recovered from media library
-- Generated 2026-05-22
--
-- All 8 videos downloaded from assets-v2.circle.so and uploaded to Mux.
-- ================================================================

-- ── 1. Add media column to community_post_comments ──────────────
ALTER TABLE community_post_comments
  ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]';


-- ── 2. Update existing community_post_comments with video media ──

-- Matthew's feedback video on Sick Doll Attempt (cecile.mov)
-- "Pedalling, hopefully I answered that in the video..."
UPDATE community_post_comments
SET media = '[{"type":"mux","playback_id":"WoNER028eqPlzvZPMTlijfL69gp6ykD00z4eUO01OqfHVw"}]'::jsonb
WHERE email = 'matthew@matthewcawood.com'
  AND created_at = '2026-04-25 15:30:00+00'
  AND post_id = (SELECT id FROM community_posts
                 WHERE title = 'Sick Doll Attempt'
                   AND created_at = '2026-04-25 13:38:00+00' LIMIT 1);

-- Cécile's revised Sick Doll playing (20260428_SickDoll.mp4)
-- "@Matthew Cawood Does that sound better?"
UPDATE community_post_comments
SET media = '[{"type":"mux","playback_id":"yilh42icUepHIr202aKZpS9mhddjAK900nliYY4xHvZlc"}]'::jsonb
WHERE email = 'cecile.dautriat@gmail.com'
  AND created_at = '2026-04-28 12:30:00+00'
  AND post_id = (SELECT id FROM community_posts
                 WHERE title = 'Sick Doll Attempt'
                   AND created_at = '2026-04-25 13:38:00+00' LIMIT 1);

-- Cécile's revised Canon in Am (20260502_CanonInAm.mp4)
-- 'I think that sounds less "rushed"'
UPDATE community_post_comments
SET media = '[{"type":"mux","playback_id":"U101Hfltt4BRPTnnfuRtB8LABsKkMMNebS02PC3ybP005w"}]'::jsonb
WHERE email = 'cecile.dautriat@gmail.com'
  AND created_at = '2026-05-02 18:25:00+00'
  AND post_id = (SELECT id FROM community_posts
                 WHERE title = 'Canon in Am'
                   AND created_at = '2026-04-29 23:15:00+00' LIMIT 1);

-- Tulika's Wellerman playing (Wellerman.mp4)
-- "@Matthew Cawood Hi Matt. Thanks for your quick response..."
UPDATE community_post_comments
SET media = '[{"type":"mux","playback_id":"qBJBxWIMo4iIRyL1FqF9B4BlXmsxObD9DwxGre8Ov5I"}]'::jsonb
WHERE email = 'tdalavoy@gmail.com'
  AND created_at = '2026-05-17 07:40:00+00'
  AND post_id = (SELECT id FROM community_posts
                 WHERE title = 'Wellerman song'
                   AND created_at = '2026-05-16 15:43:00+00' LIMIT 1);

-- Matthew's video response to Rob (rob response.mov)
-- "Hey Rob! To Summarise: ..."
UPDATE community_post_comments
SET media = '[{"type":"mux","playback_id":"wjZiaIrsU7vqHY9ejXAplbECVSrgSaw1Y18q75InYhM"}]'::jsonb
WHERE email = 'matthew@matthewcawood.com'
  AND created_at = '2026-05-12 15:47:00+00'
  AND post_id = (SELECT id FROM community_posts
                 WHERE title = 'Hand Independence - left hand arpeggios'
                   AND created_at = '2026-05-12 11:59:00+00' LIMIT 1);


-- ── 3. Update weekly_focus_comments with Cécile's scales video ──

-- Cécile's staccato scales comment on "Make your scales sound musical"
-- (20260429_Scales.mp4) — "…you'll guess I never play staccato scales…"
UPDATE weekly_focus_comments
SET media = '[{"type":"mux","playback_id":"o4XNYiKwt02BQSRMwEaDCYOHNPeh1qQu8vUxyi02fGR2s"}]'::jsonb
WHERE email = 'cecile.dautriat@gmail.com'
  AND created_at = '2026-04-29 22:33:00+00'
  AND focus_id = (SELECT id FROM weekly_focus
                  WHERE headline = 'Make your scales sound musical' LIMIT 1);


-- ── 4. Insert new comment: Cécile's May 21 revised Impertinence ──
-- (20260521_Impertinence.mp4) - posted after migration window
INSERT INTO community_post_comments
  (post_id, email, name, content, media, parent_comment_id, reply_to_name, created_at)
VALUES (
  (SELECT id FROM community_posts
   WHERE title = 'Impertinence (Stolen French word)'
     AND created_at = '2026-05-19 22:16:00+00' LIMIT 1),
  'cecile.dautriat@gmail.com',
  'Cécile Dautriat',
  '@Matthew Cawood This one sounds better, I think. The last few bars may still be a little too loud. I apologize to the court. ☺️',
  '[{"type":"mux","playback_id":"jyYzQy02nzPbn1wj4LvAv6djnBw1300KgVpBp9W0200YHIw"}]'::jsonb,
  (SELECT id FROM community_post_comments
   WHERE content LIKE 'The French should probably not leave their words laying around%'
     AND created_at = '2026-05-20 13:22:00+00' LIMIT 1),
  'Matthew Cawood',
  '2026-05-21 18:05:00+00'
);


-- ── 5. Insert missing post: Denzel's "Ultra beginner improvisation technique" ──
-- (VID_20260506123949.mp4) — in Practice Log space, not in original export
INSERT INTO community_posts
  (email, name, type, title, content, media, created_at)
VALUES (
  'denzelriwai1@gmail.com',
  'Denzel R Riwai',
  'progress',
  'Ultra beginner improvisation technique',
  'Just wanted to post something, Ive been teaching myself for two months so nothing I do is gonna be Matthew level, but I was inspired by Michael.

This is a bit of a hack.. Improvising with just the black keys uses way less thought then a mix, you can play through mistakes, test small motifs out and build off of them. Here''s a small attempt of mine. As you can see this is not a display of skill, but for any ultra Beginners like me… sometimes you just want to PLAY. But you can only play a few things. This is my shortcut for it. I''ve burnt a lot of time with these small sessions. Practicing with dynamics etc. but this is an unstructured informal strategy. A far more studious route would be to use a scale and chords ( I have a similar recording of C sharp minor scale improv I wasn''t as confident sharing ).

I really just wanted to post something.. I''m nervous and don''t have a lot of impressive skills yet. But Norman, Michael and everyone else are too inspiring no?',
  '[{"type":"mux","playback_id":"uN1FiIxw9TR900CC5H5nfdPvFYaW8bq2BVjDHFcKPKjo"}]'::jsonb,
  '2026-05-06 12:00:00+00'
);

-- Comments on Denzel's "Ultra beginner improvisation technique" post
INSERT INTO community_post_comments (post_id, email, name, content, created_at) VALUES (
  (SELECT id FROM community_posts
   WHERE title = 'Ultra beginner improvisation technique'
     AND email = 'denzelriwai1@gmail.com' LIMIT 1),
  'matthew@matthewcawood.com',
  'Matthew Cawood',
  'Nice work! You''re right…the black keys are a great way of improvising without having the extra barrier of worrying about which keys are a part/not part of the scale.

They make a pentatonic scale which is what guitarists use all the time for guitar solos and it''s also used a lot for stereotypical asian sounding music. If you want to add an extra layer on top you could add an "A" to the scale. That makes an F# major blues scale (F# G# A A# C# D#) which can sound cool.

You''re doing great! Your sense of rhythm and ability to just play like this is more impressive than you think. Those are skills you get from doing this kind of improvisation stuff and is a massive part of being a well rounded musician that many people struggle with. I''m glad you felt encouraged to post something!',
  '2026-05-06 15:00:00+00'
);

INSERT INTO community_post_comments (post_id, email, name, content, created_at) VALUES (
  (SELECT id FROM community_posts
   WHERE title = 'Ultra beginner improvisation technique'
     AND email = 'denzelriwai1@gmail.com' LIMIT 1),
  'cecile.dautriat@gmail.com',
  'Cécile Dautriat',
  'Thanks for sharing, it never crossed my mind to try that out…',
  '2026-05-06 16:00:00+00'
);

INSERT INTO community_post_comments (post_id, email, name, content, parent_comment_id, reply_to_name, created_at) VALUES (
  (SELECT id FROM community_posts
   WHERE title = 'Ultra beginner improvisation technique'
     AND email = 'denzelriwai1@gmail.com' LIMIT 1),
  'denzelriwai1@gmail.com',
  'Denzel R Riwai',
  '@Matthew Cawood Thank you for the feedback Matt, do you have a favourite scale? Or do you jump between them depending on emotion.',
  (SELECT id FROM community_post_comments
   WHERE content LIKE 'Nice work! You''re right…the black keys are a great way%'
     AND created_at = '2026-05-06 15:00:00+00' LIMIT 1),
  'Matthew Cawood',
  '2026-05-07 09:00:00+00'
);
