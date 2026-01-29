import { Patient, PatientInput } from './types';
import { IPatientsRepository } from './repository.types';
import { MockPatientsRepository } from './repository.mock';
import { SupabasePatientsRepository } from './repository.supabase';
import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-server';

const getRepository = async (): Promise<IPatientsRepository> => {
    const useSupabase = process.env.USE_SUPABASE === 'true';

    if (useSupabase) {
        const user = await getCurrentUser();
        const authMode = process.env.AUTH_MODE || 'stub';

        // default clinic id for all data for now as per requirement
        const defaultClinicId = '550e8400-e29b-41d4-a716-446655440000';
        const clinicId = user?.clinicId || defaultClinicId;

        // If we have a real supabase session, use the authenticated client to respect RLS
        if (authMode === 'supabase' && user) {
            const client = await createClient();
            return new SupabasePatientsRepository(client, clinicId);
        }

        // Fallback to Service Role (e.g., initialization or if auth is stub but DB is supabase)
        return new SupabasePatientsRepository(supabaseServer, clinicId);
    }

    return new MockPatientsRepository();
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
