-- Migration: Add clinic_id for Single-Clinic Isolation (Fase 2)
-- Using a fixed UUID for the default clinic to ensure all existing data is grouped together.

DO $$ 
BEGIN
    -- 1. Update Profiles to use a fixed default clinic ID
    ALTER TABLE profiles ALTER COLUMN clinic_id SET DEFAULT '550e8400-e29b-41d4-a716-446655440000';
    UPDATE profiles SET clinic_id = '550e8400-e29b-41d4-a716-446655440000' WHERE clinic_id IS NULL;
    ALTER TABLE profiles ALTER COLUMN clinic_id SET NOT NULL;

    -- 2. Add clinic_id to Patients
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='clinic_id') THEN
        ALTER TABLE patients ADD COLUMN clinic_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000';
    END IF;

    -- 3. Add clinic_id to Appointments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='clinic_id') THEN
        ALTER TABLE appointments ADD COLUMN clinic_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000';
    END IF;

    -- 4. Add clinic_id to Queue Items
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='queue_items' AND column_name='clinic_id') THEN
        ALTER TABLE queue_items ADD COLUMN clinic_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000';
    END IF;

    -- 5. Add clinic_id to Consultations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultations' AND column_name='clinic_id') THEN
        ALTER TABLE consultations ADD COLUMN clinic_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000';
    END IF;

END $$;
