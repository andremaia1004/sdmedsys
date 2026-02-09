import { Patient, PatientInput } from './types';
import { IPatientsRepository } from './repository.types';
import { MockPatientsRepository } from './repository.mock';
import { SupabasePatientsRepository } from './repository.supabase';
import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-server';

const getRepository = async (): Promise<IPatientsRepository> => {
    // Default to Supabase unless explicitly disabled
    const useSupabase = process.env.USE_SUPABASE !== 'false';
    const authMode = process.env.AUTH_MODE || 'stub';
    const defaultClinicId = '550e8400-e29b-41d4-a716-446655440000';

    if (useSupabase) {
        const user = await getCurrentUser();
        const clinicId = user?.clinicId || defaultClinicId;

        console.log(`[PatientService] Using Supabase Repository (Clinic: ${clinicId}, Auth: ${authMode})`);

        if (authMode === 'supabase' && user) {
            const client = await createClient();
            return new SupabasePatientsRepository(client, clinicId);
        }

        return new SupabasePatientsRepository(supabaseServer, clinicId);
    }

    console.warn('[PatientService] Using Mock Repository (USE_SUPABASE is false)');
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
