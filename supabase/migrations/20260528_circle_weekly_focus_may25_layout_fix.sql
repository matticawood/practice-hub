-- ============================================================
-- Circle delta migration 2026-05-28 (Weekly Focus May 25 layout fix)
--
-- The earlier insert had the steps collapsed into 3 entries (with "Find a
-- place..." and "Instead of immediately replaying..." stuffed into one
-- step and "Identifying what caused the mistake first..." stuffed into
-- the closing). The actual Circle layout has 5 numbered steps:
--   1. Find a place in your music where mistakes happen regularly...
--   2. Instead of immediately replaying the whole section, stop...
--   3. Ask yourself: [6 bullets]
--   4. Then reduce the difficulty temporarily by: [5 bullets]
--   5. Then, repeat the corrected version several times...
-- Intro ends at "This week, try this:" (step 1 starts immediately after).
-- Closing is the "Identifying what caused..." paragraph.
-- ============================================================

UPDATE weekly_focus
SET
  intro = 'A large part of why mistakes keep returning is that many players unknowingly practise the mistake itself over and over again. However, improvement usually comes from isolating and reorganising the exact movements or thought processes that caused the issue in the first place, rather than unintentionally repeating the mistake again.

This week, try this:',
  steps = '[
    {
      "text": "Find a place in your music where mistakes happen regularly (or a pattern that you keep getting wrong - a scale, arpeggio etc.).",
      "bullets": []
    },
    {
      "text": "Instead of immediately replaying the whole section, stop and identify exactly what went wrong.",
      "bullets": []
    },
    {
      "text": "Ask yourself:",
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
      "text": "Then, repeat the corrected version several times before returning to the full passage.",
      "bullets": []
    }
  ]'::jsonb,
  closing = 'Identifying what caused the mistake first will help you work out the best way of isolating and fixing the mistake. By doing this, you may notice that difficult passages begin to feel far more reliable once you stop treating mistakes as random accidents and start treating them as specific problems that can be reorganised and solved.'
WHERE headline = 'Learn to practise mistakes without repeating them';
