import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { SupabaseClinicalEntryRepository } from './repository.clinical.supabase';

export interface ClinicalSummary {
    diagnosis: string | null;
    conduct: string | null;
    doctorName: string;
    date: string;
}

export class ClinicalSummaryService {
    static async getLatestEntryByPatient(patientId: string): Promise<ClinicalSummary | null> {
        const user = await getCurrentUser();

        // RBAC: SECRETARY returns null (no clinical access)
        if (!user || user.role === 'SECRETARY' || !user.clinicId) {
            return null;
        }

        try {
            const supabase = await createClient();
            const repository = new SupabaseClinicalEntryRepository(supabase, user.clinicId);

            // Fetch most recent entry
            const timeline = await repository.listByPatient(patientId);

            if (!timeline || timeline.length === 0) {
                return null;
            }

            const latest = timeline[0];

            return {
                diagnosis: latest.diagnosis,
                conduct: latest.conduct,
                doctorName: 'Dr. (ID: ' + latest.doctorUserId.substring(0, 5) + ')', // Simplificado
                date: latest.createdAt
            };
        } catch (error) {
            console.error('ClinicalSummaryService.getLatestEntryByPatient error:', error);
            return null;
        }
    }
}
