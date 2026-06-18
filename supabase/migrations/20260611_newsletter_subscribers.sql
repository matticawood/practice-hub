-- Newsletter (Monday Music Tips) subscribers captured from the brand site's
-- signup forms. Written server-side by the brand site's `newsletter` Netlify
-- function (service role). Owner-read only.
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email      text PRIMARY KEY,
  source     text,                       -- which form / page they signed up from
  status     text NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed','unsubscribed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_created_idx ON newsletter_subscribers (created_at);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Owner-only read (admin). All writes go through the service-role function.
DROP POLICY IF EXISTS newsletter_owner_read ON newsletter_subscribers;
CREATE POLICY newsletter_owner_read ON newsletter_subscribers
  FOR SELECT TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

NOTIFY pgrst, 'reload schema';
