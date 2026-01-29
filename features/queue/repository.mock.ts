import { QueueItem, QueueItemWithPatient, QueueStatus, AuditLog } from './types';
import { IQueueRepository } from './repository.types';
import { PatientService } from '../patients/service';

let MOCK_QUEUE: QueueItem[] = [];
let AUDIT_LOGS: AuditLog[] = [];

export class MockQueueRepository implements IQueueRepository {
    private isValidTransition(current: QueueStatus, next: QueueStatus): boolean {
        const transitions: Record<QueueStatus, QueueStatus[]> = {
            'WAITING': ['CALLED', 'CANCELED', 'NO_SHOW'],
            'CALLED': ['IN_SERVICE', 'NO_SHOW', 'WAITING'],
            'IN_SERVICE': ['DONE'],
            'DONE': [],
            'NO_SHOW': ['WAITING'],
            'CANCELED': ['WAITING']
        };
        return transitions[current]?.includes(next) ?? false;
    }

    async list(doctorId?: string): Promise<QueueItem[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        let filtered = MOCK_QUEUE.filter(i => !['DONE', 'CANCELED'].includes(i.status));
        if (doctorId) {
            filtered = filtered.filter(i => (i.doctorId === doctorId || !i.doctorId));
        }
        return filtered;
    }

    async getTVList(): Promise<Partial<QueueItemWithPatient>[]> {
        const active = MOCK_QUEUE.filter(i => ['WAITING', 'CALLED', 'IN_SERVICE'].includes(i.status));
        return active.map(i => ({
            ticketCode: i.ticketCode,
            status: i.status,
            doctorId: i.doctorId,
        }));
    }

    async add(item: Omit<QueueItem, 'id' | 'createdAt' | 'updatedAt' | 'ticketCode'>, actorRole: string): Promise<QueueItem> {
        const code = `A${(MOCK_QUEUE.length + 1).toString().padStart(3, '0')}`;
        const newItem: QueueItem = {
            ...item,
            id: Math.random().toString(36).substring(7),
            ticketCode: code,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        MOCK_QUEUE.push(newItem);
        this.logAudit('ADD', actorRole, newItem.id, `Added ticket ${code} for patient ${item.patientId}`);
        return newItem;
    }

    async changeStatus(id: string, newStatus: QueueStatus, actorRole: string): Promise<QueueItem> {
        const index = MOCK_QUEUE.findIndex(q => q.id === id);
        if (index === -1) throw new Error('Item not found');

        const item = MOCK_QUEUE[index];

        if (!this.isValidTransition(item.status, newStatus)) {
            throw new Error(`Invalid transition from ${item.status} to ${newStatus}`);
        }

        MOCK_QUEUE[index] = {
            ...item,
            status: newStatus,
            updatedAt: new Date().toISOString()
        };

        this.logAudit('CHANGE_STATUS', actorRole, id, `Changed to ${newStatus}`);
        return MOCK_QUEUE[index];
    }

    private logAudit(action: string, role: string, itemId: string, details?: string) {
        AUDIT_LOGS.push({
            timestamp: new Date().toISOString(),
            action,
            actorRole: role,
            itemId,
            details
        });
    }
}
