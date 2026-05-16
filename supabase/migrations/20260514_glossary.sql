-- Music glossary table
CREATE TABLE IF NOT EXISTS glossary (
  id            bigserial PRIMARY KEY,
  term          text        NOT NULL,
  definition    text        NOT NULL,
  category      text        NOT NULL,   -- e.g. Tempo, Dynamics, Articulation, Form, Pitch, Rhythm, Harmony, Notation, Expression
  origin        text,                   -- e.g. Italian, German, French, Latin
  symbol_html   text,                   -- optional HTML/SVG to render a symbol
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS glossary_term_idx ON glossary USING gin(to_tsvector('english', term || ' ' || definition));

-- RLS
ALTER TABLE glossary ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "glossary_read" ON glossary
  FOR SELECT USING (true);

-- Only authenticated users who are in allowed_emails (admin) can insert/update/delete
CREATE POLICY "glossary_write" ON glossary
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM allowed_emails
      WHERE email = auth.jwt() ->> 'email'
    )
  );
