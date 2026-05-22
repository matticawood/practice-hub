-- ================================================================
-- Fix corrupted piece item labels
-- Generated 2026-05-22
--
-- Bug: when editing a saved session, the composer was extracted from
-- the label using indexOf(' — '), which matched the first dash inside
-- titles like "Moonlight Sonata — 1st movement…". On each re-save the
-- wrong suffix was appended again, growing the label.
--
-- Fix: for every practice_items row that is linked to the pieces table
-- (piece_id IS NOT NULL), reset label to the canonical "Title — Composer"
-- (or just "Title" if no composer). Rows that are already correct are
-- untouched (IS DISTINCT FROM guard).
-- ================================================================

UPDATE practice_items pi
SET    label = CASE
                 WHEN p.composer IS NOT NULL AND p.composer <> ''
                   THEN p.title || ' — ' || p.composer
                 ELSE p.title
               END
FROM   pieces p
WHERE  pi.piece_id   = p.id
  AND  pi.item_type  = 'piece'
  AND  pi.label IS DISTINCT FROM (
         CASE
           WHEN p.composer IS NOT NULL AND p.composer <> ''
             THEN p.title || ' — ' || p.composer
           ELSE p.title
         END
       );
