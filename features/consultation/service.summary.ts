import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { SupabaseConsultationRepository } from './repository.supabase'; // Use Consultation Repo
import { ClinicalSummary } from './types';

export class ClinicalSummaryService {
    static async getLatestEntryByPatient(patientId: string): Promise<ClinicalSummary | null> {
        const user = await getCurrentUser();

        // RBAC: SECRETARY returns null (no clinical access)
        if (!user || user.role === 'SECRETARY' || !user.clinicId) {
            return null;
        }

        try {
            const supabase = await createClient();
            // Switched to Consultation Repository due to missing clinical_entries schema
            const repository = new SupabaseConsultationRepository(supabase, user.clinicId);

            // Fetch most recent entry
            const timeline = await repository.listByPatient(patientId);

            if (!timeline || timeline.length === 0) {
                return null;
            }

            const latest = timeline[0];

            return {
                diagnosis: null, // Structured diagnosis not available in consultations table yet
                conduct: null,
                doctor_name: 'Dr. (ID: ' + (latest.doctor_id || '').substring(0, 5) + ')',
                date: latest.started_at
            };
        } catch (error) {
            console.error('ClinicalSummaryService.getLatestEntryByPatient error:', error);
            return null;
        }
    }
}
