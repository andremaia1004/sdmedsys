import { Patient, PatientInput } from './types';
import { IPatientsRepository } from './repository.types';
import { SupabasePatientsRepository } from './repository.supabase';
import { getCurrentUser } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase-server';

const getRepository = async (): Promise<IPatientsRepository> => {
    const user = await getCurrentUser();
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000';
    return new SupabasePatientsRepository(supabaseServer, clinicId);
};

export class PatientService {
    static async list(query?: string): Promise<Patient[]> {
        const repo = await getRepository();
        return repo.list(query);
    }

    static async findById(id: string): Promise<Patient | undefined> {
        const repo = await getRepository();
        return repo.findById(id);
    }

    static async create(input: PatientInput): Promise<Patient> {
        const repo = await getRepository();
        return repo.create(input);
    }

    static async update(id: string, input: PatientInput): Promise<Patient | null> {
        const repo = await getRepository();
        return repo.update(id, input);
    }
}
