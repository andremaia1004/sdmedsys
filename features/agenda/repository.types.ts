import { Appointment, AppointmentInput, AppointmentStatus } from './types';

export interface IAppointmentsRepository {
    create(input: AppointmentInput): Promise<Appointment>;
    list(doctorId?: string, startRange?: string, endRange?: string): Promise<Appointment[]>;
    checkConflict(doctorId: string, startTime: string, endTime: string): Promise<boolean>;
    updateStatus(id: string, status: AppointmentStatus): Promise<Appointment | null>;
}
