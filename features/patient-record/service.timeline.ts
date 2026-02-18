import { TimelineEvent, TimelineFilters, TimelineResponse } from './types';
import { supabaseServer } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/session';

export class PatientTimelineService {
    static async getClinicalTimeline(
        patientId: string,
        page: number = 1,
        limit: number = 20,
        filters?: TimelineFilters
    ): Promise<TimelineResponse> {
        const user = await getCurrentUser();
        // RBAC: strict clinic_id check via session
        const clinicId = user?.clinicId;

        if (!clinicId) {
            throw new Error('Unauthorized: No clinic context');
        }

        // Calculate offset
        const offset = (page - 1) * limit;

        // Fetch Consultations
        const consultationsPromise = this.fetchConsultations(patientId, clinicId, limit + 1, offset, filters);

        // Fetch Clinical Entries (if separate table)
        const entriesPromise = this.fetchClinicalEntries(patientId, clinicId, limit + 1, offset, filters);

        const [consultations, entries] = await Promise.all([consultationsPromise, entriesPromise]);

        // Merge and Sort
        const allEvents = [...consultations, ...entries].sort((a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        );

        // Pagination Logic (Slice)
        // Note: Simple slice for now. Real pagination with mixed sources needs cursor or larger buffer.
        // We take 'limit' items.
        const slicedData = allEvents.slice(0, limit);
        const hasMore = allEvents.length > limit;

        return {
            data: slicedData,
            total: consultations.length + entries.length, // Approximation of FETCHED total, not DB total
            hasMore
        };
    }

    private static async fetchConsultations(
        patientId: string,
        clinicId: string,
        limit: number,
        offset: number,
        filters?: TimelineFilters
    ): Promise<TimelineEvent[]> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query: any = supabaseServer
            .from('consultations')
            .select('id, created_at, doctor_id, status')
            .eq('patient_id', patientId)
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (filters?.doctorId) {
            query = query.eq('doctor_id', filters.doctorId);
        }
        if (filters?.startDate) {
            query = query.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
            query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching consultations for timeline:', error);
            return [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((row: any) => ({
            id: row.id,
            eventType: 'CONSULTATION',
            occurredAt: row.created_at,
            doctorUserId: row.doctor_id,
            title: 'Consulta Médica',
            summary: `Status: ${row.status || 'Concluída'}`,
            link: `/consultations/${row.id}` // Link to consultation details
        }));
    }

    private static async fetchClinicalEntries(
        patientId: string,
        clinicId: string,
        limit: number,
        offset: number,
        filters?: TimelineFilters
    ): Promise<TimelineEvent[]> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query: any = supabaseServer
            .from('clinical_entries')
            .select('id, created_at, doctor_user_id, chief_complaint, diagnosis')
            .eq('patient_id', patientId)
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (filters?.doctorId) {
            query = query.eq('doctor_user_id', filters.doctorId);
        }
        if (filters?.startDate) {
            query = query.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
            query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching clinical entries for timeline:', error);
            return [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((row: any) => ({
            id: row.id,
            eventType: 'ENTRY',
            occurredAt: row.created_at,
            doctorUserId: row.doctor_user_id,
            title: 'Evolução Clínica',
            summary: [row.chief_complaint, row.diagnosis].filter(Boolean).join(' - ') || 'Sem detalhes',
            link: undefined // Entries might be viewed in a modal or parent consultation
        }));
    }
}
