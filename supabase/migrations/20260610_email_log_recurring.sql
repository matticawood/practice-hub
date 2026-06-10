-- The once-only guard (email_log_once_idx) was built for one-shot campaigns: a
-- member can't be sent the same campaign twice. But the live-clinic reminder is
-- RECURRING — a member gets one for every clinic — so exclude it from the rule,
-- letting event-reminders log each clinic's recipients to email_log.

DROP INDEX IF EXISTS email_log_once_idx;
CREATE UNIQUE INDEX email_log_once_idx
  ON email_log (lower(email), campaign)
  WHERE status = 'sent' AND campaign <> 'livestream_reminder';
