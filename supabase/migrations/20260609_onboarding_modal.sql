-- First-login onboarding modal flags on allowed_emails.
--   welcome_seen_at  → null = show the WELCOME modal (new members), then stamp.
--   info_seen_at     → null = show the one-off INFO modal (existing members), then stamp.
-- Logic (shared-header.js): show welcome if welcome_seen_at is null, else info if
-- info_seen_at is null, else nothing. Dismissing the welcome stamps BOTH (so a new
-- member never also gets the info one).
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS created_at      timestamptz DEFAULT now();
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS welcome_seen_at timestamptz;
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS info_seen_at    timestamptz;

-- Go-live backfill: mark every current member as "welcome seen" so they receive the
-- one-off INFO modal (not the welcome). Anyone added from now on gets the welcome.
UPDATE allowed_emails SET welcome_seen_at = now() WHERE welcome_seen_at IS NULL;
