-- ================================================================
-- Dedupe glossary  — Generated 2026-06-04
--
-- A batch of terms (mostly ids ~999-1302) was inserted twice, leaving
-- 138 duplicate term names (each with two differently-worded but
-- equivalent definitions). This removes one of each duplicate,
-- KEEPING the row with the longest definition (tie-break: lowest id),
-- so the richer wording survives. Idempotent: re-running is a no-op
-- once there are no duplicates left.
--
-- PREVIEW FIRST (optional) — see exactly which rows would be deleted:
--
--   SELECT g.id, g.term, length(coalesce(g.definition,'')) AS def_len
--   FROM   glossary g
--   JOIN   glossary k
--     ON   lower(trim(g.term)) = lower(trim(k.term))
--    AND   g.id <> k.id
--   WHERE  length(coalesce(g.definition,'')) <  length(coalesce(k.definition,''))
--      OR (length(coalesce(g.definition,'')) = length(coalesce(k.definition,''))
--          AND g.id > k.id)
--   ORDER  BY g.term;
-- ================================================================

DELETE FROM glossary g
USING  glossary k
WHERE  lower(trim(g.term)) = lower(trim(k.term))
  AND  g.id <> k.id
  AND  (
         length(coalesce(g.definition,'')) <  length(coalesce(k.definition,''))
      OR (length(coalesce(g.definition,'')) = length(coalesce(k.definition,''))
          AND g.id > k.id)
       );

-- Optional: prevent future exact-name duplicates (case-insensitive).
-- Commented out by default in case any intentional same-name/different-meaning
-- pairs exist; enable if you want a hard guard.
-- CREATE UNIQUE INDEX IF NOT EXISTS glossary_term_ci_unique
--   ON glossary (lower(trim(term)));
