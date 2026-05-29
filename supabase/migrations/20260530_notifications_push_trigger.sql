-- ──────────────────────────────────────────────────────────────────────────────
-- Notifications → push notifications wiring
--
-- Originally this migration installed a Postgres trigger + pg_net call to
-- invoke the send-push edge function. That requires setting database-level
-- config parameters which Supabase hosted blocks for the postgres role
-- (ERROR 42501: permission denied to set parameter "app.supabase_url").
--
-- Instead we use Supabase Database Webhooks (configured via dashboard) which
-- fire HTTP requests automatically on row inserts with auth built in.
--
-- Setup steps (one-time, in Supabase Dashboard):
--   1. Database → Webhooks → Create a new hook
--   2. Name: "notifications-push"
--   3. Table: notifications, Events: Insert
--   4. Type: Supabase Edge Functions
--   5. Edge Function: send-push
--   6. HTTP Headers: Content-Type = application/json (auto-added)
--   7. HTTP Params: leave default
--   8. Confirm + create
--
-- The webhook payload format is { type, table, record, schema, old_record }.
-- The send-push function reads record.id to look up the notification.
--
-- This file is intentionally empty of SQL — left for migration history.
-- ──────────────────────────────────────────────────────────────────────────────

-- Clean up if a previous version of this migration created the trigger:
DROP TRIGGER  IF EXISTS trg_send_push_on_notification ON notifications;
DROP FUNCTION IF EXISTS fire_send_push_on_notification();

NOTIFY pgrst, 'reload schema';
