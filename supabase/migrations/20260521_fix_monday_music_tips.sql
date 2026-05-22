-- Fix Monday Music Tips blog posts
-- The renderer expects bullets in media as {type:"bullets",items:[...]}
-- The original import stored plain text in body and ignored the URL.

DELETE FROM content_feed_posts WHERE type = 'blog' AND title = 'Monday Music Tips';

INSERT INTO content_feed_posts (type, title, body, url, media, published_at, created_at) VALUES (
  'blog', 'Why Difficult Music Isn''t Always the Best Teacher', '', 'https://www.matthewcawood.com/monday-music-tips/why-difficult-music-isnt-always-the-best-teacher', '[{"type": "bullets", "items": ["Why difficult pieces often create the illusion of progress", "The language-learning concept that explains how musicians actually learn", "How choosing music at the right level accelerates improvement"]}]'::jsonb, '2026-04-16 01:52:00+00', '2026-04-16 01:52:00+00'
);
INSERT INTO content_feed_posts (type, title, body, url, media, published_at, created_at) VALUES (
  'blog', 'Is It Better to Play for 30 Minutes…or Practice for 5?', '', 'https://www.matthewcawood.com/monday-music-tips/is-it-better-to-play-for-30-minutesor-practice-for-5', '[{"type": "bullets", "items": ["Why \u201cplaying more\u201d isn\u2019t the same as improving faster", "The simple maths that shows how much faster targeted practice works", "How to turn a short practice burst into real progress"]}]'::jsonb, '2026-04-16 01:58:00+00', '2026-04-16 01:58:00+00'
);
INSERT INTO content_feed_posts (type, title, body, url, media, published_at, created_at) VALUES (
  'blog', 'Why Technique Isn’t What You Think It Is', '', 'https://www.matthewcawood.com/monday-music-tips/why-technique-isnt-what-you-think-it-is', '[{"type": "bullets", "items": ["Why most \u201ccorrect technique\u201d advice is holding you back", "The problem with common technique rules", "What to focus on instead to feel comfortable at the piano"]}]'::jsonb, '2026-04-16 02:03:00+00', '2026-04-16 02:03:00+00'
);
INSERT INTO content_feed_posts (type, title, body, url, media, published_at, created_at) VALUES (
  'blog', 'Why You Can’t Think and Play at the Same Time', '', 'https://www.matthewcawood.com/monday-music-tips/why-you-cant-think-and-play-at-the-same-time', '[{"type": "bullets", "items": ["Why your playing can fall apart even when you think you should be able to play it", "The \u201cfocus battery\u201d that limits how much you can control at once", "How to reduce mental overload and play with more freedom"]}]'::jsonb, '2026-04-16 02:07:00+00', '2026-04-16 02:07:00+00'
);
INSERT INTO content_feed_posts (type, title, body, url, media, published_at, created_at) VALUES (
  'blog', 'Why Some Notes Matter More Than Others', '', 'https://www.matthewcawood.com/monday-music-tips/why-some-notes-matter-more-than-others', '[{"type": "bullets", "items": ["Why playing every note correctly can still sound wrong", "What actually makes a piece sound musical", "Why some notes should stand out and others shouldn\u2019t"]}]'::jsonb, '2026-04-16 02:11:00+00', '2026-04-16 02:11:00+00'
);
INSERT INTO content_feed_posts (type, title, body, url, media, published_at, created_at) VALUES (
  'blog', 'Why Fixing Mistakes Doesn’t Ruin Your Fluency', '', 'https://www.matthewcawood.com/monday-music-tips/why-fixing-mistakes-doesnt-ruin-your-fluency', '[{"type": "bullets", "items": ["Why stopping doesn\u2019t actually break your fluency", "The real reason playing through mistakes slows progress", "What actually makes a piece feel reliable under your hands"]}]'::jsonb, '2026-04-16 02:15:00+00', '2026-04-16 02:15:00+00'
);
INSERT INTO content_feed_posts (type, title, body, url, media, published_at, created_at) VALUES (
  'blog', 'Why Most Pianists Don’t Know What to Practice', '', 'https://www.matthewcawood.com/monday-music-tips/why-most-pianists-dont-know-what-to-practice', '[{"type": "bullets", "items": ["Why sitting down to practice often feels unclear", "Why \u201cpracticing more\u201d doesn\u2019t work", "How to work out what to improve and play"]}]'::jsonb, '2026-04-20 17:45:00+00', '2026-04-20 17:45:00+00'
);
INSERT INTO content_feed_posts (type, title, body, url, media, published_at, created_at) VALUES (
  'blog', 'Why It Feels Like Nothing Is Improving (Even When It Is)', '', 'https://www.matthewcawood.com/monday-music-tips/why-it-feels-like-nothing-is-improving-even-when-it-is', '[{"type": "bullets", "items": ["Why it feels like you\u2019re starting from scratch with every new piece", "The hidden improvements most pianists don\u2019t notice", "How to tell if you\u2019re actually getting better"]}]'::jsonb, '2026-04-27 11:49:00+00', '2026-04-27 11:49:00+00'
);
INSERT INTO content_feed_posts (type, title, body, url, media, published_at, created_at) VALUES (
  'blog', 'Why Does the End of a Piece Always Fall Apart?', '', 'https://www.matthewcawood.com/monday-music-tips/why-does-the-end-of-a-piece-always-fall-apart', '[{"type": "bullets", "items": ["Why the beginning always feels easier than the end", "The hidden reason the end feels unstable", "A simple way to make the whole piece feel reliable"]}]'::jsonb, '2026-05-04 10:09:00+00', '2026-05-04 10:09:00+00'
);
INSERT INTO content_feed_posts (type, title, body, url, media, published_at, created_at) VALUES (
  'blog', 'Why Quiet Playing Is So Difficult', '', 'https://www.matthewcawood.com/monday-music-tips/why-quiet-playing-is-so-difficult', '[{"type": "bullets", "items": ["Why trying to \u201cbarely press the key\u201d makes soft playing harder", "The mistake many players make with dynamics", "How to make quiet playing feel natural instead of tense"]}]'::jsonb, '2026-05-11 09:37:00+00', '2026-05-11 09:37:00+00'
);
INSERT INTO content_feed_posts (type, title, body, url, media, published_at, created_at) VALUES (
  'blog', 'Why One Mistake Can Ruin an Entire Performance', '', 'https://www.matthewcawood.com/monday-music-tips/why-one-mistake-can-ruin-an-entire-performance', '[{"type": "bullets", "items": ["Why one mistake can suddenly derail everything", "The danger of relying on muscle memory", "How to make performances feel secure"]}]'::jsonb, '2026-05-18 10:36:00+00', '2026-05-18 10:36:00+00'
);
