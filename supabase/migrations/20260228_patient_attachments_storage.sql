-- Migration: Storage bucket and RLS policies for patient_attachments
-- The bucket must exist and have policies for authenticated users to upload/read/delete files.

-- Create the bucket if it doesn't exist (private by default)
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient_attachments', 'patient_attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Authenticated users can upload patient attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload patient attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'patient_attachments');

-- Allow authenticated users to read/download files
DROP POLICY IF EXISTS "Authenticated users can view patient attachments" ON storage.objects;
CREATE POLICY "Authenticated users can view patient attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'patient_attachments');

-- Allow authenticated users to delete files
DROP POLICY IF EXISTS "Authenticated users can delete patient attachments" ON storage.objects;
CREATE POLICY "Authenticated users can delete patient attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'patient_attachments');
