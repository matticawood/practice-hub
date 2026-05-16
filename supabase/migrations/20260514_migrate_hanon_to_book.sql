-- Hanon (The Virtuoso Pianist) is a method book, not a piece.
-- Move it from kind = 'piece' to kind = 'book'.

UPDATE pieces
SET kind = 'book'
WHERE title ILIKE '%Virtuoso Pianist%'
  AND composer ILIKE '%Hanon%'
  AND (kind IS NULL OR kind = 'piece');

-- Verify
SELECT id, title, composer, kind
FROM pieces
WHERE title ILIKE '%Virtuoso Pianist%';
