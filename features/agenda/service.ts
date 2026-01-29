import { Appointment, AppointmentInput, AppointmentStatus } from './types';
import { IAppointmentsRepository } from './repository.types';
import { MockAppointmentsRepository } from './repository.mock';
import { SupabaseAppointmentsRepository } from './repository.supabase';
import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-server';

const getRepository = async (): Promise<IAppointmentsRepository> => {
    const useSupabase = process.env.USE_SUPABASE === 'true';

    if (useSupabase) {
        const user = await getCurrentUser();
        const authMode = process.env.AUTH_MODE || 'stub';
        const defaultClinicId = '550e8400-e29b-41d4-a716-446655440000';
        const clinicId = user?.clinicId || defaultClinicId;

        if (authMode === 'supabase' && user) {
            const client = await createClient();
            return new SupabaseAppointmentsRepository(client, clinicId);
        }

        return new SupabaseAppointmentsRepository(supabaseServer, clinicId);
    }

    return new MockAppointmentsRepository();
};

export class AppointmentService {
    static async create(input: AppointmentInput): Promise<Appointment> {
        const repo = await getRepository();
        const hasConflict = await repo.checkConflict(input.doctorId, input.startTime, input.endTime);
        if (hasConflict) {
            throw new Error('Conflito de horário para este profissional.');
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
