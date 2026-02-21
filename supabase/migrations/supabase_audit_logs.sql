-- Migration: Implement Audit Logs System (Fase 3)

-- 1. Create or Update Audit Logs table
-- Using a more structured schema for traceability
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    role TEXT,
    action TEXT NOT NULL, -- e.g., 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'
    entity TEXT NOT NULL, -- e.g., 'PATIENT', 'APPOINTMENT', 'QUEUE', 'CONSULTATION'
    entity_id TEXT,       -- ID of the affected record
    clinic_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional non-sensitive context
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance Indices
CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic_id ON audit_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- 3. RLS - Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only ADMIN can see audit logs of their own clinic
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'ADMIN'
            AND profiles.clinic_id = audit_logs.clinic_id
        )
    );

-- Audit logs should be INSERT-only from the server side (Service Role)
-- No INSERT policy for 'authenticated' or 'anon' to prevent log tampering from the frontend.
-- The Service Role automatically bypasses RLS.
