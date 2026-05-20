-- Allow any authenticated member to read name + avatar_url for any member.
-- Needed so the backstage "watching" list and member profile lookups can show
-- correct avatars for other members (e.g. viewers in a live stream).

DROP POLICY IF EXISTS "Members can read others name and avatar" ON allowed_emails;
CREATE POLICY "Members can read others name and avatar"
  ON allowed_emails FOR SELECT
  USING (auth.role() = 'authenticated');
