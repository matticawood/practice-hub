-- Note Recognition Game — scores table
CREATE TABLE IF NOT EXISTS note_game_scores (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL,
  name        text,                   -- display name (from allowed_emails.name)
  score       integer     NOT NULL,
  clef        text        NOT NULL,   -- 'treble' | 'bass' | 'mixed'
  accidentals boolean     NOT NULL,
  attempts    integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Add name column if the table already exists without it
ALTER TABLE note_game_scores ADD COLUMN IF NOT EXISTS name text;

-- Index for fast leaderboard queries
CREATE INDEX IF NOT EXISTS note_game_scores_score_idx ON note_game_scores (score DESC);

-- RLS: anon can read all scores and insert their own
ALTER TABLE note_game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "note_game_scores_select" ON note_game_scores
  FOR SELECT TO anon USING (true);

CREATE POLICY "note_game_scores_insert" ON note_game_scores
  FOR INSERT TO anon WITH CHECK (true);
