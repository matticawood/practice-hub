-- Note Recognition leaderboard: best score per player, per board variant.
--
-- Fixes a truncation bug. The client used to read note_game_scores directly,
-- fetching the global top-500 rows BY SCORE and deduping to one-per-player in the
-- browser. Once a handful of players logged hundreds of games each, all 500 of
-- those rows belonged to them, so every other player (whose best fell below the
-- 500th score) was never fetched and silently vanished from the board, even
-- though they legitimately ranked inside the Top 10.
--
-- This view pre-collapses to one row per (player, clef, accidentals, key_signature)
-- = that player's best for the board. The client filters it by variant and takes
-- the top 10, with no possibility of truncation. security_invoker = true so the
-- existing public SELECT policy on note_game_scores still governs access.
CREATE OR REPLACE VIEW note_game_leaderboard
  WITH (security_invoker = true) AS
SELECT DISTINCT ON (lower(email), clef, accidentals, key_signature)
  email, name, score, clef, accidentals, key_signature, attempts, created_at
FROM note_game_scores
ORDER BY lower(email), clef, accidentals, key_signature, score DESC, created_at DESC;

GRANT SELECT ON note_game_leaderboard TO anon, authenticated;
