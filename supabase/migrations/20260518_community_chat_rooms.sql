CREATE TABLE IF NOT EXISTS community_chat_rooms (
  id          uuid   DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text,  -- optional custom name
  created_by  text   NOT NULL,
  created_at  timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS community_chat_participants (
  room_id  uuid REFERENCES community_chat_rooms(id) ON DELETE CASCADE,
  email    text NOT NULL,
  PRIMARY KEY (room_id, email)
);
ALTER TABLE community_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_chat_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read rooms" ON community_chat_rooms FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "insert rooms" ON community_chat_rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "read participants" ON community_chat_participants FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "insert participants" ON community_chat_participants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
