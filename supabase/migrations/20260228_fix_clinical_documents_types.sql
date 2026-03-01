-- Migration: Fix clinical_documents CHECK constraint to include all document types
-- Previously only allowed: 'prescription', 'certificate', 'report'
-- Now includes: 'exam_request', 'referral'

ALTER TABLE public.clinical_documents
    DROP CONSTRAINT IF EXISTS clinical_documents_type_check;

ALTER TABLE public.clinical_documents
    ADD CONSTRAINT clinical_documents_type_check
    CHECK (type IN ('prescription', 'certificate', 'report', 'exam_request', 'referral'));
