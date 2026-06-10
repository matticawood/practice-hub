-- Global email opt-out for allowed_emails.
--
-- The one-click unsubscribe function (email-unsubscribe.mjs) has always written
-- to allowed_emails.email_opt_out, but the column was never created — so until
-- now unsubscribing silently 400'd. This adds it as the single global opt-out
-- respected by every campaign (reactivation, the welcome sequence, the waitlist
-- email). It is separate from livestream_reminders_opt_out, which stays specific
-- to the 1-hour livestream reminder.

ALTER TABLE allowed_emails
  ADD COLUMN IF NOT EXISTS email_opt_out boolean NOT NULL DEFAULT false;
