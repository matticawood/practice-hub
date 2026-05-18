-- Ensure community-uploads bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-uploads', 'community-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow any authenticated user to upload
CREATE POLICY "authenticated users can upload to community-uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'community-uploads');

-- Allow public read
CREATE POLICY "public read community-uploads"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'community-uploads');

-- Allow users to delete their own uploads
CREATE POLICY "users can delete own community-uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'community-uploads');
