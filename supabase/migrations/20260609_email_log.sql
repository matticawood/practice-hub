-- Automated-email log + safety net.
--
-- Every send (reactivation, the welcome sequence, the waitlist email) writes one
-- row here. This gives the Automations admin panel a full history, AND the
-- partial unique index below makes a double-send physically impossible at the
-- database level — a second 'sent' row for the same (email, campaign) is rejected,
-- so even a buggy caller or a double-click can never email the same person the
-- same campaign twice. Test sends (status='test') are exempt so they never block
-- the real send.
--
-- status values:
--   'sent'   real delivery accepted by Resend (counts toward the once-only rule)
--   'failed' Resend rejected it (does NOT block a later retry)
--   'test'   owner-only test send (does NOT block the real send)
--   'skipped' recipient was opted out / already sent / not a member

CREATE TABLE IF NOT EXISTS email_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email       text NOT NULL,
  campaign    text NOT NULL,          -- 'reactivation' | 'welcome_d0' | 'welcome_d2' | ... | 'waitlist'
  status      text NOT NULL DEFAULT 'sent',
  resend_id   text,                   -- Resend message id, for tracing a specific send
  error       text,                   -- failure reason, when status='failed'
  meta        jsonb,                  -- anything extra (e.g. days_silent, name)
  sent_at     timestamptz NOT NULL DEFAULT now()
);

-- Once-only guarantee: at most one successful send of a given campaign per email.
CREATE UNIQUE INDEX IF NOT EXISTS email_log_once_idx
  ON email_log (lower(email), campaign)
  WHERE status = 'sent';

-- Fast "what has this person already been sent?" and recent-history lookups.
CREATE INDEX IF NOT EXISTS email_log_email_idx ON email_log (lower(email));
CREATE INDEX IF NOT EXISTS email_log_sent_at_idx ON email_log (sent_at DESC);

-- Owner-only read for the Automations panel. Writes happen via the service-role
-- key in the Netlify function, which bypasses RLS, so no insert policy is needed.
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_log_owner_read ON email_log;
CREATE POLICY email_log_owner_read ON email_log
  FOR SELECT
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');
