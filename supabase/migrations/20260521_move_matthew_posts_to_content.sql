-- Move Matthew's instructional posts from community_posts → content_feed_posts.
-- "Scales Help" and "An Improvisation - For Fun" stay in community (example posts).

-- ── 1. Delete from community_posts ───────────────────────────────────────────
DELETE FROM community_posts
  WHERE email = 'matthew@matthewcawood.com'
    AND title IN (
      'Staccato vs a shorter note and a rest',
      'Live Practice Clinic - 11th May - Topic Poll',
      'Live Practice Clinic: Building Finger Control, Balance & Coordination',
      'Starting to Improvise',
      'Tension When Playing Accents'
    );

-- ── 2. Insert into content_feed_posts ────────────────────────────────────────
INSERT INTO content_feed_posts (type, title, body, media, published_at, created_at) VALUES (
  'post',
  'Staccato vs a shorter note and a rest',
  'Hey Matt, if "staccato" just means to play the note short and detached then why doesn''t music just use a shorter note with a rest after it? Wouldn''t that be the same thing?',
  '[]'::jsonb,
  '2026-04-21 16:06:00+00',
  '2026-04-21 16:06:00+00'
);

INSERT INTO content_feed_posts (type, title, body, media, published_at, created_at) VALUES (
  'post',
  'Live Practice Clinic - 11th May - Topic Poll',
  'What topic would you most like this week''s Live Practice Clinic to focus on? Making your playing sound more musical / Understanding chord progressions & harmony / Improvisation and playing more freely at the piano / How to approach learning a new piece / Developing finger control, balance & coordination',
  '[]'::jsonb,
  '2026-05-08 13:28:00+00',
  '2026-05-08 13:28:00+00'
);

INSERT INTO content_feed_posts (type, title, body, media, published_at, created_at) VALUES (
  'post',
  'Live Practice Clinic: Building Finger Control, Balance & Coordination',
  '',
  '[{"type": "mux", "playback_id": "5nhlJ7WMZp1UFT46Ah4B6l8Qkz5znQo1iy9Y7xEwiQg"}]'::jsonb,
  '2026-05-11 20:17:00+00',
  '2026-05-11 20:17:00+00'
);

INSERT INTO content_feed_posts (type, title, body, media, published_at, created_at) VALUES (
  'post',
  'Starting to Improvise',
  'Learning improvisation is about setting constraints and becoming really good within that domain before adding something new. So try these steps out if you want to have a go at starting to (or improving) improvise. For each element that you add, stress test it and play with it for a while before adding something new.',
  '[{"type": "mux", "playback_id": "mtWGMwAYB8ImIRYoTHEOqPUWlReLJRWiDPjQjDNAaMs"}]'::jsonb,
  '2026-05-13 15:46:00+00',
  '2026-05-13 15:46:00+00'
);

INSERT INTO content_feed_posts (type, title, body, media, published_at, created_at) VALUES (
  'post',
  'Tension When Playing Accents',
  '',
  '[{"type": "mux", "playback_id": "00p5lznrHN5RuJmpQQmuM02xyvITBhRTyGpZ7kHVl6QRI"}]'::jsonb,
  '2026-05-18 19:26:00+00',
  '2026-05-18 19:26:00+00'
);
