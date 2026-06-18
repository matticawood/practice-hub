-- ============================================================
-- Circle delta migration 2026-05-28 (Weekly Focus May 25 intro fix)
--
-- focus.html renders "This week, try this:" automatically as a label
-- above the steps list. The intro shouldn't repeat it. Trimming.
-- ============================================================

UPDATE weekly_focus
SET intro = 'A large part of why mistakes keep returning is that many players unknowingly practise the mistake itself over and over again. However, improvement usually comes from isolating and reorganising the exact movements or thought processes that caused the issue in the first place, rather than unintentionally repeating the mistake again.'
WHERE headline = 'Learn to practise mistakes without repeating them';
