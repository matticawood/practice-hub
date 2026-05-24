-- ================================================================
-- Add Mux playback IDs to the two Circle live stream events
-- Generated 2026-05-24
-- ================================================================

UPDATE live_events
SET mux_playback_id = 'Q39OI9Ut017PIQyectwV201hbkQtetllUxEvidZzyUTPU'
WHERE mux_asset_id = 'j8jkw4vqwYRQkwqNpk4dBuqmGSmDTJviP100Fk1ZaC3k'
  AND mux_playback_id IS NULL;

UPDATE live_events
SET mux_playback_id = '5nhlJ7WMZp1UFT46Ah4B6l8Qkz5znQo1iy9Y7xEwiQg'
WHERE mux_asset_id = 'kkADIxVFWODMi44GvcbkYF6KpFTupDDGJogmwzIRBX8'
  AND mux_playback_id IS NULL;
