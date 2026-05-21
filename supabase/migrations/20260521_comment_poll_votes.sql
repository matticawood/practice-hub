CREATE TABLE IF NOT EXISTS comment_poll_votes (
  comment_id   uuid    NOT NULL,
  email        text    NOT NULL,
  option_index integer NOT NULL,
  PRIMARY KEY (comment_id, email)
);

ALTER TABLE comment_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read poll votes"
  ON comment_poll_votes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.email()));

CREATE POLICY "Members insert poll votes"
  ON comment_poll_votes FOR INSERT TO authenticated
  WITH CHECK (auth.email() = email AND EXISTS (SELECT 1 FROM allowed_emails WHERE email = auth.email()));

CREATE POLICY "Members update own poll votes"
  ON comment_poll_votes FOR UPDATE TO authenticated
  USING  (auth.email() = email)
  WITH CHECK (auth.email() = email);
