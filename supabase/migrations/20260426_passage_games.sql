-- Passage game results
CREATE TABLE IF NOT EXISTS passage_games (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text        NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  session_date      date        NOT NULL DEFAULT CURRENT_DATE,
  passage_label     text        NOT NULL,
  piece_label       text,
  level             integer     NOT NULL DEFAULT 1,
  attempts          integer     NOT NULL DEFAULT 0,
  correct_count     integer     NOT NULL DEFAULT 0,
  incorrect_count   integer     NOT NULL DEFAULT 0,
  simplify_triggers integer     NOT NULL DEFAULT 0,
  outcome           text        CHECK (outcome IN ('cleared','leveled_up','abandoned')),
  duration_seconds  integer
);

ALTER TABLE passage_games ENABLE ROW LEVEL SECURITY;

-- Students can insert and read their own records
CREATE POLICY "Students insert own games"
  ON passage_games FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = email);

CREATE POLICY "Students read own games"
  ON passage_games FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Admin read-all
CREATE POLICY "Admin read all games"
  ON passage_games FOR SELECT
  USING (auth.jwt() ->> 'email' = 'matthew@matthewcawood.com');
