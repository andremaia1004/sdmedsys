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

    async upsert(input: ClinicalEntryInput & { id?: string, clinicId: string }): Promise<ClinicalEntry> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
            consultation_id: input.consultationId,
            patient_id: input.patientId,
            doctor_user_id: input.doctorUserId,
            clinic_id: input.clinicId,
            chief_complaint: input.chiefComplaint,
            diagnosis: input.diagnosis,
            conduct: input.conduct,
            observations: input.observations,
            free_notes: input.freeNotes,
            is_final: input.isFinal,
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
            consultationId: row.consultation_id,
            patientId: row.patient_id,
            doctorUserId: row.doctor_user_id,
            clinicId: row.clinic_id,
            chiefComplaint: row.chief_complaint,
            diagnosis: row.diagnosis,
            conduct: row.conduct,
            observations: row.observations,
            freeNotes: row.free_notes,
            isFinal: row.is_final,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
