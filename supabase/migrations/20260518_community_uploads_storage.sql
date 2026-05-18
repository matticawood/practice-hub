-- Ensure the community-uploads storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-uploads',
  'community-uploads',
  true,
  524288000,  -- 500 MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','audio/webm','audio/mp4','audio/ogg','video/mp4','video/webm','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload to their own folder
CREATE POLICY IF NOT EXISTS "auth users can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'community-uploads');

-- Allow public read access
CREATE POLICY IF NOT EXISTS "public read community uploads"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'community-uploads');

-- Allow users to delete their own uploads
CREATE POLICY IF NOT EXISTS "users delete own uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'community-uploads' AND (storage.foldername(name))[1] = auth.jwt()->>'email');
