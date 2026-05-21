-- Allow authenticated users to delete their own chat messages.
-- Without this policy RLS silently blocks the DELETE (no error, 0 rows affected)
-- so the message disappears locally but reappears on refresh.

CREATE POLICY "community_messages_own_delete" ON community_messages
  FOR DELETE TO authenticated
  USING (email = auth.jwt() ->> 'email');
