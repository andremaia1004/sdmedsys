import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClinicalSummaryService } from '../service.summary';
import { getCurrentUser } from '@/lib/session';
import { SupabaseClinicalEntryRepository } from '../repository.clinical.supabase';

// Mock dependencies
vi.mock('@/lib/session');
vi.mock('@/lib/supabase-auth');
vi.mock('../repository.clinical.supabase');

describe('ClinicalSummaryService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null if user is SECRETARY', async () => {
        vi.mocked(getCurrentUser).mockResolvedValue({
            id: 'u1',
            role: 'SECRETARY',
            name: 'Sec',
            clinicId: 'c1'
        });

        const summary = await ClinicalSummaryService.getLatestEntryByPatient('p1');
        expect(summary).toBeNull();
    });

    it('should return latest summary for DOCTOR', async () => {
        vi.mocked(getCurrentUser).mockResolvedValue({
            id: 'u1',
            role: 'DOCTOR',
            name: 'Doc',
            clinicId: 'c1'
        });

        const mockEntry = {
            id: 'e1',
            diagnosis: 'Test Diagnosis',
            conduct: 'Test Conduct',
            doctorUserId: 'doc-123',
            createdAt: '2026-01-30T10:00:00Z',
            // ... other fields
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(SupabaseClinicalEntryRepository.prototype.listByPatient).mockResolvedValue([mockEntry as any]);

        const summary = await ClinicalSummaryService.getLatestEntryByPatient('p1');

        expect(summary).not.toBeNull();
        expect(summary?.diagnosis).toBe('Test Diagnosis');
        expect(summary?.doctorName).toContain('doc-1');
        expect(summary?.date).toBe('2026-01-30T10:00:00Z');
    });

    it('should return null if no clinical entries found', async () => {
        vi.mocked(getCurrentUser).mockResolvedValue({
            id: 'u1',
            role: 'DOCTOR',
            name: 'Doc',
            clinicId: 'c1'
        });

        vi.mocked(SupabaseClinicalEntryRepository.prototype.listByPatient).mockResolvedValue([]);

        const summary = await ClinicalSummaryService.getLatestEntryByPatient('p1');
        expect(summary).toBeNull();
    });
});
