-- ================================================================
-- Allow community members to read practice_sessions and
-- practice_items that have been shared to the community feed.
--
-- Without these policies, Supabase RLS blocks any user from reading
-- another user's session rows, so community.html can hydrate the
-- session date/duration from practice_sessions but gets empty items
-- from practice_items — causing the item cards to not render.
--
-- These policies add a read-only exception: if a practice_log post
-- in community_posts links to a session, that session and its items
-- become readable by any authenticated user.
-- ================================================================

-- practice_sessions: allow reading rows that are shared to community
DROP POLICY IF EXISTS "shared_sessions_are_readable" ON practice_sessions;
CREATE POLICY "shared_sessions_are_readable" ON practice_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM community_posts
    WHERE community_posts.session_id = practice_sessions.id
      AND community_posts.type = 'practice_log'
  )
);

-- practice_items: allow reading items whose session is shared to community
DROP POLICY IF EXISTS "shared_session_items_are_readable" ON practice_items;
CREATE POLICY "shared_session_items_are_readable" ON practice_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM community_posts
    WHERE community_posts.session_id = practice_items.session_id
      AND community_posts.type = 'practice_log'
  )
);
