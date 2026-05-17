-- Add profile fields to allowed_emails
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS instrument text;
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS bio        text;
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS avatar_url text;

-- NOTE: You must also create an "avatars" storage bucket manually in the
-- Supabase dashboard (Storage → New bucket → name: "avatars", Public: true).
-- Set the bucket policy to allow authenticated users to upload files.
