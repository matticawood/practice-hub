-- ============================================================
-- Circle delta migration 2026-05-28 (likes → activity_reactions mirror)
--
-- The community.html UI uses TWO sources for the post-like display:
--   - community_post_likes (post_id, email) — sets the outer heart's
--     filled/unfilled state (myLikeSet) and contributes to the outer "X likes" tally.
--   - activity_reactions (item_id, email, emoji, event_type) — drives the
--     emoji-reaction popover (per-emoji counts AND "mine" highlight).
--
-- The merged outer total `_combinedTotal` dedupes by email across both, so
-- the outer count is correct even when a like is in only one table. But the
-- popover heart count comes solely from activity_reactions, so an imported
-- Circle like sitting in community_post_likes shows the heart with no count
-- (and no "mine" highlight) inside the popover. After the user unlikes via
-- the popover and re-likes, only the activity_reactions row exists and the
-- popover then displays "1 reaction" — the source of the observed bug.
--
-- This migration mirrors every community_post_likes row into activity_reactions
-- with emoji='❤️' and event_type='post', so the popover shows consistent
-- per-emoji state for all imported likes. community_post_likes is left in place
-- so the outer heart's filled state (myLikeSet) keeps working.
-- ============================================================

BEGIN;

INSERT INTO activity_reactions (item_id, email, emoji, event_type, created_at)
SELECT
  cpl.post_id::text AS item_id,
  cpl.email,
  '❤️' AS emoji,
  'post' AS event_type,
  COALESCE(cpl.created_at, now()) AS created_at
FROM community_post_likes cpl
WHERE NOT EXISTS (
  SELECT 1 FROM activity_reactions ar
  WHERE ar.item_id    = cpl.post_id::text
    AND ar.email      = cpl.email
    AND ar.event_type = 'post'
    AND ar.emoji      = '❤️'
);

COMMIT;
