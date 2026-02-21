import { describe, it, expect } from 'vitest';
import { AppointmentService } from '../service';
import { AppointmentInput } from '../types';

describe('AppointmentService', () => {
    const doctorId = 'doc1';

    it('should create an appointment if no conflict', async () => {
        const input: AppointmentInput = {
            patient_id: 'p1',
            patient_name: 'John Test',
            doctor_id: 'd1',
            start_time: '2025-01-01T10:00:00Z',
            end_time: '2025-01-01T10:30:00Z',
            status: 'SCHEDULED',
            notes: null
        };
        const appt = await AppointmentService.create(input);
        expect(appt.id).toBeDefined();
    });

    it('should detect conflict for overlapping time', async () => {
        const input: AppointmentInput = {
            patient_id: 'p2',
            doctor_id: 'd1',
            patient_name: 'Another Patient',
            start_time: '2026-01-29T10:15:00', // Overlaps with 10:00-10:30
            end_time: '2026-01-29T10:45:00',
            status: 'SCHEDULED',
            notes: null
        };

        await expect(AppointmentService.create(input)).rejects.toThrow('Conflito de horário');
    });

    it('should allow adjacent appointments', async () => {
        const input: AppointmentInput = {
            patient_id: 'p3',
            doctor_id: 'd1',
            patient_name: 'Patient 3',
            start_time: '2026-01-29T10:30:00', // Starts exactly when previous ends
            end_time: '2026-01-29T11:00:00',
            status: 'SCHEDULED',
            notes: null
        };

        await expect(AppointmentService.create(input)).resolves.toBeDefined();
    });
});
