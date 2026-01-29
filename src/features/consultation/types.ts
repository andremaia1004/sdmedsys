export interface Consultation {
    id: string;
    patientId: string;
    doctorId: string;
    queueItemId: string;
    clinicalNotes: string;
    startedAt: string;
    finishedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export type ConsultationInput = Pick<Consultation, 'patientId' | 'doctorId' | 'queueItemId'>;
