import { QueueItem, QueueItemWithPatient, QueueStatus } from './types';

export interface IQueueRepository {
    list(doctorId?: string): Promise<QueueItem[]>;
    getTVList(): Promise<Partial<QueueItemWithPatient>[]>;
    add(item: Omit<QueueItem, 'id' | 'createdAt' | 'updatedAt' | 'ticketCode'>, actorRole: string): Promise<QueueItem>;
    changeStatus(id: string, newStatus: QueueStatus, actorRole: string): Promise<QueueItem>;
}
