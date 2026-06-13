-- Chord Ear Training game scores leaderboard (audio chord identification).
-- Mirrors chord_game_scores, but instead of a clef it records the answer type
-- (quality vs exact) and the chord set, since the prompt is heard, not read.
CREATE TABLE IF NOT EXISTS ear_game_scores (
  id            bigint generated always as identity primary key,
  created_at    timestamptz default now(),
  email         text not null,
  name          text,
  score         int  not null,
  answer_type   text not null,            -- 'quality' | 'exact'  (wizard tier 1)
  chord_set     text not null,            -- 'major_minor' | 'triads' | 'sevenths' | 'extensions'  (tier 2)
  key_signature text,                     -- null when scope = 'any'  (tier 3)
  attempts      int  not null
);

-- Leaderboard queries: top scores within an answer_type + chord_set
CREATE INDEX IF NOT EXISTS ear_game_scores_leaderboard_idx
  ON ear_game_scores (answer_type, chord_set, score desc);

ALTER TABLE ear_game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ear scores"
  ON ear_game_scores FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert ear scores"
  ON ear_game_scores FOR INSERT
  TO authenticated
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
