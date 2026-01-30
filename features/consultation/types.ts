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

export type ClinicalEntryInput = Omit<ClinicalEntry, 'id' | 'createdAt' | 'updatedAt' | 'clinicId'>;

export interface Consultation {
    id: string;
    patientId: string;
    doctorId: string; // Legacy ID from doctors table
    queueItemId: string;
    clinicalNotes: string; // DEPRECATED
    startedAt: string;
    finishedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export type ConsultationInput = Pick<Consultation, 'patientId' | 'doctorId' | 'queueItemId'>;
