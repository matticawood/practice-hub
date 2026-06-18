-- ============================================================
-- Circle delta migration 2026-05-28 (chat reply timestamps fix)
--
-- The chat thread reply migration computed reply created_at from "X days ago"
-- relative to TODAY (BST midnight), which often produced a timestamp BEFORE
-- the parent message (parents were posted mid-day, replies got 00:00 BST of
-- the same or earlier date).
--
-- This fixes every reply whose created_at is on or before its parent's
-- created_at, by setting it to parent.created_at + N minutes where N is the
-- row's order within that thread. Replies that already come after their
-- parent are untouched.
-- ============================================================

BEGIN;

WITH bad_replies AS (
  SELECT
    c.id,
    p.created_at AS parent_created_at,
    ROW_NUMBER() OVER (
      PARTITION BY (c.media->0->>'toId')
      ORDER BY c.created_at, c.id
    ) AS rn
  FROM community_messages c
  JOIN community_messages p ON p.id::text = (c.media->0->>'toId')
  WHERE c.chat_id = 'group'
    AND c.media @> '[{"type": "reply"}]'::jsonb
    AND c.created_at <= p.created_at
)
UPDATE community_messages cm
SET created_at = bad_replies.parent_created_at + (bad_replies.rn * INTERVAL '1 minute')
FROM bad_replies
WHERE cm.id = bad_replies.id;

COMMIT;
