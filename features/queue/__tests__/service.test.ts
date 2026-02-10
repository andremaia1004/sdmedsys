import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueueService } from '../service';
import { QueueItem } from '../types';

// Mock dependencies
vi.mock('@/lib/session', () => ({
    getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/audit', () => ({
    logAudit: vi.fn(),
}));

import { getCurrentUser } from '@/lib/session';
import { logAudit } from '@/lib/audit';

describe('QueueService', () => {
    let item: QueueItem;
    const doctorId = 'dr-123';

    beforeEach(() => {
        vi.clearAllMocks();
        (getCurrentUser as any).mockResolvedValue({ id: doctorId, role: 'DOCTOR' });
    });

    it('should add item to queue and generate ticket code', async () => {
        item = await QueueService.add({
            patientId: 'test-patient-id',
            doctorId: doctorId,
            status: 'WAITING',
            sourceType: 'SCHEDULED'
        }, 'SECRETARY');

        expect(item.id).toBeDefined();
        expect(item.ticketCode).toBeDefined();
        expect(item.status).toBe('WAITING');
    });

    it('should allow valid transition WAITING -> CALLED', async () => {
        const updated = await QueueService.changeStatus(item.id, 'CALLED', 'SECRETARY');
        expect(updated.status).toBe('CALLED');
        expect(logAudit).toHaveBeenCalledWith('STATUS_CHANGE', 'QUEUE_ITEM', item.id, expect.anything());
    });

    it('should permit transition CALLED -> IN_SERVICE for assigned doctor', async () => {
        const updated = await QueueService.changeStatus(item.id, 'IN_SERVICE', 'DOCTOR');
        expect(updated.status).toBe('IN_SERVICE');
    });

    it('should block transition CALLED -> IN_SERVICE for different doctor', async () => {
        // Mock different user
        (getCurrentUser as any).mockResolvedValue({ id: 'other-dr', role: 'DOCTOR' });

        // Create new item for other doctor
        const otherItem = await QueueService.add({
            patientId: 'pt-2',
            doctorId: doctorId, // Assigned to dr-123
            status: 'CALLED',
            sourceType: 'WALKIN'
        }, 'SECRETARY');

        await expect(QueueService.changeStatus(otherItem.id, 'IN_SERVICE', 'DOCTOR'))
            .rejects.toThrow('Apenas o médico designado');
    });

    it('should allow transition CALLED -> IN_SERVICE if ADMIN regardless of assignment', async () => {
        (getCurrentUser as any).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });

        const otherItem = await QueueService.add({
            patientId: 'pt-3',
            doctorId: doctorId,
            status: 'CALLED',
            sourceType: 'WALKIN'
        }, 'SECRETARY');

        const updated = await QueueService.changeStatus(otherItem.id, 'IN_SERVICE', 'ADMIN');
        expect(updated.status).toBe('IN_SERVICE');
    });

    it('should prevent invalid transition DONE -> WAITING', async () => {
        // Need a DONE item
        const doneItem = await QueueService.add({ patientId: 'pt-4', status: 'DONE' }, 'DOCTOR');
        await expect(QueueService.changeStatus(doneItem.id, 'WAITING', 'SECRETARY'))
            .rejects.toThrow('Transição inválida');
    });
});
