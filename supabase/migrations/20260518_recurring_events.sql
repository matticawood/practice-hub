ALTER TABLE live_events ADD COLUMN IF NOT EXISTS recurrence_group_id uuid;
ALTER TABLE live_events ADD COLUMN IF NOT EXISTS recurrence_rule jsonb;
