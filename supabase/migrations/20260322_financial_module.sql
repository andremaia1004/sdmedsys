-- Migration: Financial Module (Entradas & Saídas)
-- Phase: Financial v1
-- Tables: financial_services, financial_transactions

-- ============================================================
-- 1. financial_services — Service catalog with default prices
-- ============================================================
CREATE TABLE IF NOT EXISTS financial_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('CONSULTATION', 'PROCEDURE', 'EXAM', 'OTHER')) DEFAULT 'CONSULTATION',
    default_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (default_price >= 0),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. financial_transactions — Income & Expense ledger
-- ============================================================
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',

    -- Type & category
    type TEXT CHECK (type IN ('INCOME', 'EXPENSE')) NOT NULL,
    category TEXT CHECK (category IN (
        -- Income
        'CONSULTATION', 'PROCEDURE', 'EXAM', 'OTHER_INCOME',
        -- Expense
        'SALARY', 'RENT', 'UTILITIES', 'SUPPLIES', 'EQUIPMENT', 'MARKETING', 'OTHER_EXPENSE'
    )) NOT NULL,

    -- Core fields
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT CHECK (payment_method IN (
        'CASH', 'CARD_CREDIT', 'CARD_DEBIT', 'PIX', 'INSURANCE', 'BANK_TRANSFER', 'CHECK'
    )),
    status TEXT CHECK (status IN ('PENDING', 'PAID', 'CANCELED')) DEFAULT 'PENDING',

    -- Date references
    competency_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_at TIMESTAMPTZ,

    -- Clinical links (optional, for INCOME tied to clinical operations)
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    financial_service_id UUID REFERENCES financial_services(id) ON DELETE SET NULL,

    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_financial_services_clinic_id ON financial_services(clinic_id);
CREATE INDEX IF NOT EXISTS idx_financial_services_active ON financial_services(clinic_id, active);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_clinic_id ON financial_transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(clinic_id, type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_competency ON financial_transactions(clinic_id, competency_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_consultation ON financial_transactions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_patient ON financial_transactions(patient_id);

-- ============================================================
-- 4. updated_at triggers
-- ============================================================
CREATE TRIGGER update_financial_services_updated_at
    BEFORE UPDATE ON financial_services
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at
    BEFORE UPDATE ON financial_transactions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- 5. Row Level Security
-- ============================================================
ALTER TABLE financial_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- financial_services: Admins manage, authenticated staff can view active
DROP POLICY IF EXISTS "Admins manage financial services" ON financial_services;
CREATE POLICY "Admins manage financial services" ON financial_services
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
            AND profiles.clinic_id = financial_services.clinic_id
        )
    );

DROP POLICY IF EXISTS "Staff view active financial services" ON financial_services;
CREATE POLICY "Staff view active financial services" ON financial_services
    FOR SELECT TO authenticated
    USING (
        active = TRUE
        AND clinic_id = (SELECT clinic_id FROM profiles WHERE id = auth.uid())
    );

-- financial_transactions: Admins + Secretaries manage within clinic
DROP POLICY IF EXISTS "Admins manage financial transactions" ON financial_transactions;
CREATE POLICY "Admins manage financial transactions" ON financial_transactions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
            AND profiles.clinic_id = financial_transactions.clinic_id
        )
    );

DROP POLICY IF EXISTS "Secretaries manage financial transactions" ON financial_transactions;
CREATE POLICY "Secretaries manage financial transactions" ON financial_transactions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('SECRETARY', 'ADMIN')
            AND profiles.clinic_id = financial_transactions.clinic_id
        )
    );

-- ============================================================
-- 6. Default service catalog seed
-- ============================================================
INSERT INTO financial_services (clinic_id, name, category, default_price)
VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'Consulta Clínica Geral', 'CONSULTATION', 150.00),
    ('550e8400-e29b-41d4-a716-446655440000', 'Consulta de Retorno', 'CONSULTATION', 80.00),
    ('550e8400-e29b-41d4-a716-446655440000', 'Eletrocardiograma (ECG)', 'EXAM', 60.00),
    ('550e8400-e29b-41d4-a716-446655440000', 'Curativo Simples', 'PROCEDURE', 40.00),
    ('550e8400-e29b-41d4-a716-446655440000', 'Aferição de Pressão', 'PROCEDURE', 20.00)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. Audit log
-- ============================================================
INSERT INTO audit_logs (action, actor_role, details)
VALUES ('MIGRATION', 'SYSTEM', 'Created financial_services and financial_transactions tables with RLS and seed data');
