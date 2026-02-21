export type CrmStage =
    | 'lead'
    | 'scheduled'
    | 'in_treatment'
    | 'pending_return'
    | 'awaiting_exams'
    | 'inactive';

export interface PatientCrmStage {
    id: string;
    clinic_id: string;
    patient_id: string;
    stage: CrmStage;
    doctor_id?: string | null;
    notes?: string | null;
    position: number;
    moved_at: string;
    created_at: string;
    updated_at: string;
}

export interface CrmCard extends PatientCrmStage {
    patient_name: string;
    patient_phone?: string | null;
    doctor_name?: string | null;
}
