-- ============================================================
-- Circle delta migration 2026-05-28 (Weekly Practice Focus - 25th May 2026)
--
-- The "🎯 Weekly Practice Focus - 25th May 2026" post was earlier inserted
-- into content_feed_posts via the admin_posts_move migration, but its proper
-- home is the dedicated weekly_focus table (headline/intro/steps/closing
-- structured schema), which is what community.html renders as a "Weekly
-- Practice Focus" card.
--
-- This migration:
--   1. INSERTs the row into weekly_focus with the parsed structured fields
--   2. DELETEs the duplicate from content_feed_posts so the feed doesn't
--      show two copies
-- ============================================================

BEGIN;

INSERT INTO weekly_focus (headline, intro, steps, closing, published_at, created_at)
SELECT
  'Learn to practise mistakes without repeating them',
  'A large part of why mistakes keep returning is that many players unknowingly practise the mistake itself over and over again. However, improvement usually comes from isolating and reorganising the exact movements or thought processes that caused the issue in the first place, rather than unintentionally repeating the mistake again.

This week, try this: Find a place in your music where mistakes happen regularly (or a pattern that you keep getting wrong - a scale, arpeggio etc.).',
  '[
    {
      "text": "Instead of immediately replaying the whole section, stop and identify exactly what went wrong. Ask yourself:",
      "bullets": [
        "Was it a fingering problem?",
        "A rhythm problem?",
        "A jump?",
        "Tension?",
        "Not knowing the notes securely enough?",
        "Not knowing what the music is trying to do?"
      ]
    },
    {
      "text": "Then reduce the difficulty temporarily by:",
      "bullets": [
        "slowing it down",
        "isolating the mistake itself",
        "blocking chords",
        "simplifying the rhythm",
        "practising just the movement between two notes"
      ]
    },
    {
      "text": "Then, repeat the corrected version several times before returning to the full passage. Identifying what caused the mistake first will help you work out the best way of isolating and fixing the mistake.",
      "bullets": []
    }
  ]'::jsonb,
  'By doing this, you may notice that difficult passages begin to feel far more reliable once you stop treating mistakes as random accidents and start treating them as specific problems that can be reorganised and solved.',
  '2026-05-25 07:12:00+00',
  '2026-05-25 07:12:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM weekly_focus
  WHERE headline = 'Learn to practise mistakes without repeating them'
);

-- Remove the duplicate from content_feed_posts so it doesn't render twice
DELETE FROM content_feed_posts
WHERE title = '🎯 Weekly Practice Focus - 25th May 2026'
  AND created_at = '2026-05-25 07:12:00+00';

COMMIT;
