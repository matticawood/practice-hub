-- Add media column to community_posts for storing Mux video and image references
ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]';
