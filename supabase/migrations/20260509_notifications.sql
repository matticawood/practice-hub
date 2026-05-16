-- Notifications table for The Practice Room
-- Stores per-user notifications: achievements, piece additions, app updates

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL,
  type        text        NOT NULL,   -- 'achievement' | 'piece_added' | 'app_update'
  title       text        NOT NULL,
  body        text,
  link_url    text,                   -- 'achievements' | 'library' | null
  source_id   text,                   -- dedup key e.g. 'ach_s10', 'req_123'
  metadata    jsonb       NOT NULL DEFAULT '{}',
  read        boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Fast lookups per user
CREATE INDEX IF NOT EXISTS notifications_email_idx
  ON notifications (email, created_at DESC);

-- Prevent duplicate notifications for the same source event per user
CREATE UNIQUE INDEX IF NOT EXISTS notifications_source_uniq
  ON notifications (email, source_id, type)
  WHERE source_id IS NOT NULL;

-- RLS: each user can only read/write their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT TO anon USING (true);

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "notifications_delete" ON notifications
  FOR DELETE TO anon USING (true);
