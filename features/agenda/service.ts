import { Appointment, AppointmentInput, AppointmentStatus } from './types';
import { IAppointmentsRepository } from './repository.types';
import { SupabaseAppointmentsRepository } from './repository.supabase';
import { getCurrentUser } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase-server';

const getRepository = async (): Promise<IAppointmentsRepository> => {
    const user = await getCurrentUser();
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000';
    return new SupabaseAppointmentsRepository(supabaseServer, clinicId);
};

export class AppointmentService {
    static async create(input: AppointmentInput): Promise<Appointment> {
        const repo = await getRepository();

        if (input.start_time && input.end_time) {
            const hasConflict = await repo.checkConflict(input.doctor_id, input.start_time, input.end_time);
            if (hasConflict) {
                throw new Error('Conflito de horário para este profissional.');
            }
        }
        return repo.create(input);
    }

    static async list(doctorId?: string, startRange?: string, endRange?: string): Promise<Appointment[]> {
        const repo = await getRepository();
        return repo.list(doctorId, startRange, endRange);
    }

    static async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment | null> {
        const repo = await getRepository();
        return repo.updateStatus(id, status);
    }

    static async checkConflict(doctorId: string, startTime: string, endTime: string): Promise<boolean> {
        const repo = await getRepository();
        return repo.checkConflict(doctorId, startTime, endTime);
    }
}
