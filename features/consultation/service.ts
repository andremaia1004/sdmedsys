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

    static async listByPatient(patientId: string): Promise<Consultation[]> {
        const repo = await getRepository();
        return repo.listByPatient(patientId);
    }

    static async countByPatient(patientId: string): Promise<number> {
        const repo = await getRepository();
        return repo.countByPatient(patientId);
    }

    static async updateStructuredFields(id: string, fields: Partial<Pick<Consultation, 'chiefComplaint' | 'physicalExam' | 'diagnosis' | 'conduct'>>): Promise<void> {
        const repo = await getRepository();
        return repo.updateStructuredFields(id, fields);
    }

    static async finish(id: string): Promise<void> {
        const repo = await getRepository();

        // 1. Fetch consultation to get queue_item_id
        const consultation = await repo.findById(id);
        if (consultation && consultation.queueItemId) {
            const supabase = await createClient();

            // 2. Get appointment_id from queue_item
            const { data: queueItem } = await supabase
                .from('queue_items')
                .select('appointment_id')
                .eq('id', consultation.queueItemId)
                .single();

            if (queueItem?.appointment_id) {
                // 3. Update appointment status
                await supabase
                    .from('appointments')
                    .update({ status: 'COMPLETED' })
                    .eq('id', queueItem.appointment_id);
            }

            // 4. Update Queue Status to DONE (Atomic transition)
            const { QueueService } = await import('@/features/queue/service');
            await QueueService.changeStatus(consultation.queueItemId, 'DONE', 'DOCTOR');
        }

        return repo.finish(id);
    }
}
