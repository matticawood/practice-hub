-- Fix Daniel's two goals that saved with today's date instead of his chosen end-of-month date.
-- Root cause: autocomplete selection triggered renderPieceGoals() which reset the date input
-- to todayStr() (2026-05-07 = the day he created them). He had intended 2026-05-31.

UPDATE piece_goals
SET target_date = '2026-05-31'
WHERE email = 'danielduordoe@yahoo.co.uk'
  AND id IN (20, 22)
  AND target_date = '2026-05-07';

-- Verify
SELECT id, piece_label, target_date
FROM piece_goals
WHERE email = 'danielduordoe@yahoo.co.uk'
ORDER BY id;
