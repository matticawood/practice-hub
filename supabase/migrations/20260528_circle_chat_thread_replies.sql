-- ============================================================
-- Circle delta migration 2026-05-28 (ALL chat thread replies)
-- Apply AFTER 20260528_circle_chat_delta.sql so the 4 in-window
-- parent messages exist (the historic parents from the May 21
-- migration are already present).
-- ============================================================

BEGIN;

INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'matthew@matthewcawood.com', 'Matthew Cawood', 'I reckon the best way to do this for the practice log would be to add the Piano Adventures as a piece and then in the notes put what you specifically worked on?',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'michaelpage05@hotmail.co.uk' AND content LIKE 'I have a question. Is anyone working through a work book lik%' LIMIT 1)::text,
    'toName', 'Michael Page',
    'toPreview', 'I have a question. Is anyone working through a work book like piano adventures? If they are how are they recording it in'
  )
),
  '2026-05-07 00:00:00+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'michaelpage05@hotmail.co.uk' AND content LIKE 'I have a question. Is anyone working through a work book lik%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'matthew@matthewcawood.com'
      AND content = 'I reckon the best way to do this for the practice log would be to add the Piano Adventures as a piece and then in the notes put what you specifically worked on?'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'michaelpage05@hotmail.co.uk', 'Michael Page', 'The thought I had before reading this @Matthew Cawood was to enter each pace in the book at I go an add some time under theory for reading time.',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'michaelpage05@hotmail.co.uk' AND content LIKE 'I have a question. Is anyone working through a work book lik%' LIMIT 1)::text,
    'toName', 'Michael Page',
    'toPreview', 'I have a question. Is anyone working through a work book like piano adventures? If they are how are they recording it in'
  )
),
  '2026-05-07 00:00:01+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'michaelpage05@hotmail.co.uk' AND content LIKE 'I have a question. Is anyone working through a work book lik%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'michaelpage05@hotmail.co.uk'
      AND content = 'The thought I had before reading this @Matthew Cawood was to enter each pace in the book at I go an add some time under theory for reading time.'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'matthew@matthewcawood.com', 'Matthew Cawood', 'I''ve solved both your problems for you. Now on the practice log you can add Books and enter pieces/pages from the book. In the pieces stats you can click on the book to see all of the things you''ve practiced from that book. There''s a books tab in the library as well. I''ve fixed the button for the weekly hours too! I also changed the colour of the blank days on the heat map for the calendar 😀 (edited)',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'michaelpage05@hotmail.co.uk' AND content LIKE 'I have a question. Is anyone working through a work book lik%' LIMIT 1)::text,
    'toName', 'Michael Page',
    'toPreview', 'I have a question. Is anyone working through a work book like piano adventures? If they are how are they recording it in'
  )
),
  '2026-05-07 00:00:02+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'michaelpage05@hotmail.co.uk' AND content LIKE 'I have a question. Is anyone working through a work book lik%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'matthew@matthewcawood.com'
      AND content = 'I''ve solved both your problems for you. Now on the practice log you can add Books and enter pieces/pages from the book. In the pieces stats you can click on the book to see all of the things you''ve practiced from that book. There''s a books tab in the library as well. I''ve fixed the button for the weekly hours too! I also changed the colour of the blank days on the heat map for the calendar 😀 (edited)'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'michaelpage05@hotmail.co.uk', 'Michael Page', 'You are on fire. Thank you @Matthew CawoodAnd seriously, if you would ever like any help, I am a web developer by day.',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'michaelpage05@hotmail.co.uk' AND content LIKE 'I have a question. Is anyone working through a work book lik%' LIMIT 1)::text,
    'toName', 'Michael Page',
    'toPreview', 'I have a question. Is anyone working through a work book like piano adventures? If they are how are they recording it in'
  )
),
  '2026-05-07 00:00:03+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'michaelpage05@hotmail.co.uk' AND content LIKE 'I have a question. Is anyone working through a work book lik%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'michaelpage05@hotmail.co.uk'
      AND content = 'You are on fire. Thank you @Matthew CawoodAnd seriously, if you would ever like any help, I am a web developer by day.'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hey Tulika, I can maybe offer 1 or 2 suggestions to check. Firstly, examiners can usually tell the intention of the dynamics even if they don''t appear too obvious, so I wouldn''t worry too much about it for that particular purpose because they can usually distinguish between the audio quality and playing issues. However, when you use "direct inject" there could be a few things, firstly the sound could be being "normalised" when you export the audio. Do you use any particular software to record your audio? Sometimes the file dynamics get squashed when you export it. Another thing you could try is to use MIDI rather than AUDIO. Sometimes electric pianos don''t have enough variants in the samples that they have for different dynamics. However using MIDI and a piano sound on your computer means that you have 127 different volumes (velocities) and you will be able to hear a wider range of dynamics. Although, if you aren''t sure what MIDI is, this would require some software like garageband, logic pro, cubase, abelton etc.. and a piano sound on that software.(edited)',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'This is an issue I frequently have while recording videos fo%' LIMIT 1)::text,
    'toName', 'Tulika Dalavoy',
    'toPreview', 'This is an issue I frequently have while recording videos for exams. The dynamics is not very clear in the video recordi'
  )
),
  '2026-05-07 00:00:04+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'This is an issue I frequently have while recording videos fo%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'matthew@matthewcawood.com'
      AND content = 'Hey Tulika, I can maybe offer 1 or 2 suggestions to check. Firstly, examiners can usually tell the intention of the dynamics even if they don''t appear too obvious, so I wouldn''t worry too much about it for that particular purpose because they can usually distinguish between the audio quality and playing issues. However, when you use "direct inject" there could be a few things, firstly the sound could be being "normalised" when you export the audio. Do you use any particular software to record your audio? Sometimes the file dynamics get squashed when you export it. Another thing you could try is to use MIDI rather than AUDIO. Sometimes electric pianos don''t have enough variants in the samples that they have for different dynamics. However using MIDI and a piano sound on your computer means that you have 127 different volumes (velocities) and you will be able to hear a wider range of dynamics. Although, if you aren''t sure what MIDI is, this would require some software like garageband, logic pro, cubase, abelton etc.. and a piano sound on that software.(edited)'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'michaelpage05@hotmail.co.uk', 'Michael Page', '@Matthew Cawood this feels like a video tutorial. 🙂',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'This is an issue I frequently have while recording videos fo%' LIMIT 1)::text,
    'toName', 'Tulika Dalavoy',
    'toPreview', 'This is an issue I frequently have while recording videos for exams. The dynamics is not very clear in the video recordi'
  )
),
  '2026-05-07 00:00:05+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'This is an issue I frequently have while recording videos fo%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'michaelpage05@hotmail.co.uk'
      AND content = '@Matthew Cawood this feels like a video tutorial. 🙂'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'tdalavoy@gmail.com', 'Tulika Dalavoy', 'Hi Matt. Thanks for your suggestions. I don''t use any software. I directly record with my iPad camera using a cable for the audio. I tried recording with my phone as well, but still have the same issue. I have never used MIDI before. Not sure if Trinity allows it.',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'This is an issue I frequently have while recording videos fo%' LIMIT 1)::text,
    'toName', 'Tulika Dalavoy',
    'toPreview', 'This is an issue I frequently have while recording videos for exams. The dynamics is not very clear in the video recordi'
  )
),
  '2026-05-07 00:00:06+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'This is an issue I frequently have while recording videos fo%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'tdalavoy@gmail.com'
      AND content = 'Hi Matt. Thanks for your suggestions. I don''t use any software. I directly record with my iPad camera using a cable for the audio. I tried recording with my phone as well, but still have the same issue. I have never used MIDI before. Not sure if Trinity allows it.'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', '@Tulika Dalavoy It''s very difficult to recreate the touch of a piano on an electric keyboard. What keyboard are you using, if you don''t mind me asking?',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'This is an issue I frequently have while recording videos fo%' LIMIT 1)::text,
    'toName', 'Tulika Dalavoy',
    'toPreview', 'This is an issue I frequently have while recording videos for exams. The dynamics is not very clear in the video recordi'
  )
),
  '2026-05-07 00:00:07+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'This is an issue I frequently have while recording videos fo%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'danielduordoe@yahoo.co.uk'
      AND content = '@Tulika Dalavoy It''s very difficult to recreate the touch of a piano on an electric keyboard. What keyboard are you using, if you don''t mind me asking?'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'tdalavoy@gmail.com', 'Tulika Dalavoy', '@Daniel Duordoe I am using Yamaha P225 digital piano',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'This is an issue I frequently have while recording videos fo%' LIMIT 1)::text,
    'toName', 'Tulika Dalavoy',
    'toPreview', 'This is an issue I frequently have while recording videos for exams. The dynamics is not very clear in the video recordi'
  )
),
  '2026-05-07 00:00:08+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'This is an issue I frequently have while recording videos fo%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'tdalavoy@gmail.com'
      AND content = '@Daniel Duordoe I am using Yamaha P225 digital piano'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'matthew@matthewcawood.com', 'Matthew Cawood', 'that''s a tough one...via the more traditional route; I think you become early intermediate after maybe 5-6 pieces completed along with all the other things you need to know that come along with that. So understanding the key and dynamics and all of those things. Then at early intermediate it becomes more about targeting problems then it is about learning the fundamentals (mostly). via the non-traditional route though, it''s largely knowing the same things (keys, chords, being able to navigate the piano), but applied in a different way.',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'bobbymi003@gmail.com' AND content LIKE 'question for early to late intermediates , at what point did%' LIMIT 1)::text,
    'toName', 'BOBBY',
    'toPreview', 'question for early to late intermediates , at what point did you realise that you were not beginners anymore? 1 reply 2 '
  )
),
  '2026-05-14 00:00:00+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'bobbymi003@gmail.com' AND content LIKE 'question for early to late intermediates , at what point did%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'matthew@matthewcawood.com'
      AND content = 'that''s a tough one...via the more traditional route; I think you become early intermediate after maybe 5-6 pieces completed along with all the other things you need to know that come along with that. So understanding the key and dynamics and all of those things. Then at early intermediate it becomes more about targeting problems then it is about learning the fundamentals (mostly). via the non-traditional route though, it''s largely knowing the same things (keys, chords, being able to navigate the piano), but applied in a different way.'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'connieuitsu@gmail.com', 'Connie Witzoe', 'I only get that time on my days off. I''m off Sunday, Monday, Tuesday so I get a lot of practice in when kids are in school/nursery. on days I''m working I rarely get more than 30 min or so in.',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'danielduordoe@yahoo.co.uk' AND content LIKE 'How are people finding two hours to practise on a weekday?!%' LIMIT 1)::text,
    'toName', 'Daniel Duordoe',
    'toPreview', 'How are people finding two hours to practise on a weekday?! I am very jealous. Lol. 4 replies 1 week ago'
  )
),
  '2026-05-21 00:00:00+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'danielduordoe@yahoo.co.uk' AND content LIKE 'How are people finding two hours to practise on a weekday?!%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'connieuitsu@gmail.com'
      AND content = 'I only get that time on my days off. I''m off Sunday, Monday, Tuesday so I get a lot of practice in when kids are in school/nursery. on days I''m working I rarely get more than 30 min or so in.'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'I see. Nice one!',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'danielduordoe@yahoo.co.uk' AND content LIKE 'How are people finding two hours to practise on a weekday?!%' LIMIT 1)::text,
    'toName', 'Daniel Duordoe',
    'toPreview', 'How are people finding two hours to practise on a weekday?! I am very jealous. Lol. 4 replies 1 week ago'
  )
),
  '2026-05-21 00:00:01+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'danielduordoe@yahoo.co.uk' AND content LIKE 'How are people finding two hours to practise on a weekday?!%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'danielduordoe@yahoo.co.uk'
      AND content = 'I see. Nice one!'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'denzelriwai1@gmail.com', 'Denzel R Riwai', 'Anything passive. Like doomscrolling, or drinking a coffee. Or using my phone. I sit in FRONT of the piano. It''s impossible not to get practice In when your main area for relaxing is the piano room. A lot of practice doesn’t begin with: “I SHALL NOW COMMENCE A THREE-HOUR SESSION.” It begins with: presses one key, then another, then suddenly 40 minutes passed.(edited)',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'danielduordoe@yahoo.co.uk' AND content LIKE 'How are people finding two hours to practise on a weekday?!%' LIMIT 1)::text,
    'toName', 'Daniel Duordoe',
    'toPreview', 'How are people finding two hours to practise on a weekday?! I am very jealous. Lol. 4 replies 1 week ago'
  )
),
  '2026-05-21 00:00:02+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'danielduordoe@yahoo.co.uk' AND content LIKE 'How are people finding two hours to practise on a weekday?!%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'denzelriwai1@gmail.com'
      AND content = 'Anything passive. Like doomscrolling, or drinking a coffee. Or using my phone. I sit in FRONT of the piano. It''s impossible not to get practice In when your main area for relaxing is the piano room. A lot of practice doesn’t begin with: “I SHALL NOW COMMENCE A THREE-HOUR SESSION.” It begins with: presses one key, then another, then suddenly 40 minutes passed.(edited)'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Hehe. I agree.',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'danielduordoe@yahoo.co.uk' AND content LIKE 'How are people finding two hours to practise on a weekday?!%' LIMIT 1)::text,
    'toName', 'Daniel Duordoe',
    'toPreview', 'How are people finding two hours to practise on a weekday?! I am very jealous. Lol. 4 replies 1 week ago'
  )
),
  '2026-05-21 00:00:03+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'danielduordoe@yahoo.co.uk' AND content LIKE 'How are people finding two hours to practise on a weekday?!%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'danielduordoe@yahoo.co.uk'
      AND content = 'Hehe. I agree.'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'connieuitsu@gmail.com', 'Connie Witzoe', 'I get what you mean, I feel like that sometimes, but I found that learning a simple piece (one you can learn in a couple of days but is still enjoyable and slightly challenging) made me really motivated again. The last piece I learned I found a lot of fun to learn cause it was easy to memorize and now I''m just playing it over and over to polish it and finally add the dynamics and phrasing i want to it to make it sound nice. Find a really motivating piece that you focus on, that makes you excited to sit down and practice, but still go through the pieces you''ve learned etc to get that practice in too Dunno if it will work for you, but it did for me',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'What can I do to make my practice sessions less mechanical a%' LIMIT 1)::text,
    'toName', 'Tulika Dalavoy',
    'toPreview', 'What can I do to make my practice sessions less mechanical and more enjoyable?Most of the time I am addressing technical'
  )
),
  '2026-05-22 00:00:00+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'What can I do to make my practice sessions less mechanical a%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'connieuitsu@gmail.com'
      AND content = 'I get what you mean, I feel like that sometimes, but I found that learning a simple piece (one you can learn in a couple of days but is still enjoyable and slightly challenging) made me really motivated again. The last piece I learned I found a lot of fun to learn cause it was easy to memorize and now I''m just playing it over and over to polish it and finally add the dynamics and phrasing i want to it to make it sound nice. Find a really motivating piece that you focus on, that makes you excited to sit down and practice, but still go through the pieces you''ve learned etc to get that practice in too Dunno if it will work for you, but it did for me'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'bobbymi003@gmail.com', 'BOBBY', 'I haven''t got to your stage yet, however when i feel uninspired or a little piano fatigued I try to listen to songs by my fav pianists and songs that I like or try finding new songs. That usually motivates me to keep going. Plus I look at people playing and realise that this is really a long journey full of ups and downs and each one of them had to work super duper hard to get to that skill level , and they probably passed through these phases aswell.',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'What can I do to make my practice sessions less mechanical a%' LIMIT 1)::text,
    'toName', 'Tulika Dalavoy',
    'toPreview', 'What can I do to make my practice sessions less mechanical and more enjoyable?Most of the time I am addressing technical'
  )
),
  '2026-05-22 00:00:01+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'What can I do to make my practice sessions less mechanical a%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'bobbymi003@gmail.com'
      AND content = 'I haven''t got to your stage yet, however when i feel uninspired or a little piano fatigued I try to listen to songs by my fav pianists and songs that I like or try finding new songs. That usually motivates me to keep going. Plus I look at people playing and realise that this is really a long journey full of ups and downs and each one of them had to work super duper hard to get to that skill level , and they probably passed through these phases aswell.'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Well for me, I only play pieces I enjoy. If I don''t like a piece, I just don''t bother. Another thing you could do is to leave some time to just enjoy yourself at the piano. Sometimes it''s nice to just goof around on the piano a bit.',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'What can I do to make my practice sessions less mechanical a%' LIMIT 1)::text,
    'toName', 'Tulika Dalavoy',
    'toPreview', 'What can I do to make my practice sessions less mechanical and more enjoyable?Most of the time I am addressing technical'
  )
),
  '2026-05-22 00:00:02+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'What can I do to make my practice sessions less mechanical a%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'danielduordoe@yahoo.co.uk'
      AND content = 'Well for me, I only play pieces I enjoy. If I don''t like a piece, I just don''t bother. Another thing you could do is to leave some time to just enjoy yourself at the piano. Sometimes it''s nice to just goof around on the piano a bit.'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'matthew@matthewcawood.com', 'Matthew Cawood', 'I agree with everyone. I think it''s definitely important to sit and just enjoy playing from time to time with no agenda. It''s also important to remember that it''s ok to take time (particularly if you are tired) and enjoy the feeling of the music. When we are trying to improve it can feel like the things that you notice need fixing immediately and it become a game of playing things in a certain way, but it''s also valuable to take the easiest parts and play it nice and slowly just to enjoy the sound. By doing that you are training your musicality and also giving your brain a bit of a break from the more intense technical practice',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'What can I do to make my practice sessions less mechanical a%' LIMIT 1)::text,
    'toName', 'Tulika Dalavoy',
    'toPreview', 'What can I do to make my practice sessions less mechanical and more enjoyable?Most of the time I am addressing technical'
  )
),
  '2026-05-22 00:00:03+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'What can I do to make my practice sessions less mechanical a%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'matthew@matthewcawood.com'
      AND content = 'I agree with everyone. I think it''s definitely important to sit and just enjoy playing from time to time with no agenda. It''s also important to remember that it''s ok to take time (particularly if you are tired) and enjoy the feeling of the music. When we are trying to improve it can feel like the things that you notice need fixing immediately and it become a game of playing things in a certain way, but it''s also valuable to take the easiest parts and play it nice and slowly just to enjoy the sound. By doing that you are training your musicality and also giving your brain a bit of a break from the more intense technical practice'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'tdalavoy@gmail.com', 'Tulika Dalavoy', 'Great suggestions. Unfortunately most of the songs I like are also challenging to learn and the find the challenge to be motivating and exciting. Its only after I have been through the challenge of learning the piece and am just practicing I feel the fatigue. Improvisation is something I do occasionally when I have some free time left after practicing the pieces. Looks like I need to do more of it. I like the idea of focusing on the easier parts for musical expression. Will definitely try it.',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'What can I do to make my practice sessions less mechanical a%' LIMIT 1)::text,
    'toName', 'Tulika Dalavoy',
    'toPreview', 'What can I do to make my practice sessions less mechanical and more enjoyable?Most of the time I am addressing technical'
  )
),
  '2026-05-22 00:00:04+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'tdalavoy@gmail.com' AND content LIKE 'What can I do to make my practice sessions less mechanical a%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'tdalavoy@gmail.com'
      AND content = 'Great suggestions. Unfortunately most of the songs I like are also challenging to learn and the find the challenge to be motivating and exciting. Its only after I have been through the challenge of learning the piece and am just practicing I feel the fatigue. Improvisation is something I do occasionally when I have some free time left after practicing the pieces. Looks like I need to do more of it. I like the idea of focusing on the easier parts for musical expression. Will definitely try it.'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Bitonality is in fashion right now!',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'connieuitsu@gmail.com' AND content LIKE 'I just tried playing along to the (original) "Lollipop" song%' LIMIT 1)::text,
    'toName', 'Connie Witzoe',
    'toPreview', 'I just tried playing along to the (original) "Lollipop" song by The Chordettes and it''s like a quarter note "off key" so'
  )
),
  '2026-05-26 00:00:00+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'connieuitsu@gmail.com' AND content LIKE 'I just tried playing along to the (original) "Lollipop" song%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'matthew@matthewcawood.com'
      AND content = 'Bitonality is in fashion right now!'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'tdalavoy@gmail.com', 'Tulika Dalavoy', 'You''re right. Playing without headphones sounds different. But in my case I feel like I am able to play better and with more confidence without the discomfort of the headphones. I actually like the sound better without the headphones.',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'confi1@hotmail.com' AND content LIKE 'Auditory mystery....I play with headphones on most of the ti%' LIMIT 1)::text,
    'toName', 'Kelly Williams',
    'toPreview', 'Auditory mystery....I play with headphones on most of the time and whenever I play without it sounds completely differen'
  )
),
  '2026-05-27 00:00:00+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'confi1@hotmail.com' AND content LIKE 'Auditory mystery....I play with headphones on most of the ti%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'tdalavoy@gmail.com'
      AND content = 'You''re right. Playing without headphones sounds different. But in my case I feel like I am able to play better and with more confidence without the discomfort of the headphones. I actually like the sound better without the headphones.'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'davidwhamilton79@gmail.com', 'David Hamilton', 'Hi Sarah. I using the Faber books too but I originally started with Alfred so now doing a hybrid of both. Ive got Skoove which sounds similar to the app you describe but I only use it for fun when my brain has had enough of the books!(edited)',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'lambsarahlouise@gmail.com' AND content LIKE 'David, I''m a beginner too. I''m using the Faber adult adventu%' LIMIT 1)::text,
    'toName', 'Sarah Lamb',
    'toPreview', 'David, I''m a beginner too. I''m using the Faber adult adventure books, as well as an app/website (not sure I can name it)'
  )
),
  '2026-04-28 00:00:00+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'lambsarahlouise@gmail.com' AND content LIKE 'David, I''m a beginner too. I''m using the Faber adult adventu%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'davidwhamilton79@gmail.com'
      AND content = 'Hi Sarah. I using the Faber books too but I originally started with Alfred so now doing a hybrid of both. Ive got Skoove which sounds similar to the app you describe but I only use it for fun when my brain has had enough of the books!(edited)'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'lambsarahlouise@gmail.com', 'Sarah Lamb', 'I''ve got the Alfred ones too, but the Faber seem a bit more straightforward for me to follow!',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'lambsarahlouise@gmail.com' AND content LIKE 'David, I''m a beginner too. I''m using the Faber adult adventu%' LIMIT 1)::text,
    'toName', 'Sarah Lamb',
    'toPreview', 'David, I''m a beginner too. I''m using the Faber adult adventure books, as well as an app/website (not sure I can name it)'
  )
),
  '2026-04-28 00:00:01+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'lambsarahlouise@gmail.com' AND content LIKE 'David, I''m a beginner too. I''m using the Faber adult adventu%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'lambsarahlouise@gmail.com'
      AND content = 'I''ve got the Alfred ones too, but the Faber seem a bit more straightforward for me to follow!'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'davidwhamilton79@gmail.com', 'David Hamilton', 'Yeah there are some pretty big differences between them. I find the Faber progression a bit easier. The Alfred books do seem to progress faster. All the pieces in Alfred seem more difficult than their Faber equivalents.',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'lambsarahlouise@gmail.com' AND content LIKE 'David, I''m a beginner too. I''m using the Faber adult adventu%' LIMIT 1)::text,
    'toName', 'Sarah Lamb',
    'toPreview', 'David, I''m a beginner too. I''m using the Faber adult adventure books, as well as an app/website (not sure I can name it)'
  )
),
  '2026-04-28 00:00:02+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'lambsarahlouise@gmail.com' AND content LIKE 'David, I''m a beginner too. I''m using the Faber adult adventu%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'davidwhamilton79@gmail.com'
      AND content = 'Yeah there are some pretty big differences between them. I find the Faber progression a bit easier. The Alfred books do seem to progress faster. All the pieces in Alfred seem more difficult than their Faber equivalents.'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'jifupt@gmail.com', 'Joao Carvalho', 'Hello Sarah, I''ve been doing the exact same thing. I''ve been using Piano Marvel alongside the Faber adult book 1. Feels like a nice combination to me personally, but I just started in March :)',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'lambsarahlouise@gmail.com' AND content LIKE 'David, I''m a beginner too. I''m using the Faber adult adventu%' LIMIT 1)::text,
    'toName', 'Sarah Lamb',
    'toPreview', 'David, I''m a beginner too. I''m using the Faber adult adventure books, as well as an app/website (not sure I can name it)'
  )
),
  '2026-04-28 00:00:03+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'lambsarahlouise@gmail.com' AND content LIKE 'David, I''m a beginner too. I''m using the Faber adult adventu%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'jifupt@gmail.com'
      AND content = 'Hello Sarah, I''ve been doing the exact same thing. I''ve been using Piano Marvel alongside the Faber adult book 1. Feels like a nice combination to me personally, but I just started in March :)'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'davidwhamilton79@gmail.com', 'David Hamilton', 'Welcome! There are tons of great YouTube piano channels but Matts is definitely one of the best.',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'jifupt@gmail.com' AND content LIKE 'Hello everyone! I''m not sure what to expect from this commun%' LIMIT 1)::text,
    'toName', 'Joao Carvalho',
    'toPreview', 'Hello everyone! I''m not sure what to expect from this community, but saw there was a money-back option so I figured I ha'
  )
),
  '2026-04-28 00:00:04+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'jifupt@gmail.com' AND content LIKE 'Hello everyone! I''m not sure what to expect from this commun%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'davidwhamilton79@gmail.com'
      AND content = 'Welcome! There are tons of great YouTube piano channels but Matts is definitely one of the best.'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'jamie.hollis@hotmail.com', 'Jamie Hollis', 'Hey Joao, Presume he''s using Line out to a mixer and splitting the output to his pc and in-ear monitor, so we don''t hear the piano sound through his microphone',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'jifupt@gmail.com' AND content LIKE '@Matthew Cawood was watching a video of yours and something%' LIMIT 1)::text,
    'toName', 'Joao Carvalho',
    'toPreview', '@Matthew Cawood was watching a video of yours and something got me curious: why do you have the volume bar of the piano '
  )
),
  '2026-04-28 00:00:05+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'jifupt@gmail.com' AND content LIKE '@Matthew Cawood was watching a video of yours and something%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'jamie.hollis@hotmail.com'
      AND content = 'Hey Joao, Presume he''s using Line out to a mixer and splitting the output to his pc and in-ear monitor, so we don''t hear the piano sound through his microphone'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Exactly',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'jifupt@gmail.com' AND content LIKE '@Matthew Cawood was watching a video of yours and something%' LIMIT 1)::text,
    'toName', 'Joao Carvalho',
    'toPreview', '@Matthew Cawood was watching a video of yours and something got me curious: why do you have the volume bar of the piano '
  )
),
  '2026-04-28 00:00:06+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'jifupt@gmail.com' AND content LIKE '@Matthew Cawood was watching a video of yours and something%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'matthew@matthewcawood.com'
      AND content = 'Exactly'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'jifupt@gmail.com', 'Joao Carvalho', 'Ahhh, got it! That makes more sense now! Thanks for the reply :)',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'matthew@matthewcawood.com' AND content LIKE '@Joao Carvalho I do! I use a plugin called Keyscape for a be%' LIMIT 1)::text,
    'toName', 'Matthew Cawood',
    'toPreview', '@Joao Carvalho I do! I use a plugin called Keyscape for a better piano sound and the sound comes through my in-ear monit'
  )
),
  '2026-04-28 00:00:07+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'matthew@matthewcawood.com' AND content LIKE '@Joao Carvalho I do! I use a plugin called Keyscape for a be%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'jifupt@gmail.com'
      AND content = 'Ahhh, got it! That makes more sense now! Thanks for the reply :)'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'matthew@matthewcawood.com', 'Matthew Cawood', 'I also started on the recorder in primary school! It seems like it is a rite of passage 😂',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'lambsarahlouise@gmail.com' AND content LIKE 'Does anyone else have any other musical experience? I starte%' LIMIT 1)::text,
    'toName', 'Sarah Lamb',
    'toPreview', 'Does anyone else have any other musical experience? I started with the recorder as most children seem to do in primary s'
  )
),
  '2026-04-28 00:00:08+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'lambsarahlouise@gmail.com' AND content LIKE 'Does anyone else have any other musical experience? I starte%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'matthew@matthewcawood.com'
      AND content = 'I also started on the recorder in primary school! It seems like it is a rite of passage 😂'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'davidwhamilton79@gmail.com', 'David Hamilton', 'Ive played guitar since I was a child. Primarily classical but also folk, blues and the occasional bit of rock. I haven''t learned how to read music until picking up the piano which has been quite the learning curve. As has that bass clef!',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'lambsarahlouise@gmail.com' AND content LIKE 'Does anyone else have any other musical experience? I starte%' LIMIT 1)::text,
    'toName', 'Sarah Lamb',
    'toPreview', 'Does anyone else have any other musical experience? I started with the recorder as most children seem to do in primary s'
  )
),
  '2026-04-28 00:00:09+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'lambsarahlouise@gmail.com' AND content LIKE 'Does anyone else have any other musical experience? I starte%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'davidwhamilton79@gmail.com'
      AND content = 'Ive played guitar since I was a child. Primarily classical but also folk, blues and the occasional bit of rock. I haven''t learned how to read music until picking up the piano which has been quite the learning curve. As has that bass clef!'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'robert.m.ayres@outlook.com', 'Rob Ayres', 'Played various Brass instruments through primary school into secondary school but mainly Trumpet and find myself also struggling a bit with Bass Clef! Had always imagined it was read the same way as Treble Clef! Little did i know…',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'lambsarahlouise@gmail.com' AND content LIKE 'Does anyone else have any other musical experience? I starte%' LIMIT 1)::text,
    'toName', 'Sarah Lamb',
    'toPreview', 'Does anyone else have any other musical experience? I started with the recorder as most children seem to do in primary s'
  )
),
  '2026-04-28 00:00:10+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'lambsarahlouise@gmail.com' AND content LIKE 'Does anyone else have any other musical experience? I starte%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'robert.m.ayres@outlook.com'
      AND content = 'Played various Brass instruments through primary school into secondary school but mainly Trumpet and find myself also struggling a bit with Bass Clef! Had always imagined it was read the same way as Treble Clef! Little did i know…'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'lucaskinzo@hotmail.com', 'Luca Chiarella', 'Drummer here for 30 years ( but defo not pro😀). I picked up the piano in May 3 years ago.',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'lambsarahlouise@gmail.com' AND content LIKE 'Does anyone else have any other musical experience? I starte%' LIMIT 1)::text,
    'toName', 'Sarah Lamb',
    'toPreview', 'Does anyone else have any other musical experience? I started with the recorder as most children seem to do in primary s'
  )
),
  '2026-04-28 00:00:11+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'lambsarahlouise@gmail.com' AND content LIKE 'Does anyone else have any other musical experience? I starte%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'lucaskinzo@hotmail.com'
      AND content = 'Drummer here for 30 years ( but defo not pro😀). I picked up the piano in May 3 years ago.'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Welcome Mike! Happy to have you here',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'mflander4@gmail.com' AND content LIKE 'Hi All! Been playing since last June from Minnesota, USA! Ex%' LIMIT 1)::text,
    'toName', 'Mike Flander',
    'toPreview', 'Hi All! Been playing since last June from Minnesota, USA! Excited for this community. I hope it can help keep up the mot'
  )
),
  '2026-04-28 00:00:12+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'mflander4@gmail.com' AND content LIKE 'Hi All! Been playing since last June from Minnesota, USA! Ex%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'matthew@matthewcawood.com'
      AND content = 'Welcome Mike! Happy to have you here'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'matthew@matthewcawood.com', 'Matthew Cawood', 'That''s a good trade - the bass is cool, but the piano is clearly cooler 😂 Hopefully we can help you improve all of those skills 😀',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'm.gepert@gmail.com' AND content LIKE 'Mateusz from Poland here, for 18 years heavy notes dropper o%' LIMIT 1)::text,
    'toName', 'Mateusz Gepert',
    'toPreview', 'Mateusz from Poland here, for 18 years heavy notes dropper on bass guitar switched to piano year ago 😂 so you can consid'
  )
),
  '2026-04-28 00:00:13+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'm.gepert@gmail.com' AND content LIKE 'Mateusz from Poland here, for 18 years heavy notes dropper o%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'matthew@matthewcawood.com'
      AND content = 'That''s a good trade - the bass is cool, but the piano is clearly cooler 😂 Hopefully we can help you improve all of those skills 😀'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Hi Jane, welcome! That''s great, it''s nice to mix things up and doing grade 2 on the recorder is interesting!',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'janesimpson50@hotmail.com' AND content LIKE 'Hello Matthew and everyone, I''m Jane from London, almost a t%' LIMIT 1)::text,
    'toName', 'Jane Simpson',
    'toPreview', 'Hello Matthew and everyone, I''m Jane from London, almost a total beginner but practising hard to get better. I''m using a'
  )
),
  '2026-04-28 00:00:14+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'janesimpson50@hotmail.com' AND content LIKE 'Hello Matthew and everyone, I''m Jane from London, almost a t%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'matthew@matthewcawood.com'
      AND content = 'Hi Jane, welcome! That''s great, it''s nice to mix things up and doing grade 2 on the recorder is interesting!'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'davidwhamilton79@gmail.com', 'David Hamilton', 'Hi Jane. Im also using both Faber and Alfred. I like the mix of the two approaches. Faber has better supplementary books though id say. Popular and Classics etc',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'janesimpson50@hotmail.com' AND content LIKE 'Hello Matthew and everyone, I''m Jane from London, almost a t%' LIMIT 1)::text,
    'toName', 'Jane Simpson',
    'toPreview', 'Hello Matthew and everyone, I''m Jane from London, almost a total beginner but practising hard to get better. I''m using a'
  )
),
  '2026-04-28 00:00:15+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'janesimpson50@hotmail.com' AND content LIKE 'Hello Matthew and everyone, I''m Jane from London, almost a t%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'davidwhamilton79@gmail.com'
      AND content = 'Hi Jane. Im also using both Faber and Alfred. I like the mix of the two approaches. Faber has better supplementary books though id say. Popular and Classics etc'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'shaun.purbrick@gmail.com', 'Shaun Purbrick', 'Hi, yes you can access them in the Community Posts section.',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'robert.m.ayres@outlook.com' AND content LIKE 'Hi, are the live sessions recorded at all?%' LIMIT 1)::text,
    'toName', 'Rob Ayres',
    'toPreview', 'Hi, are the live sessions recorded at all?'
  )
),
  '2026-05-23 00:00:00+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'robert.m.ayres@outlook.com' AND content LIKE 'Hi, are the live sessions recorded at all?%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'shaun.purbrick@gmail.com'
      AND content = 'Hi, yes you can access them in the Community Posts section.'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'matthew@matthewcawood.com', 'Matthew Cawood', 'They are indeed, I will post it in the Community Posts like Shaun said..you can also find it on the events & Replays in the past events.',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'robert.m.ayres@outlook.com' AND content LIKE 'Hi, are the live sessions recorded at all?%' LIMIT 1)::text,
    'toName', 'Rob Ayres',
    'toPreview', 'Hi, are the live sessions recorded at all?'
  )
),
  '2026-05-24 00:00:00+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'robert.m.ayres@outlook.com' AND content LIKE 'Hi, are the live sessions recorded at all?%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'matthew@matthewcawood.com'
      AND content = 'They are indeed, I will post it in the Community Posts like Shaun said..you can also find it on the events & Replays in the past events.'
  );
INSERT INTO community_messages (chat_id, email, name, content, media, created_at)
SELECT 'group', 'robert.m.ayres@outlook.com', 'Rob Ayres', 'Thanks both!',
  jsonb_build_array(
  jsonb_build_object(
    'type', 'reply',
    'toId', (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'robert.m.ayres@outlook.com' AND content LIKE 'Hi, are the live sessions recorded at all?%' LIMIT 1)::text,
    'toName', 'Rob Ayres',
    'toPreview', 'Hi, are the live sessions recorded at all?'
  )
),
  '2026-05-26 00:00:01+01'
WHERE (SELECT id FROM community_messages WHERE chat_id = 'group' AND email = 'robert.m.ayres@outlook.com' AND content LIKE 'Hi, are the live sessions recorded at all?%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_messages WHERE chat_id = 'group'
      AND email = 'robert.m.ayres@outlook.com'
      AND content = 'Thanks both!'
  );

COMMIT;