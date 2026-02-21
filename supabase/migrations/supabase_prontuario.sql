-- Migration: Structured Clinical Records (Prontuário Estruturado) - Fase 1
-- Evolui 'consultations.clinical_notes' para registros estruturados com histórico.

-- 1. Clinical Entries Table
CREATE TABLE IF NOT EXISTS clinical_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid, -- Alinhado com auth.uid()
    clinic_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    
    chief_complaint TEXT,           -- Queixa principal
    diagnosis TEXT,                 -- Diagnóstico
    conduct TEXT,                   -- Conduta
    observations TEXT,              -- Observações
    free_notes TEXT,                -- Notas livres
    
    is_final BOOLEAN DEFAULT FALSE, -- Registro finalizado
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suporte para migrações parciais anteriores: se existia doctor_id em vez de doctor_user_id, renomeia
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clinical_entries' AND column_name='doctor_id') THEN
        ALTER TABLE clinical_entries RENAME COLUMN doctor_id TO doctor_user_id;
    END IF;

    -- Garante que o campo existe se a tabela já existia sem ele
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clinical_entries' AND column_name='doctor_user_id') THEN
        ALTER TABLE clinical_entries ADD COLUMN doctor_user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;
END $$;

-- 2. Indices for Timeline Performance
CREATE INDEX IF NOT EXISTS idx_clinical_entries_patient_time ON clinical_entries(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_entries_doctor_time ON clinical_entries(doctor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_entries_consultation ON clinical_entries(consultation_id);

-- 3. Data Migration (Preserving History)
-- Migra notas clínicas existentes de consultations para clinical_entries
-- IMPORTANTE: Tenta mapear o doctor_id (text) para o profile_id/auth.uid()
INSERT INTO clinical_entries (consultation_id, patient_id, doctor_user_id, free_notes, created_at, updated_at)
SELECT 
    c.id, 
    c.patient_id, 
    COALESCE(d.profile_id, '00000000-0000-0000-0000-000000000000'::uuid), -- Mapeia para profile_id
    c.clinical_notes, 
    c.created_at, -- Preserva timestamp original
    c.updated_at
FROM consultations c
LEFT JOIN doctors d ON d.id::text = c.doctor_id
WHERE c.clinical_notes IS NOT NULL AND c.clinical_notes != ''
ON CONFLICT DO NOTHING;

-- 4. RLS - Security
ALTER TABLE clinical_entries ENABLE ROW LEVEL SECURITY;

-- 4.1 DOCTOR: Pode Ver registros da mesma clínica e Gerenciar os próprios
DROP POLICY IF EXISTS "Doctors can view all entries in clinic" ON clinical_entries;
CREATE POLICY "Doctors can view all entries in clinic" ON clinical_entries
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'DOCTOR'
            AND profiles.clinic_id = clinical_entries.clinic_id
        )
    );

DROP POLICY IF EXISTS "Doctors can insert own entries" ON clinical_entries;
CREATE POLICY "Doctors can insert own entries" ON clinical_entries
    FOR INSERT TO authenticated
    WITH CHECK (doctor_user_id = auth.uid());

DROP POLICY IF EXISTS "Doctors can update own non-final entries" ON clinical_entries;
CREATE POLICY "Doctors can update own non-final entries" ON clinical_entries
    FOR UPDATE TO authenticated
    USING (doctor_user_id = auth.uid() AND is_final = FALSE)
    WITH CHECK (doctor_user_id = auth.uid() AND is_final IN (TRUE, FALSE)); -- Permite marcar como final, mas não editar se já for final

-- 4.2 ADMIN: Pode ver apenas para auditoria (Leitura)
DROP POLICY IF EXISTS "Admins can view clinical entries for audit" ON clinical_entries;
CREATE POLICY "Admins can view clinical entries for audit" ON clinical_entries
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'ADMIN'
            AND profiles.clinic_id = clinical_entries.clinic_id
        )
    );

-- 4.3 SECRETARY: SEM ACESSO (Omitindo políticas de SELECT para secretária garante negar tudo)

-- 5. Trigger for updated_at
DROP TRIGGER IF EXISTS update_clinical_entries_updated_at ON clinical_entries;
CREATE TRIGGER update_clinical_entries_updated_at 
BEFORE UPDATE ON clinical_entries 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. Comentário de Depreciação
COMMENT ON COLUMN consultations.clinical_notes IS 'DEPRECATED: Use clinical_entries table instead for structured medical records.';
