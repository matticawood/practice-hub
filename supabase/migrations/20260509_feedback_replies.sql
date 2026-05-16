-- Feedback replies table for The Practice Room
-- Allows threaded replies on feedback/roadmap cards

CREATE TABLE IF NOT EXISTS feedback_replies (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id  uuid        NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  email        text        NOT NULL,
  display_name text,
  body         text        NOT NULL,
  is_owner     boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Fast lookups per feedback item
CREATE INDEX IF NOT EXISTS feedback_replies_feedback_id_idx
  ON feedback_replies (feedback_id, created_at ASC);

-- Open RLS (same pattern as other tables in this project)
ALTER TABLE feedback_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_replies_select" ON feedback_replies
  FOR SELECT TO anon USING (true);

CREATE POLICY "feedback_replies_insert" ON feedback_replies
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "feedback_replies_delete" ON feedback_replies
  FOR DELETE TO anon USING (true);
