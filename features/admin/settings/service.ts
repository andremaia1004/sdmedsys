import { ClinicSettings } from './types';
import { ISettingsRepository } from './repository.types';
import { SupabaseSettingsRepository } from './repository.supabase';
import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-server';

const getRepository = async (): Promise<ISettingsRepository> => {
    const useSupabase = process.env.USE_SUPABASE === 'true';

    if (useSupabase) {
        const user = await getCurrentUser();
        const authMode = process.env.AUTH_MODE || 'stub';
        const defaultClinicId = '550e8400-e29b-41d4-a716-446655440000';
        const clinicId = user?.clinicId || defaultClinicId;

        if (authMode === 'supabase' && user) {
            const client = await createClient();
            return new SupabaseSettingsRepository(client, clinicId);
        }

        return new SupabaseSettingsRepository(supabaseServer, clinicId);
    }

    throw new Error('MockSettingsRepository not implemented');
};

export class SettingsService {
    static async get(): Promise<ClinicSettings> {
        const repo = await getRepository();
        return repo.get();
    }

    static async update(input: Partial<ClinicSettings>): Promise<ClinicSettings> {
        const repo = await getRepository();
        return repo.update(input);
    }
}
