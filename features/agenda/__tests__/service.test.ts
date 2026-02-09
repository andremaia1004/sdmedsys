import { describe, it, expect } from 'vitest';
import { AppointmentService } from '../service';
import { AppointmentInput } from '../types';

describe('AppointmentService', () => {
    const doctorId = 'doc1';

    it('should create an appointment if no conflict', async () => {
        const input: AppointmentInput = {
            doctorId,
            patientId: 'p1',
            patientName: 'Test Patient',
            startTime: '2026-01-29T10:00:00',
            endTime: '2026-01-29T10:30:00',
            status: 'SCHEDULED'
        };
        const appt = await AppointmentService.create(input);
        expect(appt.id).toBeDefined();
    });

    it('should detect conflict for overlapping time', async () => {
        const input: AppointmentInput = {
            doctorId,
            patientId: 'p2',
            patientName: 'Another Patient',
            startTime: '2026-01-29T10:15:00', // Overlaps with 10:00-10:30
            endTime: '2026-01-29T10:45:00',
            status: 'SCHEDULED'
        };

        await expect(AppointmentService.create(input)).rejects.toThrow('Conflito de horário');
    });

    it('should allow adjacent appointments', async () => {
        const input: AppointmentInput = {
            doctorId,
            patientId: 'p3',
            patientName: 'Patient 3',
            startTime: '2026-01-29T10:30:00', // Starts exactly when previous ends
            endTime: '2026-01-29T11:00:00',
            status: 'SCHEDULED'
        };

        await expect(AppointmentService.create(input)).resolves.toBeDefined();
    });
});
