-- Attribute unsubscribes to the email that drove them. The unsubscribe links now
-- carry the campaign (&c=…); the unsubscribe functions stamp this on the matching
-- email_log row, so the Studio can show an Unsubscribed count per email.

ALTER TABLE email_log ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;
