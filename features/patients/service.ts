import { Patient, PatientInput } from './types';
import { IPatientsRepository } from './repository.types';
import { MockPatientsRepository } from './repository.mock';
import { SupabasePatientsRepository } from './repository.supabase';

// Helper to select repository
// In a real app, this might be a Dependency Injection container
const getRepository = (): IPatientsRepository => {
    // Check feature flag - controlled server-side
    const useSupabase = process.env.USE_SUPABASE === 'true';

    // Fallback if Supabase credentials are missing even if flag is true (prevent runtime crash)
    if (useSupabase) {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.warn('USE_SUPABASE is true, but credentials are missing. Falling back to Mock.');
            return new MockPatientsRepository();
        }
        return new SupabasePatientsRepository();
    }

    return new MockPatientsRepository();
};

export class PatientService {
    static async list(query?: string): Promise<Patient[]> {
        return getRepository().list(query);
    }

    static async findById(id: string): Promise<Patient | undefined> {
        return getRepository().findById(id);
    }

    static async create(input: PatientInput): Promise<Patient> {
        return getRepository().create(input);
    }

    static async update(id: string, input: PatientInput): Promise<Patient | null> {
        return getRepository().update(id, input);
    }
}
