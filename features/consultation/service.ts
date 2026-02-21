import { Consultation, ConsultationInput } from './types';
import { IConsultationRepository } from './repository.types';
import { SupabaseConsultationRepository } from './repository.supabase';
import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-server';

const getRepository = async (): Promise<IConsultationRepository> => {
    const user = await getCurrentUser();
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000';
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
        const repo = await getRepository();
        return repo.updateStructuredFields(id, fields);
    }

    static async finish(id: string): Promise<void> {
        const repo = await getRepository();

        const consultation = await repo.findById(id);
        if (consultation && consultation.queue_item_id) {
            const supabase = await createClient();

            const { data: queueItem } = await supabase
                .from('queue_items')
                .select('appointment_id')
                .eq('id', consultation.queue_item_id)
                .single();

            if (queueItem?.appointment_id) {
                await supabase
                    .from('appointments')
                    .update({ status: 'COMPLETED' })
                    .eq('id', queueItem.appointment_id);
            }

            const { QueueService } = await import('@/features/queue/service');
            await QueueService.changeStatus(consultation.queue_item_id, 'DONE', 'DOCTOR');
        }

        return repo.finish(id);
    }
}
