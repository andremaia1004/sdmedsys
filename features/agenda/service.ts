import { Appointment, AppointmentInput, AppointmentStatus } from './types';
import { IAppointmentsRepository } from './repository.types';
import { MockAppointmentsRepository } from './repository.mock';
import { SupabaseAppointmentsRepository } from './repository.supabase';

const getRepository = (): IAppointmentsRepository => {
    const useSupabase = process.env.USE_SUPABASE === 'true';

    if (useSupabase) {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.warn('USE_SUPABASE is true, but credentials are missing. Falling back to Mock.');
            return new MockAppointmentsRepository();
        }
        return new SupabaseAppointmentsRepository();
    }

    return new MockAppointmentsRepository();
};

export class AppointmentService {
    static async checkConflict(doctorId: string, startTime: string, endTime: string): Promise<boolean> {
        return getRepository().checkConflict(doctorId, startTime, endTime);
    }

    static async create(input: AppointmentInput): Promise<Appointment> {
        // Enforce conflict check before creation
        const hasConflict = await this.checkConflict(input.doctorId, input.startTime, input.endTime);
        if (hasConflict) {
            throw new Error('Conflict detected: Time slot is not available.');
        }

        return getRepository().create(input);
    }

    static async list(doctorId?: string, startRange?: string, endRange?: string): Promise<Appointment[]> {
        return getRepository().list(doctorId, startRange, endRange);
    }

    static async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment | null> {
        return getRepository().updateStatus(id, status);
    }
}
