-- Add Piano Safari book series to the library
-- Authors: Katherine Fisher & Julie Knerr

INSERT INTO pieces (title, composer, kind, difficulty)
VALUES
  -- Repertoire
  ('Piano Safari Repertoire Book 1', 'Katherine Fisher & Julie Knerr', 'book', 1),
  ('Piano Safari Repertoire Book 2', 'Katherine Fisher & Julie Knerr', 'book', 2),
  ('Piano Safari Repertoire Book 3', 'Katherine Fisher & Julie Knerr', 'book', 3),

  -- Technique
  ('Piano Safari Technique Book 1', 'Katherine Fisher & Julie Knerr', 'book', 1),
  ('Piano Safari Technique Book 2', 'Katherine Fisher & Julie Knerr', 'book', 2),
  ('Piano Safari Technique Book 3', 'Katherine Fisher & Julie Knerr', 'book', 3),

  -- Reading
  ('Piano Safari Reading Book 1', 'Katherine Fisher & Julie Knerr', 'book', 1),
  ('Piano Safari Reading Book 2', 'Katherine Fisher & Julie Knerr', 'book', 2),
  ('Piano Safari Reading Book 3', 'Katherine Fisher & Julie Knerr', 'book', 3),

  -- Theory
  ('Piano Safari Theory Book 1', 'Katherine Fisher & Julie Knerr', 'book', 1),
  ('Piano Safari Theory Book 2', 'Katherine Fisher & Julie Knerr', 'book', 2),
  ('Piano Safari Theory Book 3', 'Katherine Fisher & Julie Knerr', 'book', 3)

ON CONFLICT DO NOTHING;

-- Verify
SELECT id, title, composer, difficulty
FROM pieces
WHERE title ILIKE 'Piano Safari%'
ORDER BY title;
