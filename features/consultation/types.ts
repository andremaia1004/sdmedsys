export interface ClinicalEntry {
    id: string;
    consultationId: string | null;
    patientId: string;
    doctorUserId: string;
    clinicId: string;
    chiefComplaint: string | null;
    diagnosis: string | null;
    conduct: string | null;
    observations: string | null;
    freeNotes: string | null;
    isFinal: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ClinicalSummary {
    diagnosis: string | null;
    conduct: string | null;
    doctorName: string;
    date: string;
}

export type ClinicalEntryInput = Omit<ClinicalEntry, 'id' | 'createdAt' | 'updatedAt' | 'clinicId'>;

export interface Consultation {
    id: string;
    patientId: string;
    doctorId: string; // Legacy ID from doctors table
    queueItemId: string;
    clinicalNotes: string; // DEPRECATED - Use structured fields
    chiefComplaint: string | null;
    physicalExam: string | null;
    diagnosis: string | null;
    conduct: string | null;
    isFinal?: boolean;
    startedAt: string;
    finishedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export type ConsultationInput = Pick<Consultation, 'patientId' | 'doctorId' | 'queueItemId'>;
