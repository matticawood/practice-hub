-- Lesson-package credits. A buyer purchases a package of 1-hour lessons (3/6/12),
-- which grants them `remaining` credits keyed by email. They return to the brand
-- site's /book-a-lesson page, are looked up by email, and redeem one credit per
-- booked lesson (no second charge) until the credits run out.
--
-- Written server-side only: clinic-webhook inserts a row on a package purchase;
-- lesson-redeem decrements `remaining` when a lesson is booked. Owner-read only.
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

CREATE TABLE IF NOT EXISTS lesson_credits (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email             text NOT NULL,
  package           text,            -- '3' | '6' | '12'
  total             int  NOT NULL,
  remaining         int  NOT NULL,
  stripe_session_id text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lesson_credits_email_idx ON lesson_credits (lower(email));
-- one row per Stripe purchase (idempotent webhook retries)
CREATE UNIQUE INDEX IF NOT EXISTS lesson_credits_session_idx ON lesson_credits (stripe_session_id) WHERE stripe_session_id IS NOT NULL;

ALTER TABLE lesson_credits ENABLE ROW LEVEL SECURITY;

-- Owner-only read (admin). All writes go through service-role edge functions.
DROP POLICY IF EXISTS lesson_credits_owner_read ON lesson_credits;
CREATE POLICY lesson_credits_owner_read ON lesson_credits
  FOR SELECT TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'matthew@matthewcawood.com');

NOTIFY pgrst, 'reload schema';
