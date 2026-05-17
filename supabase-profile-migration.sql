-- Add profile fields to allowed_emails
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS instrument text;
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS bio        text;
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS headline   text;
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS location   text;
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS website    text;
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS instagram  text;
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS youtube    text;
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS twitter    text;

-- Member badges (shown next to name in community feed)
ALTER TABLE allowed_emails ADD COLUMN IF NOT EXISTS badge text;

-- STORAGE: Create a public bucket called "avatars" in the Supabase dashboard.
-- Storage > New bucket > Name: avatars > Public: ON
-- Then add this storage policy in Storage > Policies:
-- Allow authenticated users to upload: bucket_id = 'avatars' AND auth.role() = 'authenticated'
