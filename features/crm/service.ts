import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-server';
import { SupabaseCrmRepository, ICrmRepository } from './repository.supabase';
import { CrmCard, CrmStage } from './types';

const getRepository = async (): Promise<ICrmRepository> => {
    const user = await getCurrentUser();
    const defaultClinicId = '550e8400-e29b-41d4-a716-446655440000';
    const clinicId = user?.clinicId || defaultClinicId;

    if (user) {
        const client = await createClient();
        return new SupabaseCrmRepository(client, clinicId);
    }

    return new SupabaseCrmRepository(supabaseServer, clinicId);
};

export class CrmService {
    static async getBoard(): Promise<CrmCard[]> {
        const repo = await getRepository();
        return repo.getBoard();
    }

    static async moveCard(id: string, stage: CrmStage, position: number): Promise<void> {
        const repo = await getRepository();
        await repo.moveCard(id, stage, position);
    }

    static async updatePositions(updates: { id: string; position: number }[]): Promise<void> {
        const repo = await getRepository();
        await repo.updatePositions(updates);
    }

    static async updateNotes(id: string, notes: string): Promise<void> {
        const repo = await getRepository();
        await repo.updateNotes(id, notes);
    }

    static async upsertPatient(patientId: string, stage: CrmStage, doctorId?: string | null): Promise<void> {
        const repo = await getRepository();
        await repo.upsertPatient(patientId, stage, doctorId);
    }
}
