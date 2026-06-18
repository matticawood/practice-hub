-- Customer "My Account" hub: let a logged-in customer read their OWN rows, and
-- capture enough booking detail to list a customer's upcoming lessons.
--
-- All policies are ADDITIVE (permissive, OR-ed with the existing owner-read
-- policies), so the owner dashboard is unchanged. A customer can only ever read
-- rows whose email matches their authenticated JWT email.
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

-- ── Self-read policies (email = the logged-in customer's email) ───────────────
DROP POLICY IF EXISTS store_orders_self_read ON store_orders;
CREATE POLICY store_orders_self_read ON store_orders
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS lesson_credits_self_read ON lesson_credits;
CREATE POLICY lesson_credits_self_read ON lesson_credits
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS bookings_self_read ON bookings;
CREATE POLICY bookings_self_read ON bookings
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- Membership check: a customer can read their own allowed_emails row (present = member).
DROP POLICY IF EXISTS allowed_emails_self_read ON allowed_emails;
CREATE POLICY allowed_emails_self_read ON allowed_emails
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- ── Booking detail on `bookings` (so the account hub can list upcoming lessons) ─
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cal_uid            text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_time         timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_url        text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status             text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_type_id      text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS attendee_timezone  text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS attendee_name      text;

CREATE INDEX IF NOT EXISTS bookings_cal_uid_idx    ON bookings (cal_uid);
CREATE INDEX IF NOT EXISTS bookings_start_time_idx ON bookings (start_time);

NOTIFY pgrst, 'reload schema';
