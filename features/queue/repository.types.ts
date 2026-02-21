import { QueueItem, QueueItemWithPatient, QueueStatus } from './types';

export interface IQueueRepository {
    list(doctorId?: string): Promise<QueueItem[]>;
    getTVList(): Promise<Partial<QueueItemWithPatient>[]>;
    add(item: Omit<QueueItem, 'id' | 'created_at' | 'updated_at' | 'ticket_code'>, actorRole: string, prefix?: string): Promise<QueueItem>;
    changeStatus(id: string, newStatus: QueueStatus, actorRole: string): Promise<QueueItem>;
    findById(id: string): Promise<QueueItem | null>;
}
