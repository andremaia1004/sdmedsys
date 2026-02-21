export type AppointmentStatus = 'SCHEDULED' | 'CANCELED' | 'COMPLETED' | 'ARRIVED' | 'NO_SHOW';

export interface Appointment {
    id: string;
    clinic_id: string;
    patient_id: string;
    patient_name: string; // Denormalized for MVP simplicity
    doctor_id: string;
    start_time: string | null;
    end_time: string | null;
    status: AppointmentStatus;
    notes: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export type AppointmentInput = Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'clinic_id'>;
