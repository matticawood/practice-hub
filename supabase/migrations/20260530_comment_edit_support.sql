-- Allow comment authors to edit their own comments (content + edited_at), and
-- add an edited_at column so the UI can show an "(edited)" marker.
--
-- Covers every comment system in the app:
--   community_post_comments      (community posts)
--   activity_comments            (activity feed)
--   content_feed_comments        (content feed)
--   practice_room_update_comments(practice-room updates)
--   weekly_focus_comments        (weekly focus)
--   event_comments               (live events)
--
-- Author check is case-insensitive (lower(email) = lower(jwt email)) because
-- some legacy rows store mixed-case emails. Editing is author-only — admins can
-- delete but not rewrite someone else's words.
--
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'community_post_comments',
    'activity_comments',
    'content_feed_comments',
    'practice_room_update_comments',
    'weekly_focus_comments',
    'event_comments'
  ] LOOP
    -- edited_at column
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS edited_at timestamptz;', t);

    -- author-only UPDATE policy (case-insensitive email match)
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', t || '_update_own', t);
    EXECUTE format($f$
      CREATE POLICY %I ON %I
        FOR UPDATE TO authenticated
        USING (lower(email) = lower(auth.jwt() ->> 'email'))
        WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email'));
    $f$, t || '_update_own', t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
