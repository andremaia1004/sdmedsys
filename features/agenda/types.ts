export type AppointmentStatus = 'SCHEDULED' | 'CANCELED' | 'COMPLETED' | 'ARRIVED' | 'NO_SHOW';

export type AppointmentKind = 'SCHEDULED' | 'WALK_IN';

export interface Appointment {
    id: string;
    patientId: string;
    patientName: string; // Denormalized for MVP simplicity
    doctorId: string;
    startTime?: string; // Optional for WALK_IN
    endTime?: string; // Optional for WALK_IN
    status: AppointmentStatus;
    kind: AppointmentKind;
    notes?: string;
}

export type AppointmentInput = Omit<Appointment, 'id'>;
