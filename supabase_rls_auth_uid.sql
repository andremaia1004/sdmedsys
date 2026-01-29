-- Migration: Advanced RLS Policies based on auth.uid() and Roles (Fase 2)

-- Helper function to get current user's profile info from JWT/Profiles table
-- This reduces subquery repetitions in policies.
CREATE OR REPLACE FUNCTION get_my_role() RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_clinic() RETURNS UUID AS $$
  SELECT clinic_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. PATIENTS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clinic workers can view patients" ON patients;
CREATE POLICY "Clinic workers can view patients" ON patients
    FOR SELECT TO authenticated
    USING (clinic_id = get_my_clinic());

DROP POLICY IF EXISTS "Admins and Secretaries can manage patients" ON patients;
CREATE POLICY "Admins and Secretaries can manage patients" ON patients
    FOR ALL TO authenticated
    USING (clinic_id = get_my_clinic() AND get_my_role() IN ('ADMIN', 'SECRETARY'));


-- 2. APPOINTMENTS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view appointments" ON appointments;
CREATE POLICY "Staff can view appointments" ON appointments
    FOR SELECT TO authenticated
    USING (
        clinic_id = get_my_clinic() AND (
            get_my_role() IN ('ADMIN', 'SECRETARY') OR
            (get_my_role() = 'DOCTOR' AND doctor_id = auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Staff can manage appointments" ON appointments;
CREATE POLICY "Staff can manage appointments" ON appointments
    FOR ALL TO authenticated
    USING (clinic_id = get_my_clinic() AND get_my_role() IN ('ADMIN', 'SECRETARY'));


-- 3. QUEUE ITEMS
ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clinic workers can view queue" ON queue_items;
CREATE POLICY "Clinic workers can view queue" ON queue_items
    FOR SELECT TO authenticated
    USING (clinic_id = get_my_clinic());

DROP POLICY IF EXISTS "Secretaries can manage queue" ON queue_items;
CREATE POLICY "Secretaries can manage queue" ON queue_items
    FOR ALL TO authenticated
    USING (clinic_id = get_my_clinic() AND get_my_role() IN ('ADMIN', 'SECRETARY'));

DROP POLICY IF EXISTS "Doctors can update own queue item status" ON queue_items;
CREATE POLICY "Doctors can update own queue item status" ON queue_items
    FOR UPDATE TO authenticated
    USING (clinic_id = get_my_clinic() AND get_my_role() = 'DOCTOR' AND doctor_id = auth.uid()::text)
    WITH CHECK (status IN ('IN_SERVICE', 'DONE'));


-- 4. CONSULTATIONS
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and Doctors can view consultations" ON consultations;
CREATE POLICY "Admins and Doctors can view consultations" ON consultations
    FOR SELECT TO authenticated
    USING (
        clinic_id = get_my_clinic() AND (
            get_my_role() = 'ADMIN' OR
            (get_my_role() = 'DOCTOR' AND doctor_id = auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Doctors can manage own consultations" ON consultations;
CREATE POLICY "Doctors can manage own consultations" ON consultations
    FOR INSERT TO authenticated
    WITH CHECK (clinic_id = get_my_clinic() AND get_my_role() = 'DOCTOR' AND doctor_id = auth.uid()::text);

CREATE POLICY "Doctors can update own consultations" ON consultations
    FOR UPDATE TO authenticated
    USING (clinic_id = get_my_clinic() AND get_my_role() = 'DOCTOR' AND doctor_id = auth.uid()::text);

-- Note: SECRETARY is implicitly denied by not being in any policy for 'consultations'.
