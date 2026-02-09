-- Migration: Add clinic_id to core tables and fix RLS (CORRECTED)

-- 1. Add columns using a DO block for safety, but with LITERAL values to avoid 0A000 error
DO $$
BEGIN
    -- Patients
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'clinic_id') THEN
        ALTER TABLE patients ADD COLUMN clinic_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000';
    END IF;

    -- Appointments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'clinic_id') THEN
        ALTER TABLE appointments ADD COLUMN clinic_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000';
    END IF;

    -- Queue Items
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'queue_items' AND column_name = 'clinic_id') THEN
        ALTER TABLE queue_items ADD COLUMN clinic_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000';
    END IF;

    -- Consultations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'clinic_id') THEN
        ALTER TABLE consultations ADD COLUMN clinic_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000';
    END IF;
END $$;

-- 2. Update Helper Functions
CREATE OR REPLACE FUNCTION get_my_role() RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_clinic() RETURNS UUID AS $$
  SELECT clinic_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Fix RLS Policy for Appointments (Doctors visibility)
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Staff can view appointments" ON appointments;
DROP POLICY IF EXISTS "Staff can manage appointments" ON appointments;

-- Re-create policies with correct Clinic ID and Doctor Logic
CREATE POLICY "Staff can view appointments" ON appointments
    FOR SELECT TO authenticated
    USING (
        clinic_id = get_my_clinic() AND (
            get_my_role() IN ('ADMIN', 'SECRETARY') OR
            (
                get_my_role() = 'DOCTOR' AND 
                -- Check if the appointment's doctor_id matches one of the IDs associated with this auth user (profile_id)
                doctor_id IN (SELECT id::text FROM doctors WHERE profile_id = auth.uid())
            )
        )
    );

CREATE POLICY "Staff can manage appointments" ON appointments
    FOR ALL TO authenticated
    USING (clinic_id = get_my_clinic() AND get_my_role() IN ('ADMIN', 'SECRETARY'));
