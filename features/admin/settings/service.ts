import { ClinicSettings } from './types';
import { ISettingsRepository } from './repository.types';
import { SupabaseSettingsRepository } from './repository.supabase';
import { getCurrentUser } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase-server';

const getRepository = async (): Promise<ISettingsRepository> => {
    const user = await getCurrentUser();
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000';
    return new SupabaseSettingsRepository(supabaseServer, clinicId);
};

export class SettingsService {
    static async get(): Promise<ClinicSettings> {
        try {
            const repo = await getRepository();
            const settings = await repo.get();

            if (settings) return settings;
        } catch (e) {
            console.warn('SettingsService: Failed to fetch settings, using defaults.', e);
        }

        return {
            id: 'default',
            clinicId: 'default',
            clinicName: 'SDMED SYS',
            workingHours: {},
            appointmentDurationMinutes: 30,
            queuePrefix: 'A',
            tvRefreshSeconds: 30,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    static async update(input: Partial<ClinicSettings>): Promise<ClinicSettings> {
        const repo = await getRepository();
        return repo.update(input);
    }
}
