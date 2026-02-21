-- Migration: Add clinic_id to patients
-- Needed for RLS and multi-tenancy

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='clinic_id') THEN
        ALTER TABLE patients ADD COLUMN clinic_id UUID;
        
        -- Optional: Set default clinic_id for existing rows if needed
        -- UPDATE patients SET clinic_id = '550e8400-e29b-41d4-a716-446655440000' WHERE clinic_id IS NULL;
    END IF;
END $$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
