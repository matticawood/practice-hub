-- Pin a community post to the top of the feed.
-- pinned_at = NULL  → not pinned. pinned_at = timestamp → pinned (most-recently
-- pinned floats highest). No new RLS needed: the existing
-- community_posts_update_own policy already lets the owner (matthew@…) update
-- any post, which is who pins (the UI shows the control to admins only).
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS pinned_at timestamptz;

NOTIFY pgrst, 'reload schema';
