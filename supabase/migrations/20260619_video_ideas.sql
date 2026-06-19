-- video_ideas — backlog for the YouTube Idea Studio (owner-only authoring tool).
-- One row per idea, built around the vehicle-first framework: a fascinating musical
-- "vehicle" -> the human question/mystery it hides -> titles -> investigation outline
-- -> the human payoff. Owner reads/writes directly with their authenticated session.

CREATE TABLE IF NOT EXISTS video_ideas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle     text NOT NULL,                 -- the concrete musical thing (piece/rhythm/performance/composer/phenomenon)
  kind        text,                          -- piece | rhythm | performance | composer | phenomenon | moment
  question    text,                          -- the human question
  mystery     text,                          -- "wait, how is that possible?"
  titles      jsonb NOT NULL DEFAULT '[]',   -- array of candidate titles
  outline     jsonb NOT NULL DEFAULT '[]',   -- array of investigation beats
  payoff      text,                          -- the human truth it lands on
  status      text NOT NULL DEFAULT 'idea',  -- idea | developing | scripted | published | parked
  rating      int,                           -- 1-5 (owner's gut score)
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS video_ideas_created_idx ON video_ideas (created_at DESC);
CREATE INDEX IF NOT EXISTS video_ideas_status_idx  ON video_ideas (status);

ALTER TABLE video_ideas ENABLE ROW LEVEL SECURITY;

-- Owner-only: full access for the channel owner's authenticated session.
DROP POLICY IF EXISTS video_ideas_owner_all ON video_ideas;
CREATE POLICY video_ideas_owner_all ON video_ideas
  FOR ALL TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');
