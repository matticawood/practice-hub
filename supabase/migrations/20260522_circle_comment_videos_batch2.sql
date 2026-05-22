-- ================================================================
-- Batch 2: Add missing Circle comment videos recovered from media library
-- Generated 2026-05-22
--
-- 9 of 10 videos handled here.
-- Skipped: Nonstop_Cam_3_4.mov (Mux ID: Fpo7ZMfebPA1mLaBb01h91hLGS461r78OJ3NEyWqMY004)
--   → Lives on Connie's Circle practice-log post "Monday 4 May 2026 · 1h 15m"
--   → That space is not yet imported into the Practice Room DB.
-- ================================================================


-- ── 1. UPDATE existing community_post_comments ──────────────────

-- Matthew's hand-coordination video on "Hand coordination practice routine" (IMG_6608.MOV)
-- "Hopefully this will give you some steps you can progress through."
UPDATE community_post_comments
SET media = '[{"type":"mux","playback_id":"EFX5WcQCUf9BlXm63x00eiYvjaLz8XLBT7rwR02S8P4CM"}]'::jsonb
WHERE email = 'matthew@matthewcawood.com'
  AND created_at = '2026-04-22 17:33:00+00';


-- Matthew's video on Connie's hand-position question post (IMG_6626.mov)
-- "I seemingly can't answer a question without waffling!…"
-- Post: title = '' (Connie's unnamed post about hand positions), created_at 2026-04-26 08:34
UPDATE community_post_comments
SET media = '[{"type":"mux","playback_id":"BMnmgh00XQU4WJnEC00t9Y5601rfcjfSXEFxNhwPh6Gj4o"}]'::jsonb
WHERE email = 'matthew@matthewcawood.com'
  AND created_at = '2026-04-26 12:07:00+00';


-- Matthew's wrist/finger demo on "Clementi sonatina" (Nonstop_Cam_3_2.mov)
-- "@Tulika Dalavoy Hey Tulika, hopefully this helps with this specific piece…"
UPDATE community_post_comments
SET media = '[{"type":"mux","playback_id":"7PsGO49MUp0101LQCWZc5X49DagXJi2q02iSAo02KZFo1os"}]'::jsonb
WHERE email = 'matthew@matthewcawood.com'
  AND created_at = '2026-05-02 08:46:00+00';


-- Matthew's indirect-pedalling explanation on "Wellerman song" (Tulika_Pedal.mp4)
-- "Just to also cover you mentioning it sounding too disconnected…"
UPDATE community_post_comments
SET media = '[{"type":"mux","playback_id":"fV7T64xVQSzVVWM7PymsIr02gK702HlKYVNyRS68gFMCM"}]'::jsonb
WHERE email = 'matthew@matthewcawood.com'
  AND created_at = '2026-05-16 18:08:00+00';


-- Matthew's Bach response #1 on "Just some improvising" (IMG_3758.MOV)
-- "This one is a Bach piece and I couldn't remember what I was supposed to play…"
UPDATE community_post_comments
SET media = '[{"type":"mux","playback_id":"7MKTwNIs02msl6qm8Y51bcbt1N6TXxa9QzmxT6l4fxU00"}]'::jsonb
WHERE email = 'matthew@matthewcawood.com'
  AND created_at = '2026-05-16 12:54:00+00';


-- Matthew's response #2 on "Just some improvising" (IMG_3713.MOV)
-- "This one I got the first note wrong! 😂 But even with that…"
UPDATE community_post_comments
SET media = '[{"type":"mux","playback_id":"v02UcAw4XpqO003YNcIpMOEQJdqrf1nFH3pILAm9LFQF8"}]'::jsonb
WHERE email = 'matthew@matthewcawood.com'
  AND created_at = '2026-05-16 12:57:00+00';


-- ── 2. UPDATE weekly_focus_comments ─────────────────────────────

-- Matthew's chord-balancing demo on "Learn to control which note is heard" (Nonstop_Cam_3_3.mov)
-- "@Daniel Duordoe Hey Daniel, hopefully this helps!"
UPDATE weekly_focus_comments
SET media = '[{"type":"mux","playback_id":"YRTTSCgLj5Z0001PkP8hmUsQ00G015LzeTX1Q9wcbuLd5Lw"}]'::jsonb
WHERE email = 'matthew@matthewcawood.com'
  AND created_at = '2026-05-04 10:44:00+00';


-- ── 3. INSERT missing community_post_comments ────────────────────

-- Matthew's scales advice video on "Scales Help" (advice_scales.mov)
-- Video-only comment (no text) — Cécile's "BONJOUR!!" joke references hearing French in this video
INSERT INTO community_post_comments
  (post_id, email, name, content, media, created_at)
VALUES (
  (SELECT id FROM community_posts
   WHERE title = 'Scales Help'
     AND created_at = '2026-04-21 15:58:00+00' LIMIT 1),
  'matthew@matthewcawood.com',
  'Matthew Cawood',
  '',
  '[{"type":"mux","playback_id":"drgaFeuqpzDHZHl02kTBknTZfrGvWVAKsyzUyuPVdYoc"}]'::jsonb,
  '2026-04-21 16:30:00+00'
);


-- Matthew's C blues major scale fingering demo on "Blues scale" (Nonstop_Cam_3.mov)
-- Video-only reply after Luca clarified "Blues major scale, starting in C"
-- Luca then replied "Thanks Matt, perfect 💪🏻" confirming the video was received
INSERT INTO community_post_comments
  (post_id, email, name, content, media, parent_comment_id, reply_to_name, created_at)
VALUES (
  (SELECT id FROM community_posts
   WHERE title = 'Blues scale'
     AND created_at = '2026-04-26 17:10:00+00' LIMIT 1),
  'matthew@matthewcawood.com',
  'Matthew Cawood',
  '',
  '[{"type":"mux","playback_id":"qLMYi02DKUqwwwWL3qwVFYK4UXxSInwEE61Lbf9kDR9c"}]'::jsonb,
  (SELECT id FROM community_post_comments
   WHERE content = 'Hi Matt, Blues major scale, starting in C'
     AND created_at = '2026-04-26 21:56:00+00' LIMIT 1),
  'Luca Chiarella',
  '2026-04-26 22:20:00+00'
);
