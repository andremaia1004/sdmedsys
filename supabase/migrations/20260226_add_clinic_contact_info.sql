-- Migration: Add clinic contact info and logo to clinic_settings
-- This migration adds optional fields to clinic_settings for PDF generation

ALTER TABLE clinic_settings 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Create Storage Bucket for clinic assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('clinic_assets', 'clinic_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for clinic_assets
-- Everyone can read the public assets (like logos)
DROP POLICY IF EXISTS "Public can view clinic assets" ON storage.objects;
CREATE POLICY "Public can view clinic assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'clinic_assets');

-- Only Admins can upload to clinic_assets (we check role in profiles)
DROP POLICY IF EXISTS "Admins can upload clinic assets" ON storage.objects;
CREATE POLICY "Admins can upload clinic assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'clinic_assets' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'ADMIN'
  )
);

-- Only Admins can update/delete clinic_assets
DROP POLICY IF EXISTS "Admins can update clinic assets" ON storage.objects;
CREATE POLICY "Admins can update clinic assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'clinic_assets' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'ADMIN'
  )
);

DROP POLICY IF EXISTS "Admins can delete clinic assets" ON storage.objects;
CREATE POLICY "Admins can delete clinic assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'clinic_assets' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'ADMIN'
  )
);
