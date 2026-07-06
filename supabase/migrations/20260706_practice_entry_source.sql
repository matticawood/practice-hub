-- Practice-entry SOURCE + dedup key.
--
-- Foundation for auto-logging in-app activity (course lessons, practice-tool
-- games, articles) and the lightweight "quick log" alongside manual entries,
-- WITHOUT double-counting. Everything downstream — dedup, the stats split, and
-- roadmap-total-vs-per-area breakdown — falls out of these two fields.
--
-- Design:
--   * A practice_session is the entry unit. In-app activity becomes a session
--     with source <> 'manual' and a stable origin_ref so the same real thing can
--     only ever land once.
--   * Attribution stays where it already is: practice_items (item_type, piece_id,
--     theory_slug, ...). The roadmap totals from ITEM minutes mapped by item_type
--     (_RM_TYPE_TO_TRACK: piece/book->repertoire, technique->technique,
--     sightreading->sight_reading, theory/eartraining/improvisation->musicianship),
--     so attributed items hit total + their track and an UNTRACKED item_type
--     (e.g. 'other') hits the total only. That means no roadmap code change is
--     needed for any of this:
--       - auto lesson  -> one item_type='theory'      (total + musicianship)
--       - auto game    -> one item_type='eartraining'/'sightreading' (total + area)
--       - quick log    -> one item_type='other' holding the minutes, session
--                         source='quick' (total ONLY; shows as "unspecified" in the
--                         by-piece/by-skill breakdowns; identifiable via source).
--     Prior hours stay in practice_baseline and feed the total the same way.
--   * Prior hours stay in practice_baseline (unchanged) — that path already feeds
--     the roadmap total without touching stats; quick-log mirrors it.
--
-- origin_ref conventions (set by the client when it writes an auto entry):
--   lesson:<lesson_id>              -- a completed course lesson  (logs ONCE ever)
--   article:<article_id>           -- a completed daily article  (logs ONCE ever)
--   game:<tool>:<yyyy-mm-dd>       -- a day's games for one tool (UPSERT + accumulate
--                                     duration; one rolling row per tool per day)
-- manual and quick entries leave origin_ref NULL (unconstrained — a member may
-- have several a day).
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS source     text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS origin_ref text;

-- One auto entry per (member, source, instance): a completed lesson or a day's
-- games for a tool can only ever exist once, so a re-open / replay upserts the
-- same row instead of stacking duplicate hours. Manual/quick rows (origin_ref
-- NULL) are excluded from the constraint.
CREATE UNIQUE INDEX IF NOT EXISTS practice_sessions_origin_uniq
  ON practice_sessions (lower(email), source, origin_ref)
  WHERE origin_ref IS NOT NULL;

-- Keep the source vocabulary honest. (Existing rows all default to 'manual'.)
ALTER TABLE practice_sessions
  DROP CONSTRAINT IF EXISTS practice_sessions_source_chk;
ALTER TABLE practice_sessions
  ADD CONSTRAINT practice_sessions_source_chk
  CHECK (source IN ('manual','quick','app-lesson','app-game','app-article'));

-- Helps the "today so far" summary and dedup upserts read cheaply.
CREATE INDEX IF NOT EXISTS practice_sessions_email_date_source_idx
  ON practice_sessions (lower(email), session_date, source);

NOTIFY pgrst, 'reload schema';
