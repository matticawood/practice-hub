-- 1-hour livestream reminder emails (via Resend, sent by a Netlify scheduled fn).
--
-- live_events.reminder_sent_at  → set once the 1h email goes out, so each event
--                                 only ever fires one reminder (idempotent).
-- allowed_emails.livestream_reminders_opt_out → respected by the sender; the
--                                 unsubscribe link flips this to true. Scoped
--                                 specifically to livestream reminders, so it
--                                 won't affect any other email you add later.
-- allowed_emails.unsubscribe_token → opaque token used in the unsubscribe link
--                                 so a user can opt out without logging in.

ALTER TABLE live_events
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

ALTER TABLE allowed_emails
  ADD COLUMN IF NOT EXISTS livestream_reminders_opt_out boolean NOT NULL DEFAULT false;

ALTER TABLE allowed_emails
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();

-- Lets the scheduled function find "real events ~1h out, not yet reminded" cheaply.
CREATE INDEX IF NOT EXISTS live_events_reminder_idx
  ON live_events (scheduled_at)
  WHERE reminder_sent_at IS NULL AND status = 'scheduled';
