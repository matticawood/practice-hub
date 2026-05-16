-- Enable Supabase Realtime for live event chat and Q&A tables
ALTER TABLE event_chat REPLICA IDENTITY FULL;
ALTER TABLE event_qa   REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE event_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE event_qa;
