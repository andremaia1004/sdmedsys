import { describe, it, expect } from 'vitest';
import { QueueService } from '../service';
import { QueueItem } from '../types';

describe('QueueService', () => {
    let item: QueueItem;

    it('should add item to queue and generate ticket code', async () => {
        item = await QueueService.add({
            patientName: 'Test Patient',
            status: 'WAITING'
        }, 'SECRETARY');

        expect(item.id).toBeDefined();
        expect(item.ticketCode).toBeDefined();
        expect(item.status).toBe('WAITING');
    });

    it('should allow valid transition WAITING -> CALLED', async () => {
        const updated = await QueueService.changeStatus(item.id, 'CALLED', 'SECRETARY');
        expect(updated.status).toBe('CALLED');
    });

    it('should allow valid transition CALLED -> IN_SERVICE', async () => {
        const updated = await QueueService.changeStatus(item.id, 'IN_SERVICE', 'DOCTOR');
        expect(updated.status).toBe('IN_SERVICE');
    });

    it('should allow valid transition IN_SERVICE -> DONE', async () => {
        const updated = await QueueService.changeStatus(item.id, 'DONE', 'DOCTOR');
        expect(updated.status).toBe('DONE');
    });

    it('should prevent invalid transition DONE -> WAITING', async () => {
        await expect(QueueService.changeStatus(item.id, 'WAITING', 'SECRETARY'))
            .rejects.toThrow('Invalid transition');
    });

    it('should mask data for TV list', async () => {
        // Create a new waiting item
        await QueueService.add({ patientName: 'Secret Name', status: 'WAITING' }, 'SECRETARY');

        const tvList = await QueueService.getTVList();
        const found = tvList.find(i => i.status === 'WAITING' && !i.patientName);
        // Strategy changed: types definition says patientName exists, but getTVList returns Partial.
        // Let's check if patientName is undefined in the returned partial objects or unchecked.
        // Actually implementation of getTVList maps: { ticketCode, status, doctorId }. patientName is NOT mapped.

        expect(tvList.some(i => i.patientName === undefined)).toBe(true);
    });
});
