-- Create public storage bucket for event cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-covers', 'event-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read (public bucket)
CREATE POLICY "event_covers_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-covers');

-- Only authenticated users can upload
CREATE POLICY "event_covers_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-covers');

-- Only authenticated users can delete their own uploads
CREATE POLICY "event_covers_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'event-covers');
