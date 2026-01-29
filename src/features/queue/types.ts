export type QueueStatus = 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'DONE' | 'NO_SHOW' | 'CANCELED';

export interface QueueItem {
    id: string;
    ticketCode: string; // e.g., A001
    appointmentId?: string;
    patientId: string; // Required now, reference to Patient
    doctorId?: string; // Optional if general queue, but keeping linked for MVP
    status: QueueStatus;
    createdAt: string;
    updatedAt: string;
}

export interface QueueItemWithPatient extends QueueItem {
    patientName: string;
}

export interface AuditLog {
    timestamp: string;
    action: string;
    actorRole: string; // 'SECRETARY' | 'DOCTOR'
    itemId: string;
    details?: string;
}
