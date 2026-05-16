-- Add timezone column to live_events so event times display correctly across zones
ALTER TABLE live_events ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Europe/London';
