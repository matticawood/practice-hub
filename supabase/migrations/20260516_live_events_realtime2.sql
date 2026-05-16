-- Enable Realtime for live_events so recording auto-appears on event detail page
ALTER TABLE live_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE live_events;
