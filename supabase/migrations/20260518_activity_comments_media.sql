ALTER TABLE activity_comments ADD COLUMN IF NOT EXISTS media jsonb DEFAULT '[]';
