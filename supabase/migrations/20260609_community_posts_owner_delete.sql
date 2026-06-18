-- Let the owner delete ANY community post (members can still only delete their own).
--
-- Why: community_posts_update_own (20260602) gave the owner an UPDATE override, but
-- the DELETE policy stayed author-only. So the admin Delete button in community.html
-- renders, the client issues the delete, but RLS matches 0 rows and returns no error —
-- the post silently survives. This mirrors the UPDATE policy for DELETE.
--
-- RLS combines permissive policies with OR, so adding this grants the owner delete
-- rights on top of whatever author-only DELETE policy already exists.
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

DROP POLICY IF EXISTS community_posts_delete_author_or_owner ON community_posts;
CREATE POLICY community_posts_delete_author_or_owner ON community_posts
  FOR DELETE TO authenticated
  USING (
    lower(email) = lower(auth.jwt() ->> 'email')
    OR lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com'
  );

NOTIFY pgrst, 'reload schema';
