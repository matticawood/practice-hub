-- Note Recognition: add a "range" facet (which band of the stave a game covers).
--
-- Three bands, chosen in the setup wizard, each its own comparable leaderboard
-- variant (like clef / accidentals / key already are):
--   'stave'  — notes on the five lines and four spaces only
--   'ledger' — only notes outside the stave (ledger lines, up to 3 each way + the
--              note just past the third ledger line), above and below the clef
--   'full'   — stave + ledger together
--
-- Legacy scores predate the band choice: the old game only ever showed in-stave
-- notes, so backfill every existing row to 'stave' — that keeps historical scores
-- on the (closest-matching) stave board rather than stranding them on a NULL board.
ALTER TABLE note_game_scores ADD COLUMN IF NOT EXISTS range text;
UPDATE note_game_scores SET range = 'stave' WHERE range IS NULL;

-- Rebuild the best-per-player-per-variant view to include the new facet, so a
-- stave board and a ledger board never collapse into one another. Mirrors the
-- existing DISTINCT ON keying (see 20260628_note_game_leaderboard_view.sql).
-- DROP first: CREATE OR REPLACE cannot insert a column mid-list (range sits
-- before attempts), so replace the view outright.
DROP VIEW IF EXISTS note_game_leaderboard;
CREATE VIEW note_game_leaderboard
  WITH (security_invoker = true) AS
SELECT DISTINCT ON (lower(email), clef, accidentals, key_signature, range)
  email, name, score, clef, accidentals, key_signature, range, attempts, created_at
FROM note_game_scores
ORDER BY lower(email), clef, accidentals, key_signature, range, score DESC, created_at DESC;

GRANT SELECT ON note_game_leaderboard TO anon, authenticated;
