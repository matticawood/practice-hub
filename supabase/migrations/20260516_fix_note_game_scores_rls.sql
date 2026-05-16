-- Fix note_game_scores RLS: add insert/select policies for authenticated users.
-- The original migration only granted anon role, blocking signed-in users from saving scores.

CREATE POLICY IF NOT EXISTS "note_game_scores_select_auth" ON note_game_scores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "note_game_scores_insert_auth" ON note_game_scores
  FOR INSERT TO authenticated WITH CHECK (true);
