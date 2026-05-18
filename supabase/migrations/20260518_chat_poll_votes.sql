CREATE TABLE IF NOT EXISTS community_chat_poll_votes (
  message_id  uuid  NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  email       text  NOT NULL,
  option_idx  int   NOT NULL,
  PRIMARY KEY (message_id, email)
);
ALTER TABLE community_chat_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read poll votes"   ON community_chat_poll_votes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "members insert poll vote"  ON community_chat_poll_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND email = auth.jwt()->>'email');
CREATE POLICY "members update poll vote"  ON community_chat_poll_votes FOR UPDATE USING (email = auth.jwt()->>'email');
CREATE POLICY "members delete poll vote"  ON community_chat_poll_votes FOR DELETE USING (email = auth.jwt()->>'email');
