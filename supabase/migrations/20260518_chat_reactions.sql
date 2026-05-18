CREATE TABLE IF NOT EXISTS community_chat_reactions (
  message_id  uuid  NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  email       text  NOT NULL,
  emoji       text  NOT NULL,
  PRIMARY KEY (message_id, email)
);
ALTER TABLE community_chat_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read chat reactions"   ON community_chat_reactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "members insert chat reaction"  ON community_chat_reactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND email = auth.jwt()->>'email');
CREATE POLICY "members update chat reaction"  ON community_chat_reactions FOR UPDATE USING (email = auth.jwt()->>'email');
CREATE POLICY "members delete chat reaction"  ON community_chat_reactions FOR DELETE USING (email = auth.jwt()->>'email');
