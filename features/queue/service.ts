import { QueueItem, QueueStatus, QueueItemWithPatient } from './types';
import { IQueueRepository } from './repository.types';
import { MockQueueRepository } from './repository.mock';
import { SupabaseQueueRepository } from './repository.supabase';
import { PatientService } from '../patients/service';

const getRepository = (): IQueueRepository => {
    const useSupabase = process.env.USE_SUPABASE === 'true';

    if (useSupabase) {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.warn('Fallback to Mock (Queue).');
            return new MockQueueRepository();
        }
        return new SupabaseQueueRepository();
    }

    return new MockQueueRepository();
};

export class QueueService {
    static async list(doctorId?: string): Promise<QueueItemWithPatient[]> {
        const items = await getRepository().list(doctorId);

        // Enrich with Patient Data (Decoupled from Repo)
        const enriched: QueueItemWithPatient[] = [];
        for (const item of items) {
            const patient = await PatientService.findById(item.patientId);
            enriched.push({
                ...item,
                patientName: patient ? patient.name : 'Unknown'
            });
        }
        return enriched;
    }

    static async getTVList(): Promise<Partial<QueueItemWithPatient>[]> {
        return getRepository().getTVList();
    }

    static async add(item: Omit<QueueItem, 'id' | 'createdAt' | 'updatedAt' | 'ticketCode'>, actorRole: string): Promise<QueueItem> {
        return getRepository().add(item, actorRole);
    }

    static async changeStatus(id: string, newStatus: QueueStatus, actorRole: string): Promise<QueueItem> {
        return getRepository().changeStatus(id, newStatus, actorRole);
    }
}
