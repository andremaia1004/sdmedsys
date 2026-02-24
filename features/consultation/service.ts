import { Consultation, ConsultationInput } from './types';
import { IConsultationRepository } from './repository.types';
import { SupabaseConsultationRepository } from './repository.supabase';
import { getCurrentUser, requireRole } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-server';

const getRepository = async (): Promise<IConsultationRepository> => {
    const user = await getCurrentUser();
    const defaultClinicId = '550e8400-e29b-41d4-a716-446655440000';
    const clinicId = user?.clinicId || defaultClinicId;

    // Diagnostic: Use service role client to bypass potential SSR client hangs
    return new SupabaseConsultationRepository(supabaseServer, clinicId);
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

    static async updateStructuredFields(id: string, fields: Partial<Pick<Consultation, 'chief_complaint' | 'diagnosis' | 'conduct'>>): Promise<void> {
        const { id: userId } = await requireRole(['DOCTOR']);
        const repo = await getRepository();
        return repo.updateStructuredFields(id, fields, userId);
    }

    static async finish(id: string): Promise<void> {
        console.log('DEBUG: ConsultationService.finish - start', id);
        const { id: userId } = await requireRole(['DOCTOR']);
        console.log('DEBUG: ConsultationService.finish - userId', userId);
        const repo = await getRepository();

        const consultation = await repo.findById(id);
        if (consultation && consultation.queue_item_id) {
            console.log('DEBUG: ConsultationService.finish - updating queue item', consultation.queue_item_id);
            // Use service role client for direct updates to avoid SSR hangs
            const { data: queueItem } = await supabaseServer
                .from('queue_items')
                .select('appointment_id')
                .eq('id', consultation.queue_item_id)
                .single();

            if (queueItem?.appointment_id) {
                console.log('DEBUG: ConsultationService.finish - updating appointment', queueItem.appointment_id);
                await supabaseServer
                    .from('appointments')
                    .update({ status: 'COMPLETED' })
                    .eq('id', queueItem.appointment_id);
            }

            const { QueueService } = await import('@/features/queue/service');
            await QueueService.changeStatus(consultation.queue_item_id, 'DONE', 'DOCTOR', userId);
            console.log('DEBUG: ConsultationService.finish - queue status changed');
        }

        console.log('DEBUG: ConsultationService.finish - finalizing repo');
        const res = await repo.finish(id, userId);
        console.log('DEBUG: ConsultationService.finish - success');
        return res;
    }
}
