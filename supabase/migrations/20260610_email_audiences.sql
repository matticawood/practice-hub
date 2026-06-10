-- General email audiences: contacts + lists (many-to-many).
--
-- MEMBERS stay in allowed_emails (the built-in "Members" audience). This system
-- is for every OTHER email list — the waiting list now, Monday Music Tips later,
-- anything else. One contact can be on several lists; unsubscribing is per-list
-- (leave one list, stay on the others) with a global kill-switch as well.
--
-- This file is schema + list definitions only. Actual email addresses are PII and
-- are loaded separately from a file kept out of git (migration_workspace/).

-- The lists you can send to.
CREATE TABLE IF NOT EXISTS email_lists (
  slug        text PRIMARY KEY,          -- 'waitlist', 'monday-music-tips', ...
  name        text NOT NULL,             -- display name, used in the footer
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Every non-member email, stored once.
CREATE TABLE IF NOT EXISTS email_contacts (
  email             text PRIMARY KEY,
  name              text,                                     -- optional, for {firstName}
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),  -- one per contact
  global_opt_out    boolean NOT NULL DEFAULT false,           -- unsubscribe from everything
  created_at        timestamptz NOT NULL DEFAULT now(),
  notes             text
);
CREATE INDEX IF NOT EXISTS email_contacts_token_idx ON email_contacts (unsubscribe_token);

-- Which contact is on which list (many-to-many), with per-list opt-out.
CREATE TABLE IF NOT EXISTS email_list_subscriptions (
  email         text NOT NULL REFERENCES email_contacts(email) ON DELETE CASCADE,
  list_slug     text NOT NULL REFERENCES email_lists(slug) ON DELETE CASCADE,
  opted_out     boolean NOT NULL DEFAULT false,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (email, list_slug)
);
CREATE INDEX IF NOT EXISTS email_list_subs_list_idx ON email_list_subscriptions (list_slug) WHERE opted_out = false;

-- Seed the first list. (Add more later, e.g. Monday Music Tips, the same way.)
INSERT INTO email_lists (slug, name, description) VALUES
  ('waitlist', 'The Practice Room Waiting List', 'People who signed up to hear more but have not joined.')
ON CONFLICT (slug) DO NOTHING;

-- Owner-only read + write on all three. The sender + unsubscribe functions use the
-- service-role key (bypasses RLS), so no public policy is needed.
ALTER TABLE email_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_list_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['email_lists','email_contacts','email_list_subscriptions'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_owner_all ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_owner_all ON %I FOR ALL USING (lower(auth.jwt() ->> ''email'') = ''matthew@matthewcawood.com'') WITH CHECK (lower(auth.jwt() ->> ''email'') = ''matthew@matthewcawood.com'')',
      t, t);
  END LOOP;
END $$;
