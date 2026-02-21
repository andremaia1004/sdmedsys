export type ClinicalDocumentType = 'prescription' | 'certificate' | 'report' | 'referral' | 'exam_request';

export interface ClinicalDocument {
    id: string;
    clinicId: string;
    patientId: string;
    consultationId: string | null;
    doctorId: string;
    doctorName?: string; // Added for UI
    type: ClinicalDocumentType;
    issuedAt: string;
    meta: Record<string, unknown>;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export type CreateClinicalDocumentInput = Omit<ClinicalDocument, 'id' | 'createdAt' | 'updatedAt'>;
