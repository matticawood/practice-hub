-- Hidden "test event" flag for live_events. A test event is visible only to the
-- owner (admin) — it's filtered out of every member-facing events list, and
-- going live on it sends no member notifications. Lets the admin rehearse the
-- live-stream flow (and preview the viewer side) without any member seeing it.
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

ALTER TABLE live_events ADD COLUMN IF NOT EXISTS test boolean NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';
