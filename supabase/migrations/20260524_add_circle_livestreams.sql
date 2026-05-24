-- ================================================================
-- Add two past Circle live streams as ended events
-- Generated 2026-05-24
--
-- mux_asset_id is set; mux_playback_id must be added via the admin
-- "Add Recording" form on /events.html (paste the Playback ID found
-- in the Mux dashboard under the asset → Playback IDs tab).
-- ================================================================

INSERT INTO live_events (
  title,
  description,
  scheduled_at,
  duration_mins,
  status,
  mux_asset_id,
  mux_playback_id,
  created_by
) VALUES
(
  'Live Practice Clinic: First Session',
  NULL,
  '2026-04-27 22:30:00+00',   -- 6:30 pm EST = 22:30 UTC
  60,
  'ended',
  'j8jkw4vqwYRQkwqNpk4dBuqmGSmDTJviP100Fk1ZaC3k',
  NULL,
  'matthew@matthewcawood.com'
),
(
  'Live Practice Clinic: Building Finger Control, Balance & Coordination',
  NULL,
  '2026-05-11 19:00:00+00',   -- 3:00 pm EST = 19:00 UTC
  60,
  'ended',
  'kkADIxVFWODMi44GvcbkYF6KpFTupDDGJogmwzIRBX8',
  NULL,
  'matthew@matthewcawood.com'
);
