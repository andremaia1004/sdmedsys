
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseClinicalEntryRepository } from '../repository.clinical.supabase';

// Mock Supabase Client
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();

const mockSupabase = {
    from: vi.fn(() => ({
        select: mockSelect,
    })),
} as any;

describe('SupabaseClinicalEntryRepository', () => {
    let repo: SupabaseClinicalEntryRepository;
    const clinicId = 'clinic-123';
    const patientId = 'patient-456';

    beforeEach(() => {
        vi.clearAllMocks();
        repo = new SupabaseClinicalEntryRepository(mockSupabase, clinicId);

        // Setup chainable mocks
        mockSelect.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ eq: mockEq, gte: mockGte, lte: mockLte, order: mockOrder }); // Chainable
        mockGte.mockReturnValue({ lte: mockLte, order: mockOrder });
        mockLte.mockReturnValue({ order: mockOrder });
        mockOrder.mockReturnValue({ range: mockRange });
    });

    it('should list entries with pagination and clinic_id enforcement', async () => {
        const mockData = [{ id: '1' }, { id: '2' }];
        mockRange.mockResolvedValue({ data: mockData, count: 10, error: null });

        const result = await repo.listByPatient(patientId, { limit: 2, offset: 0 });

        expect(mockSupabase.from).toHaveBeenCalledWith('clinical_entries');
        expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact' });
        // Enforce clinic_id
        expect(mockEq).toHaveBeenCalledWith('clinic_id', clinicId);
        expect(mockEq).toHaveBeenCalledWith('patient_id', patientId);

        expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(mockRange).toHaveBeenCalledWith(0, 1); // offset 0, limit 2 -> range(0, 1)

        expect(result.data).toHaveLength(2);
        expect(result.total).toBe(10);
        expect(result.hasMore).toBe(true); // 10 > 0 + 2
    });

    it('should apply doctor filter', async () => {
        const doctorId = 'doc-789';
        mockRange.mockResolvedValue({ data: [], count: 0, error: null });

        await repo.listByPatient(patientId, { doctorId });

        expect(mockEq).toHaveBeenCalledWith('doctor_user_id', doctorId);
    });

    it('should apply date filters', async () => {
        const startDate = '2023-01-01';
        const endDate = '2023-12-31';
        mockRange.mockResolvedValue({ data: [], count: 0, error: null });

        await repo.listByPatient(patientId, { startDate, endDate });

        expect(mockGte).toHaveBeenCalledWith('created_at', startDate);
        expect(mockLte).toHaveBeenCalledWith('created_at', endDate);
    });

    it('should return empty on error', async () => {
        mockRange.mockResolvedValue({ data: null, count: null, error: { message: 'DB Error' } });

        const result = await repo.listByPatient(patientId);

        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        expect(result.hasMore).toBe(false);
    });

    it('should calculate hasMore correctly', async () => {
        // Total 5, request 2, offset 4 (so 4, 5 returned? No range is inclusive logic)
        // range(offset, offset + limit - 1)
        // offset 4, limit 2 -> range(4, 5) -> returns 2 items if exists
        // total 5. offset 4 + 2 (returned) = 6 > 5? No.

        // Let's test boundary
        mockRange.mockResolvedValue({ data: [{ id: '5' }], count: 5, error: null });

        const result = await repo.listByPatient(patientId, { limit: 2, offset: 4 });

        // offset 4 + data 1 = 5. total 5. hasMore = 5 > 5 = false.
        expect(result.hasMore).toBe(false);
    });
});
