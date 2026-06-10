-- Per-recipient email engagement, updated by the Resend webhook (resend-webhook.mjs).
-- Each row in email_log is matched by resend_id (the message id we store on send),
-- then stamped as events arrive: delivered, opened, clicked, bounced, complained.
--
-- Opens/clicks require open & click tracking to be enabled in the Resend
-- dashboard; delivered/bounced/complained arrive regardless.

ALTER TABLE email_log ADD COLUMN IF NOT EXISTS delivered_at  timestamptz;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS opened_at     timestamptz;   -- first open
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS clicked_at    timestamptz;   -- first click
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS bounced_at    timestamptz;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS complained_at timestamptz;   -- marked as spam
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS bounce_kind   text;          -- hard | soft

-- The webhook looks rows up by resend_id, so index it.
CREATE INDEX IF NOT EXISTS email_log_resend_idx ON email_log (resend_id) WHERE resend_id IS NOT NULL;
