import { Consultation, ConsultationInput } from './types';
import { IConsultationRepository } from './repository.types';
import { MockConsultationRepository } from './repository.mock';
import { SupabaseConsultationRepository } from './repository.supabase';
import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-server';

const getRepository = async (): Promise<IConsultationRepository> => {
    const useSupabase = process.env.USE_SUPABASE === 'true';

    if (useSupabase) {
        const user = await getCurrentUser();
        const authMode = process.env.AUTH_MODE || 'stub';
        const defaultClinicId = '550e8400-e29b-41d4-a716-446655440000';
        const clinicId = user?.clinicId || defaultClinicId;

        if (authMode === 'supabase' && user) {
            const client = await createClient();
            return new SupabaseConsultationRepository(client, clinicId);
        }

        return new SupabaseConsultationRepository(supabaseServer, clinicId);
    }

    return new MockConsultationRepository();
};

export class ConsultationService {
    static async start(input: ConsultationInput): Promise<Consultation> {
        const repo = await getRepository();
        return repo.start(input);
    }

    static async getActiveByDoctor(doctorId: string): Promise<Consultation | undefined> {
        const repo = await getRepository();
        return repo.getActiveByDoctor(doctorId);
    }

    static async findById(id: string): Promise<Consultation | undefined> {
        const repo = await getRepository();
        return repo.findById(id);
    }

    static async updateNotes(id: string, notes: string): Promise<void> {
        const repo = await getRepository();
        return repo.updateNotes(id, notes);
    }

    static async finish(id: string): Promise<void> {
        const repo = await getRepository();
        return repo.finish(id);
    }
}
