-- Migration: Patient Attachments (Anexos do Paciente)
-- Support for external documents with category-based access control.

CREATE TABLE IF NOT EXISTS public.patient_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL, -- Multi-tenancy
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    category TEXT NOT NULL CHECK (category IN ('ADMIN', 'CLINICAL')),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in Storage
    file_type TEXT, -- e.g. 'application/pdf', 'image/jpeg'
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_attachments ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_attachments_patient_id ON public.patient_attachments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_attachments_clinic_id ON public.patient_attachments(clinic_id);

-- RLS Policies

-- ADMIN/DOCTOR: Full access to everything in their clinic
CREATE POLICY "Medical staff can manage all attachments"
ON public.patient_attachments
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'DOCTOR')
        AND profiles.clinic_id = patient_attachments.clinic_id
    )
);

-- SECRETARY: Select/Insert only for ADMIN category
CREATE POLICY "Secretaries can view/add admin attachments"
ON public.patient_attachments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'SECRETARY'
        AND profiles.clinic_id = patient_attachments.clinic_id
        AND category = 'ADMIN'
    )
);

CREATE POLICY "Secretaries can insert admin attachments"
ON public.patient_attachments
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'SECRETARY'
        AND profiles.clinic_id = clinic_id
        AND category = 'ADMIN'
    )
);

-- DELETE denied for SECRETARY (no policy means denied)
