import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClinicalDocumentService } from '../service.documents';
import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';

// Mock dependencies
vi.mock('@/lib/session');
vi.mock('@/lib/supabase-auth');
vi.mock('@/lib/audit');

describe('ClinicalDocumentService (RBAC)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should deny access to SECRETARY', async () => {
        vi.mocked(getCurrentUser).mockResolvedValue({
            id: 'sec-1',
            role: 'SECRETARY',
            name: 'Secretary',
            clinicId: 'c1'
        });

        const data = await ClinicalDocumentService.getDocumentData('cons-1');
        expect(data).toBeNull();
    });

    it('should allow DOCTOR only if owner', async () => {
        vi.mocked(getCurrentUser).mockResolvedValue({
            id: 'doc-1',
            role: 'DOCTOR',
            name: 'Dr. House',
            clinicId: 'c1'
        });

        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: {
                    id: 'cons-1',
                    doctor_user_id: 'doc-2', // Different doctor
                    clinic_id: 'c1',
                    clinical_entries: [{}],
                    patients: {},
                    clinic_settings: {}
                },
                error: null
            })
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

        const data = await ClinicalDocumentService.getDocumentData('cons-1');
        expect(data).toBeNull(); // Should be null because doc-1 !== doc-2
    });

    it('should allow ADMIN to access any consultation in their clinic', async () => {
        vi.mocked(getCurrentUser).mockResolvedValue({
            id: 'admin-1',
            role: 'ADMIN',
            name: 'Admin',
            clinicId: 'c1'
        });

        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: {
                    id: 'cons-1',
                    doctor_user_id: 'doc-2',
                    clinic_id: 'c1',
                    clinical_entries: [{ conduct: 'Prescription text' }],
                    patients: { name: 'Patient X' },
                    clinic_settings: { clinic_name: 'SDMED' }
                },
                error: null
            })
        };

        vi.mocked(createClient).mockResolvedValue(mockSupabase as any); // eslint-disable-line @typescript-eslint/no-explicit-any

        const data = await ClinicalDocumentService.getDocumentData('cons-1');
        expect(data).not.toBeNull();
        expect(data?.patient.name).toBe('Patient X');
    });
});
