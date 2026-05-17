-- Add profile fields to allowed_emails
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS instrument text;
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS bio        text;
