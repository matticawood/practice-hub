-- Optional per-session focus self-rating (1-5), captured at the end of logging.
-- Powers quality-over-quantity insights (focus vs time-of-day, session length,
-- category, etc). Nullable: existing rows and skipped ratings stay NULL.
-- practice_sessions already has owner read/write RLS, so no policy change needed.

ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS focus_rating smallint
  CHECK (focus_rating IS NULL OR (focus_rating BETWEEN 1 AND 5));
