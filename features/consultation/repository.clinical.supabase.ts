import { SupabaseClient } from '@supabase/supabase-js';
import { ClinicalEntry, ClinicalEntryInput } from './types';
import { IClinicalEntryRepository } from './repository.clinical.types';

export class SupabaseClinicalEntryRepository implements IClinicalEntryRepository {
    constructor(
        private supabase: SupabaseClient,
        private clinicId: string
    ) { }

    async listByPatient(patientId: string, options?: {
        limit?: number;
        offset?: number;
        startDate?: string;
        endDate?: string;
        doctorId?: string;
    }): Promise<{ data: ClinicalEntry[]; total: number; hasMore: boolean }> {
        const limit = options?.limit || 20;
        const offset = options?.offset || 0;

        let query = this.supabase
            .from('clinical_entries')
            .select('*', { count: 'exact' })
            .eq('patient_id', patientId)
            .eq('clinic_id', this.clinicId); // Enforcement

        if (options?.doctorId) {
            query = query.eq('doctor_user_id', options.doctorId);
        }

        if (options?.startDate) {
            query = query.gte('created_at', options.startDate);
        }

        if (options?.endDate) {
            query = query.lte('created_at', options.endDate);
        }

        const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Supabase Error (listByPatient):', error);
            return { data: [], total: 0, hasMore: false };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedData = (data || []).map((d: any) => this.mapToClinicalEntry(d));
        const total = count || 0;
        const hasMore = total > (offset + mappedData.length);

        return { data: mappedData, total, hasMore };
    }

    async findById(id: string): Promise<ClinicalEntry | null> {
        const { data, error } = await this.supabase
            .from('clinical_entries')
            .select('*')
            .eq('id', id)
            .eq('clinic_id', this.clinicId)
            .maybeSingle();

        if (error) {
            console.error('Supabase Error (findById):', error);
            return null;
        }

        return data ? this.mapToClinicalEntry(data) : null;
    }

    async findByConsultation(consultationId: string): Promise<ClinicalEntry | null> {
        const { data, error } = await this.supabase
            .from('clinical_entries')
            .select('*')
            .eq('consultation_id', consultationId)
            .eq('clinic_id', this.clinicId)
            .maybeSingle();

        if (error) {
            console.error('Supabase Error (findByConsultation):', error);
            return null;
        }

        return data ? this.mapToClinicalEntry(data) : null;
    }

    async upsert(input: ClinicalEntryInput & { id?: string, clinic_id: string }): Promise<ClinicalEntry> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
            consultation_id: input.consultation_id,
            patient_id: input.patient_id,
            doctor_user_id: input.doctor_user_id,
            clinic_id: input.clinic_id,
            chief_complaint: input.chief_complaint,
            diagnosis: input.diagnosis,
            conduct: input.conduct,
            observations: input.observations,
            free_notes: input.free_notes,
            is_final: input.is_final,
            updated_at: new Date().toISOString()
        };

        if (input.id) {
            payload.id = input.id;
        }

        const { data, error } = await this.supabase
            .from('clinical_entries')
            .upsert(payload)
            .select()
            .single();

        if (error) {
            console.error('Supabase Error (upsert clinical_entry):', error);
            throw new Error(error.message || 'Failed to safe clinical entry');
        }

        return this.mapToClinicalEntry(data);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapToClinicalEntry(row: any): ClinicalEntry {
        return {
            id: row.id,
            consultation_id: row.consultation_id,
            patient_id: row.patient_id,
            doctor_user_id: row.doctor_user_id,
            clinic_id: row.clinic_id,
            chief_complaint: row.chief_complaint,
            diagnosis: row.diagnosis,
            conduct: row.conduct,
            observations: row.observations,
            free_notes: row.free_notes,
            is_final: row.is_final,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
}
