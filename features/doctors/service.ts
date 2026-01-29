import { Doctor, DoctorInput } from './types';
import { IDoctorsRepository } from './repository.types';
import { SupabaseDoctorsRepository } from './repository.supabase';
import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-server';

const getRepository = async (): Promise<IDoctorsRepository> => {
    const useSupabase = process.env.USE_SUPABASE === 'true';

    if (useSupabase) {
        const user = await getCurrentUser();
        const authMode = process.env.AUTH_MODE || 'stub';
        const defaultClinicId = '550e8400-e29b-41d4-a716-446655440000';
        const clinicId = user?.clinicId || defaultClinicId;

        if (authMode === 'supabase' && user) {
            const client = await createClient();
            return new SupabaseDoctorsRepository(client, clinicId);
        }

        return new SupabaseDoctorsRepository(supabaseServer, clinicId);
    }

    // Mock not implemented for Doctors yet, fallback to Supabase with Service Role if flag is off but we need it?
    // Actually, let's just return Supabase with Service Role as ultimate fallback if flag is true.
    // If flag is FALSE, we might need a MockDoctorsRepository. For now, let's keep it simple.
    throw new Error('MockDoctorsRepository not implemented');
};

export class DoctorService {
    static async list(activeOnly: boolean = true): Promise<Doctor[]> {
        const repo = await getRepository();
        return repo.list(activeOnly);
    }

    static async findById(id: string): Promise<Doctor | undefined> {
        const repo = await getRepository();
        return repo.findById(id);
    }

    static async create(input: DoctorInput): Promise<Doctor> {
        const repo = await getRepository();
        return repo.create(input);
    }

    static async update(id: string, input: Partial<Doctor>): Promise<Doctor | null> {
        const repo = await getRepository();
        return repo.update(id, input);
    }
}
