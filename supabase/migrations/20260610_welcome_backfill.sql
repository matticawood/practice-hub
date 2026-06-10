-- Manual enrolment for the welcome sequence: a short list of specific members
-- (genuinely-new recent joiners) who should get the sequence even though their
-- allowed_emails.created_at was stamped by the onboarding migration and so can't
-- be trusted as a real join date.
--
-- The welcome-sequence function enrols these emails IN ADDITION to normal
-- new signups, using started_at as their join date (so the Day 0 → 10 cadence
-- and the {timeIn} phrase work). Schema only — the actual emails are PII and are
-- loaded from a gitignored file (migration_workspace/).

CREATE TABLE IF NOT EXISTS welcome_backfill (
  email      text PRIMARY KEY,
  started_at date NOT NULL DEFAULT current_date,  -- treated as their join date
  note       text
);

ALTER TABLE welcome_backfill ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS welcome_backfill_owner_all ON welcome_backfill;
CREATE POLICY welcome_backfill_owner_all ON welcome_backfill
  FOR ALL
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');
