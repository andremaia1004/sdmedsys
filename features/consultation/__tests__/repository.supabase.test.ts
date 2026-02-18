
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseConsultationRepository } from '../repository.supabase';

describe('SupabaseConsultationRepository', () => {
    let repo: SupabaseConsultationRepository;
    const clinicId = 'clinic-123';

    // Mock Builder
    const mockBuilder = {
        eq: vi.fn(),
        update: vi.fn(),
        then: vi.fn() // Make it thenable
    };

    const mockSupabase = {
        from: vi.fn(() => ({
            update: vi.fn(() => mockBuilder),
        })),
    } as any;

    beforeEach(() => {
        vi.clearAllMocks();
        repo = new SupabaseConsultationRepository(mockSupabase, clinicId);

        // Setup default chain
        mockBuilder.eq.mockReturnValue(mockBuilder);
    });

    it('should throw error if updateStructuredFields affects 0 rows', async () => {
        // Mock the resolved value
        mockBuilder.then.mockImplementation((resolve) => resolve({ error: null, count: 0 }));

        await expect(repo.updateStructuredFields('id-1', { diagnosis: 'Test' }))
            .rejects.toThrow('Consultation not found or access denied');
    });

    it('should throw error if finish affects 0 rows', async () => {
        mockBuilder.then.mockImplementation((resolve) => resolve({ error: null, count: 0 }));

        await expect(repo.finish('id-1'))
            .rejects.toThrow('Consultation not found or access denied');
    });

    it('should succeed if updateStructuredFields affects 1 row', async () => {
        mockBuilder.then.mockImplementation((resolve) => resolve({ error: null, count: 1 }));

        await expect(repo.updateStructuredFields('id-1', { diagnosis: 'Test' }))
            .resolves.not.toThrow();
    });
});
