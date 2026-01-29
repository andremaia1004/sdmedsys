import { Consultation, ConsultationInput } from './types';
import { QueueService } from '@/features/queue/service';
import { IConsultationRepository } from './repository.types';
import { MockConsultationRepository } from './repository.mock';
import { SupabaseConsultationRepository } from './repository.supabase';

const getRepository = (): IConsultationRepository => {
    const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';

    if (useSupabase) {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.warn('Fallback to Mock (Consultation).');
            return new MockConsultationRepository();
        }
        return new SupabaseConsultationRepository();
    }

    return new MockConsultationRepository();
};

export class ConsultationService {
    static async start(input: ConsultationInput): Promise<Consultation> {
        // Validation could go here (e.g. check if doc already has active)
        return getRepository().start(input);
    }

    static async getActiveByDoctor(doctorId: string): Promise<Consultation | undefined> {
        return getRepository().getActiveByDoctor(doctorId);
    }

    static async getById(id: string): Promise<Consultation | undefined> {
        return getRepository().findById(id);
    }

    static async updateNotes(id: string, notes: string, doctorId: string): Promise<void> {
        const consultation = await this.getById(id);
        if (!consultation) throw new Error('Consultation not found');
        if (consultation.doctorId !== doctorId) throw new Error('Unauthorized');

        await getRepository().updateNotes(id, notes);
    }

    static async finish(id: string, doctorId: string): Promise<void> {
        const consultation = await this.getById(id);
        if (!consultation) throw new Error('Consultation not found');
        if (consultation.doctorId !== doctorId) throw new Error('Unauthorized');

        await getRepository().finish(id);

        // Update Queue status to DONE
        // In a real microservice architecture, this might be an event. 
        // Here we explicitly call the other service.
        try {
            if (consultation.queueItemId) {
                await QueueService.changeStatus(consultation.queueItemId, 'DONE', 'DOCTOR');
            }
        } catch (e) {
            console.error("Failed to update queue status during finish", e);
            // We don't rollback finish here for MVP, but ideally we should transactionalize.
        }
    }
}
