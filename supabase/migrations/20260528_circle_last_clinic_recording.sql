-- ============================================================
-- Circle delta migration 2026-05-28 (last live practice clinic recording)
--
-- The May 25 live_events row was generic ('Live Practice Clinic' with no
-- mux_playback_id). Updating it to match the Circle post:
--   "Live Practice Clinic: Playing Confidently When Playing For Others"
-- and attaching the Mux video that was already uploaded for the content_feed
-- post version of this clinic (playback_id rdf02bKI8Qo... / asset_id nBT9nfz3qJb...).
-- ============================================================

UPDATE live_events
SET title = 'Live Practice Clinic: Playing Confidently When Playing For Others',
    mux_playback_id = 'rdf02bKI8Qo83y02SGFegX01eE6hlCcs6qKkeFMLNToT500',
    mux_asset_id    = 'nBT9nfz3qJb11DpW00SiaouKHvhXNPRdLKWLOBVkr02G8'
WHERE status = 'ended'
  AND scheduled_at = '2026-05-25 22:30:00+00'
  AND (title = 'Live Practice Clinic' OR title IS NULL);
