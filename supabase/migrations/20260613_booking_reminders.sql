-- 1-hour lesson reminders. The lesson-reminders scheduled function (Netlify,
-- every 5 min) finds bookings starting ~1 hour out and emails the student their
-- join link. Stamping reminder_sent_at makes it idempotent (send once only).
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- Helps the window query (upcoming, not-yet-reminded bookings).
CREATE INDEX IF NOT EXISTS bookings_reminder_idx ON bookings (start_time) WHERE reminder_sent_at IS NULL;

NOTIFY pgrst, 'reload schema';
