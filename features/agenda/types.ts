export type AppointmentStatus = 'SCHEDULED' | 'CANCELED' | 'COMPLETED' | 'ARRIVED' | 'NO_SHOW';

export interface Appointment {
    id: string;
    patientId: string;
    patientName: string; // Denormalized for MVP simplicity
    doctorId: string;
    startTime: string; // ISO
    endTime: string; // ISO
    status: AppointmentStatus;
    notes?: string;
}

export type AppointmentInput = Omit<Appointment, 'id'>;
