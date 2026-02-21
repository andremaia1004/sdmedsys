import { Doctor, DoctorInput } from './types';
import { IDoctorsRepository } from './repository.types';
import { SupabaseDoctorsRepository } from './repository.supabase';
import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-server';

const getRepository = async (): Promise<IDoctorsRepository> => {
    const user = await getCurrentUser();
    const defaultClinicId = '550e8400-e29b-41d4-a716-446655440000';
    const clinicId = user?.clinicId || defaultClinicId;

    if (user) {
        const client = await createClient();
        return new SupabaseDoctorsRepository(client, clinicId);
    }

    return new SupabaseDoctorsRepository(supabaseServer, clinicId);
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
