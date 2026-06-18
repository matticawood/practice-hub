-- ============================================================
-- Circle delta migration 2026-05-28 (chat / The Lounge)
--
-- Five top-level messages in the delta window:
--   1. Daniel Duordoe — Beethoven Moonlight / Adele observation
--   2. Tulika Dalavoy — practice sessions less mechanical
--   3. Rob Ayres      — are live sessions recorded
--   4. Connie Witzoe  — Lollipop song quarter-note offset
--   5. Kelly Williams — auditory mystery / headphones
--
-- Daniel's message has no visible date divider above it in chat view (he's
-- the oldest visible delta-window message). Assigned 2026-05-21 20:30 BST
-- as a best guess — adjust if the actual date differs.
--
-- KNOWN GAP: thread replies (5 + 3 + 1 + 1 = 10 messages across the 4
-- threaded top-level messages) are NOT included here. The thread-panel
-- scrape couldn't locate a stable selector; they need a follow-up scrape
-- against the thread view or manual capture.
-- ============================================================

BEGIN;

INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe',
'Is it just me or do the opening chords of the first movement of Beethoven''s Moonlight sonata sound very much like an Adele song? 🤔',
'[]'::jsonb, '2026-05-21 20:30:00+01'
WHERE NOT EXISTS (
  SELECT 1 FROM community_messages WHERE chat_id = 'group'
    AND email = 'danielduordoe@yahoo.co.uk'
    AND content LIKE 'Is it just me or do the opening chords of the first movement of Beethoven%'
);

INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'tdalavoy@gmail.com', 'Tulika Dalavoy',
'What can I do to make my practice sessions less mechanical and more enjoyable? Most of the time I am addressing technical challenges and the musicality and musical expression takes a backseat. The pieces that I have completed, I practice them once or twice a week so that I don''t forget them. But I feel like when I am practicing the pieces, I am not able to emotionally connect with it in the same way everytime. To some extent it also depends on how tired or overwhelmed I am. So the practice feels very mechanical like I am just going through a routine. Does anyone else experience this?',
'[]'::jsonb, '2026-05-22 15:02:00+01'
WHERE NOT EXISTS (
  SELECT 1 FROM community_messages WHERE chat_id = 'group'
    AND email = 'tdalavoy@gmail.com'
    AND content LIKE 'What can I do to make my practice sessions less mechanical%'
);

INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'robert.m.ayres@outlook.com', 'Rob Ayres',
'Hi, are the live sessions recorded at all?',
'[]'::jsonb, '2026-05-23 22:20:00+01'
WHERE NOT EXISTS (
  SELECT 1 FROM community_messages WHERE chat_id = 'group'
    AND email = 'robert.m.ayres@outlook.com'
    AND content = 'Hi, are the live sessions recorded at all?'
);

INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'connieuitsu@gmail.com', 'Connie Witzoe',
'I just tried playing along to the (original) "Lollipop" song by The Chordettes and it''s like a quarter note "off key" so it''s awful to try to play while the song it playing! 😅

Challenge you guys to try 🙈',
'[]'::jsonb, '2026-05-26 08:36:00+01'
WHERE NOT EXISTS (
  SELECT 1 FROM community_messages WHERE chat_id = 'group'
    AND email = 'connieuitsu@gmail.com'
    AND content LIKE 'I just tried playing along to the (original) "Lollipop"%'
);

INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'confi1@hotmail.com', 'Kelly Williams',
'Auditory mystery....I play with headphones on most of the time and whenever I play without it sounds completely different and I lose the ability to play 😂',
'[]'::jsonb, '2026-05-27 11:19:00+01'
WHERE NOT EXISTS (
  SELECT 1 FROM community_messages WHERE chat_id = 'group'
    AND email = 'confi1@hotmail.com'
    AND content LIKE 'Auditory mystery....I play with headphones%'
);

COMMIT;
