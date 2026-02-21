-- Migration: Expand Patient Fields
-- Adds Email, Address, Guardian, Insurance, Complaint, Emergency Contact

DO $$ 
BEGIN 
    -- Email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='email') THEN
        ALTER TABLE patients ADD COLUMN email TEXT;
    END IF;

    -- Address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='address') THEN
        ALTER TABLE patients ADD COLUMN address TEXT;
    END IF;

    -- Guardian Name (Nome do responsável)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='guardian_name') THEN
        ALTER TABLE patients ADD COLUMN guardian_name TEXT;
    END IF;

    -- Insurance (Convênio)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='insurance') THEN
        ALTER TABLE patients ADD COLUMN insurance TEXT;
    END IF;

    -- Main Complaint (Queixa principal)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='main_complaint') THEN
        ALTER TABLE patients ADD COLUMN main_complaint TEXT;
    END IF;

    -- Emergency Contact
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='emergency_contact') THEN
        ALTER TABLE patients ADD COLUMN emergency_contact TEXT;
    END IF;
END $$;

-- Add index for email for faster search
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
