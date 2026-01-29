-- Migration: Admin Features (Doctors and Clinic Settings) - Fase 4

-- 1. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id), -- Optional link to auth user
    name TEXT NOT NULL,
    specialty TEXT,
    active BOOLEAN DEFAULT TRUE,
    clinic_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clinic Settings Table
CREATE TABLE IF NOT EXISTS clinic_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID UNIQUE NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    clinic_name TEXT NOT NULL DEFAULT 'SDMED Clinic',
    working_hours JSONB DEFAULT '{
        "monday": {"start": "08:00", "end": "18:00"},
        "tuesday": {"start": "08:00", "end": "18:00"},
        "wednesday": {"start": "08:00", "end": "18:00"},
        "thursday": {"start": "08:00", "end": "18:00"},
        "friday": {"start": "08:00", "end": "18:00"},
        "saturday": {"start": "08:00", "end": "12:00"},
        "sunday": null
    }'::jsonb,
    appointment_duration_minutes INTEGER DEFAULT 30,
    queue_prefix TEXT DEFAULT 'A',
    tv_refresh_seconds INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Initial Settings Seed (if not exists)
INSERT INTO clinic_settings (clinic_id, clinic_name)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'SDMED Clinic')
ON CONFLICT (clinic_id) DO NOTHING;

-- 4. RLS - Doctors
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage doctors" ON doctors;
CREATE POLICY "Admins can manage doctors" ON doctors
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'ADMIN'
            AND profiles.clinic_id = doctors.clinic_id
        )
    );

DROP POLICY IF EXISTS "Staff can view active doctors" ON doctors;
CREATE POLICY "Staff can view active doctors" ON doctors
    FOR SELECT TO authenticated
    USING (active = TRUE AND clinic_id = (SELECT clinic_id FROM profiles WHERE id = auth.uid()));

-- 5. RLS - Clinic Settings
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage settings" ON clinic_settings;
CREATE POLICY "Admins can manage settings" ON clinic_settings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'ADMIN'
            AND profiles.clinic_id = clinic_settings.clinic_id
        )
    );

DROP POLICY IF EXISTS "Staff can view settings" ON clinic_settings;
CREATE POLICY "Staff can view settings" ON clinic_settings
    FOR SELECT TO authenticated
    USING (clinic_id = (SELECT clinic_id FROM profiles WHERE id = auth.uid()));

-- 6. Triggers for updated_at
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON clinic_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
