-- Create Clinical Documents Table
CREATE TABLE IF NOT EXISTS public.clinical_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL, -- Multi-tenancy
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    consultation_id UUID REFERENCES public.consultations(id), -- Nullable if issued outside flow (future proof)
    doctor_id UUID NOT NULL REFERENCES public.doctors(id), -- The doctor who signed
    type TEXT NOT NULL CHECK (type IN ('prescription', 'certificate')),
    issued_at TIMESTAMPTZ DEFAULT now(),
    meta JSONB DEFAULT '{}'::jsonb, -- Store extra info like 'days', 'cid' for certificates
    created_by UUID REFERENCES auth.users(id), -- The user who clicked the button (might be same as doctor)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clinical_documents ENABLE ROW LEVEL SECURITY;

-- Indexes for frequent queries (Patient History)
CREATE INDEX IF NOT EXISTS idx_clinical_documents_patient_id ON public.clinical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_clinic_id ON public.clinical_documents(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_issued_at ON public.clinical_documents(issued_at DESC);

-- RLS Policies

-- Policy for SELECT (Read)
-- ADMIN: Can view all documents in their clinic
CREATE POLICY "Admins can view clinical documents of their clinic"
ON public.clinical_documents
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
        AND profiles.clinic_id = clinical_documents.clinic_id
    )
);

-- DOCTOR: Can view all documents in their clinic (Standard logic: Doctors share patient records in a clinic)
-- Alternatively, restrict to 'created_by' or 'doctor_id', but usually History is shared.
-- User requirement: "DOCTOR vê apenas registros da própria clínica"
CREATE POLICY "Doctors can view clinical documents of their clinic"
ON public.clinical_documents
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'DOCTOR'
        AND profiles.clinic_id = clinical_documents.clinic_id
    )
);

-- SECRETARY: NO SELECT POLICY (Implicitly Denied)

-- Policy for INSERT (Create)
-- DOCTOR and ADMIN can insert
CREATE POLICY "Doctors and Admins can create clinical documents"
ON public.clinical_documents
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('DOCTOR', 'ADMIN')
        AND profiles.clinic_id = clinic_id
    )
);

-- NO UPDATE/DELETE Policies (Immutable History for v1)
