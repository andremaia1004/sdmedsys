export type QueueStatus = 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'DONE' | 'NO_SHOW' | 'CANCELED';

export interface QueueItem {
    id: string;
    clinic_id: string;
    ticket_code: string; // e.g., A001
    appointment_id: string | null;
    patient_id: string; // Required now, reference to Patient
    doctor_id: string | null; // Optional if general queue, but keeping linked for MVP
    status: QueueStatus;
    created_at: string | null;
    updated_at: string | null;
}

export interface QueueItemWithPatient extends QueueItem {
    patient_name: string;
    start_time: string | null; // For sorting and display in Ops view
}
