CREATE TABLE IF NOT EXISTS community_messages (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id     text        NOT NULL,  -- 'group' or sorted 'email1|email2' for DMs
  email       text        NOT NULL,
  name        text,
  content     text        NOT NULL DEFAULT '',
  media       jsonb       DEFAULT '[]',
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_messages_chat ON community_messages(chat_id, created_at);
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read chat" ON community_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "members insert chat" ON community_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND email = auth.jwt()->>'email');
