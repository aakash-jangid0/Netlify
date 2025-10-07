-- Create storage bucket for image uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'images', 'images', true, 5242880, ARRAY['image/*']
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'images'
);

-- Set up RLS policies for the images bucket
-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to all images  
CREATE POLICY "Public can view images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'images');

-- Allow users to update their own images
CREATE POLICY "Users can update their own images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);