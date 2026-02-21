export interface ClinicalEntry {
    id: string;
    consultation_id: string | null;
    patient_id: string;
    doctor_user_id: string;
    clinic_id: string;
    chief_complaint: string | null;
    diagnosis: string | null;
    conduct: string | null;
    observations: string | null;
    free_notes: string | null;
    is_final: boolean;
    created_at: string;
    updated_at: string;
}

export interface ClinicalSummary {
    diagnosis: string | null;
    conduct: string | null;
    doctor_name: string;
    date: string;
}

export type ClinicalEntryInput = Omit<ClinicalEntry, 'id' | 'created_at' | 'updated_at' | 'clinic_id'>;

export interface Consultation {
    id: string;
    clinic_id: string;
    patient_id: string;
    doctor_id: string; // Legacy ID from doctors table
    queue_item_id: string;
    chief_complaint: string | null;
    diagnosis: string | null;
    conduct: string | null;
    is_final?: boolean;
    started_at: string;
    finished_at: string | null;
    created_at: string;
    updated_at: string;
}

export type ConsultationInput = Pick<Consultation, 'patient_id' | 'doctor_id' | 'queue_item_id'>;
