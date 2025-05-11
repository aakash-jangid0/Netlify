-- Create a storage bucket for staff photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'staff-photos', 'staff-photos', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'staff-photos'
);

-- Set up storage policy to allow authenticated users to upload files to the staff-photos bucket
CREATE POLICY "Staff Photos Upload Policy" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'staff-photos' AND 
    (auth.uid() IN (SELECT user_id FROM public.staff WHERE role IN ('admin', 'manager')) OR 
     auth.uid() = (SELECT user_id FROM public.staff WHERE id::text = (storage.foldername(name))[1]))
  );

-- Set up policy to allow anyone to view staff photos (since they may be displayed publicly on the site)
CREATE POLICY "Staff Photos Public Access Policy" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'staff-photos');

-- Allow staff members to update their own photos
CREATE POLICY "Staff Photos Update Policy" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'staff-photos' AND
    (auth.uid() IN (SELECT user_id FROM public.staff WHERE role IN ('admin', 'manager')) OR
     auth.uid() = (SELECT user_id FROM public.staff WHERE id::text = (storage.foldername(name))[1]))
  );

-- Allow staff members to delete their own photos
CREATE POLICY "Staff Photos Delete Policy" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'staff-photos' AND
    (auth.uid() IN (SELECT user_id FROM public.staff WHERE role IN ('admin', 'manager')) OR
     auth.uid() = (SELECT user_id FROM public.staff WHERE id::text = (storage.foldername(name))[1]))
  );
