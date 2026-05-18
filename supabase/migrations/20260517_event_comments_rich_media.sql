-- 1. Make event_comments.content nullable (currently NOT NULL, blocks poll/media-only posts)
ALTER TABLE event_comments ALTER COLUMN content DROP NOT NULL;

-- 2. Add media jsonb + parent_id columns if they don't already exist
ALTER TABLE event_comments ADD COLUMN IF NOT EXISTS media jsonb;
ALTER TABLE event_comments ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES event_comments(id) ON DELETE CASCADE;

-- 3. Create comment-attachments storage bucket (for images/files/audio in events discussion)
INSERT INTO storage.buckets (id, name, public)
VALUES ('comment-attachments', 'comment-attachments', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "comment_attachments_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'comment-attachments');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "comment_attachments_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'comment-attachments');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "comment_attachments_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'comment-attachments');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Create event_comment_polls table (if not exists) with RLS
CREATE TABLE IF NOT EXISTS event_comment_polls (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  uuid NOT NULL REFERENCES event_comments(id) ON DELETE CASCADE,
  question    text NOT NULL,
  options     jsonb NOT NULL DEFAULT '[]',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE event_comment_polls ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "ev_polls_read"   ON event_comment_polls FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ev_polls_insert" ON event_comment_polls FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Create event_comment_poll_votes table (if not exists) with RLS
CREATE TABLE IF NOT EXISTS event_comment_poll_votes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id      uuid NOT NULL REFERENCES event_comment_polls(id) ON DELETE CASCADE,
  email        text NOT NULL,
  option_index integer NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(poll_id, email)
);

ALTER TABLE event_comment_poll_votes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "ev_poll_votes_read"   ON event_comment_poll_votes FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ev_poll_votes_insert" ON event_comment_poll_votes FOR INSERT TO authenticated WITH CHECK (email = auth.jwt() ->> 'email');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ev_poll_votes_delete" ON event_comment_poll_votes FOR DELETE TO authenticated USING (email = auth.jwt() ->> 'email');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
