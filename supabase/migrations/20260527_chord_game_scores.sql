-- Chord Recognition game scores leaderboard
CREATE TABLE IF NOT EXISTS chord_game_scores (
  id            bigint generated always as identity primary key,
  created_at    timestamptz default now(),
  email         text not null,
  name          text,
  score         int not null,
  clef          text not null,
  tier          int not null,
  mode          text not null,
  key_signature text,
  attempts      int not null
);

-- Index for leaderboard queries (score desc, by tier + mode)
CREATE INDEX IF NOT EXISTS chord_game_scores_leaderboard_idx
  ON chord_game_scores (tier, mode, score desc);

-- RLS: anyone authenticated can insert their own scores; anyone can read
ALTER TABLE chord_game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chord scores"
  ON chord_game_scores FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert chord scores"
  ON chord_game_scores FOR INSERT
  TO authenticated
  WITH CHECK (true);
