-- Allow post authors to edit their own community posts (title + content), and
-- track when a post was last edited so the feed and detail view can show a
-- subtle "edited" marker (mirrors the existing edited_at on community_post_comments).
--
-- Author check is case-insensitive (lower(email) = lower(jwt email)) because some
-- legacy rows store mixed-case emails. A post can be edited by its author OR by the
-- owner (matthew@matthewcawood.com), who can edit any post for moderation/testing.
--
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- author-or-owner UPDATE policy (case-insensitive email match)
DROP POLICY IF EXISTS community_posts_update_own ON community_posts;
CREATE POLICY community_posts_update_own ON community_posts
  FOR UPDATE TO authenticated
  USING (
    lower(email) = lower(auth.jwt() ->> 'email')
    OR lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com'
  )
  WITH CHECK (
    lower(email) = lower(auth.jwt() ->> 'email')
    OR lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com'
  );

NOTIFY pgrst, 'reload schema';
