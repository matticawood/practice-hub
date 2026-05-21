-- Restrict live_events DELETE to the owner only.
-- The existing live_events_admin_write (FOR ALL) covers allowed_emails which
-- includes all members — too broad for deletion. Add a specific owner-only
-- delete policy and rely on it instead.

-- The FOR ALL policy already handles SELECT/INSERT/UPDATE for allowed_emails,
-- so we just need to ensure DELETE is gated to the owner email only.
-- Postgres applies the most-permissive matching policy, so we need to prevent
-- the FOR ALL policy from allowing deletes by non-owners. The cleanest fix is
-- to drop and re-add the admin_write policy scoped to non-delete operations,
-- then add a separate owner-only delete policy.

DROP POLICY IF EXISTS "live_events_admin_write"  ON live_events;
DROP POLICY IF EXISTS "live_events_owner_delete" ON live_events;

-- Restore write access for all allowed_emails (insert + update only)
CREATE POLICY "live_events_admin_write" ON live_events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "live_events_admin_update" ON live_events
  FOR UPDATE TO authenticated
  USING   (EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.jwt() ->> 'email'));

-- Only the owner can delete events
CREATE POLICY "live_events_owner_delete" ON live_events
  FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' = 'matthew@matthewcawood.com');
