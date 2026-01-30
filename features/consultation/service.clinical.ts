import { ClinicalEntry, ClinicalEntryInput } from './types';
import { IClinicalEntryRepository } from './repository.clinical.types';
import { SupabaseClinicalEntryRepository } from './repository.clinical.supabase';
import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-server';

const getClinicalRepository = async (): Promise<IClinicalEntryRepository | null> => {
    const useSupabase = process.env.USE_SUPABASE === 'true';

    if (useSupabase) {
        const user = await getCurrentUser();
        const authMode = process.env.AUTH_MODE || 'stub';
        const defaultClinicId = '550e8400-e29b-41d4-a716-446655440000';
        const clinicId = user?.clinicId || defaultClinicId;

        if (authMode === 'supabase' && user) {
            const client = await createClient();
            return new SupabaseClinicalEntryRepository(client, clinicId);
        }

        return new SupabaseClinicalEntryRepository(supabaseServer, clinicId);
    }

    return null; // Mock not implemented for clinical entries yet
};

export class ClinicalEntryService {
    static async listByPatient(patientId: string): Promise<ClinicalEntry[]> {
        const repo = await getClinicalRepository();
        if (!repo) return [];
        return repo.listByPatient(patientId);
    }

    static async findByConsultation(consultationId: string): Promise<ClinicalEntry | null> {
        const repo = await getClinicalRepository();
        if (!repo) return null;
        return repo.findByConsultation(consultationId);
    }

    static async upsert(input: ClinicalEntryInput & { id?: string }): Promise<ClinicalEntry> {
        const repo = await getClinicalRepository();
        if (!repo) throw new Error('Repository not available');

        const user = await getCurrentUser();
        if (!user) throw new Error('Unauthorized');

        // Security: Force clinic ID from session
        const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';

        // Security: Ensure owner is the current user if not provided (though RLS also checks this)
        const doctorUserId = input.doctorUserId || user.id;

        // check if entry exists and is already final
        if (input.id) {
            const existing = await repo.findById(input.id);
            if (existing?.isFinal) {
                throw new Error('Cannot edit a finalized clinical record.');
            }
        }

        return repo.upsert({
            ...input,
            doctorUserId,
            clinicId
        });
    }

    static async finalize(id: string): Promise<ClinicalEntry> {
        const repo = await getClinicalRepository();
        if (!repo) throw new Error('Repository not available');

        const entry = await repo.findById(id);
        if (!entry) throw new Error('Entry not found');

        if (entry.isFinal) return entry;

        return repo.upsert({
            ...entry,
            isFinal: true
        });
    }
}
