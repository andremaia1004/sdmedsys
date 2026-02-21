/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PatientTimelineService } from '../service.timeline';
import { supabaseServer } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/session';

// Mock dependencies
vi.mock('@/lib/supabase-server', () => ({
    supabaseServer: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
    }
}));

vi.mock('@/lib/session', () => ({
    getCurrentUser: vi.fn()
}));

describe('PatientTimelineService', () => {
    const mockClinicId = '550e8400-e29b-41d4-a716-446655440000';
    const mockUser = { id: 'doc1', role: 'DOCTOR', clinicId: mockClinicId };

    beforeEach(() => {
        vi.resetAllMocks();
        (getCurrentUser as any).mockResolvedValue(mockUser);
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should throw if no clinic context', async () => {
        (getCurrentUser as any).mockResolvedValue({ id: 'user', clinicId: null });
        await expect(PatientTimelineService.getClinicalTimeline('p1'))
            .rejects.toThrow('Unauthorized: No clinic context');
    });

    it('should fetch and merge consultations and entries', async () => {
        // Mock Consultation Data
        const mockConsultations = [
            { id: 'c1', created_at: '2026-02-18T10:00:00Z', doctor_id: 'doc1', status: 'FINISHED' }
        ];

        // Mock Entries Data
        const mockEntries = [
            { id: 'e1', created_at: '2026-02-18T11:00:00Z', doctor_user_id: 'doc1', chief_complaint: 'Pain', diagnosis: 'Flu' }
        ];

        // Setup chain mocks
        const queryMock = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockReturnThis(),
            then: vi.fn() // For await
        };

        // We need to implement the specific return values for the two separate calls
        // This is tricky with a shared mock. 
        // Strategy: Mock the `range` promise resolution based on the table name accessed?
        // Actually, `supabaseServer.from` is the entry point.

        const fromMock = supabaseServer.from as any;
        fromMock.mockImplementation((table: string) => {
            const chain = { ...queryMock };
            if (table === 'consultations') {
                chain.then = vi.fn().mockImplementation((resolve: any) => resolve({ data: mockConsultations, error: null }));
            } else if (table === 'clinical_entries') {
                chain.then = vi.fn().mockImplementation((resolve: any) => resolve({ data: mockEntries, error: null }));
            }
            return chain;
        });

        const result = await PatientTimelineService.getClinicalTimeline('p1');

        expect(result.data).toHaveLength(2);
        expect(result.total).toBe(2);

        // Check Sorting (Entries at 11:00 should be before Consultations at 10:00)
        expect(result.data[0].id).toBe('e1');
        expect(result.data[0].eventType).toBe('ENTRY');
        expect(result.data[1].id).toBe('c1');
        expect(result.data[1].eventType).toBe('CONSULTATION');
    });
});
