import { QueueItem, QueueStatus, AuditLog, QueueItemWithPatient } from './types';
import { PatientService } from '../patients/service';

let MOCK_QUEUE: QueueItem[] = [];
let AUDIT_LOGS: AuditLog[] = [];

export class QueueService {
    // Simple check for valid transitions
    private static isValidTransition(current: QueueStatus, next: QueueStatus): boolean {
        const transitions: Record<QueueStatus, QueueStatus[]> = {
            'WAITING': ['CALLED', 'CANCELED', 'NO_SHOW'],
            'CALLED': ['IN_SERVICE', 'NO_SHOW', 'WAITING'], // WAITING to un-call
            'IN_SERVICE': ['DONE'], // Done finishes it
            'DONE': [], // Terminal
            'NO_SHOW': ['WAITING'], // Can re-queue
            'CANCELED': ['WAITING'] // Can re-queue
        };
        return transitions[current]?.includes(next) ?? false;
    }

    static async list(doctorId?: string): Promise<QueueItemWithPatient[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        let filtered = MOCK_QUEUE.filter(i => !['DONE', 'CANCELED'].includes(i.status));
        if (doctorId) {
            filtered = filtered.filter(i => (i.doctorId === doctorId || !i.doctorId));
        }

        // Enrich with Patient Data
        // In a real app, this would be a JOIN or separate batch fetch
        const enriched: QueueItemWithPatient[] = [];
        for (const item of filtered) {
            const patient = await PatientService.findById(item.patientId);
            enriched.push({
                ...item,
                patientName: patient ? patient.name : 'Unknown'
            });
        }
        return enriched;
    }

    static async getTVList(): Promise<Partial<QueueItemWithPatient>[]> {
        const active = MOCK_QUEUE.filter(i => ['WAITING', 'CALLED', 'IN_SERVICE'].includes(i.status));
        // No name needed for TV per requirements (Ticket Code only), but if we wanted initials:
        return active.map(i => ({
            ticketCode: i.ticketCode,
            status: i.status,
            doctorId: i.doctorId,
        }));
    }

    static async add(item: Omit<QueueItem, 'id' | 'createdAt' | 'updatedAt' | 'ticketCode'>, actorRole: string): Promise<QueueItem> {
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

    static async changeStatus(id: string, newStatus: QueueStatus, actorRole: string): Promise<QueueItem> {
        const index = MOCK_QUEUE.findIndex(q => q.id === id);
        if (index === -1) throw new Error('Item not found');

        const item = MOCK_QUEUE[index];

        if (!this.isValidTransition(item.status, newStatus)) {
            throw new Error(`Invalid transition from ${item.status} to ${newStatus}`);
        }

        // Business Rule: Can't CALL if another is already CALLED/IN_SERVICE for same doctor?
        // MVP simplification: Allow multiple for now, or strict check could be added here.

        MOCK_QUEUE[index] = {
            ...item,
            status: newStatus,
            updatedAt: new Date().toISOString()
        };

        this.logAudit('CHANGE_STATUS', actorRole, id, `Changed to ${newStatus}`);
        return MOCK_QUEUE[index];
    }

    private static logAudit(action: string, role: string, itemId: string, details?: string) {
        AUDIT_LOGS.push({
            timestamp: new Date().toISOString(),
            action,
            actorRole: role,
            itemId,
            details
        });
        // console.log(`[AUDIT] ${new Date().toISOString()} | ${role} | ${action} | ${itemId} | ${details}`);
    }
}
