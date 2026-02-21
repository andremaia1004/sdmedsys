-- Migration: Advanced Doctor Fields - Phase 2
-- Adds CRM, Phone, and Email to the doctors table and ensures data consistency.

-- 1. Add new columns to 'doctors' table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='crm') THEN
        ALTER TABLE doctors ADD COLUMN crm TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='phone') THEN
        ALTER TABLE doctors ADD COLUMN phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='email') THEN
        ALTER TABLE doctors ADD COLUMN email TEXT;
    END IF;
END $$;

-- 2. Add indices for better searching
CREATE INDEX IF NOT EXISTS idx_doctors_crm ON doctors(crm);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);

-- 3. (Optional) Sync emails for existing linked doctors
-- This updates the local 'email' in the 'doctors' table with the one from 'profiles'
UPDATE doctors d
SET email = p.email
FROM profiles p
WHERE d.profile_id = p.id
AND d.email IS NULL;

-- 4. Audit Log for the Migration
INSERT INTO audit_logs (action, details)
VALUES ('MIGRATION', 'Updated doctors table with CRM, Phone, and Email columns');
