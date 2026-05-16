-- Add vertical crop position for event cover images (0 = top, 50 = center, 100 = bottom)
ALTER TABLE live_events ADD COLUMN IF NOT EXISTS cover_position integer NOT NULL DEFAULT 50;
