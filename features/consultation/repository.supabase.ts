import { SupabaseClient } from '@supabase/supabase-js';
import { Consultation, ConsultationInput } from './types';
import { IConsultationRepository } from './repository.types';

export class SupabaseConsultationRepository implements IConsultationRepository {
    constructor(
        private supabase: SupabaseClient,
        private clinicId: string
    ) { }

    async start(input: ConsultationInput): Promise<Consultation> {
        const { data, error } = await this.supabase
            .from('consultations')
            .insert([{
                patient_id: input.patientId,
                doctor_id: input.doctorId,
                queue_item_id: input.queueItemId,
                clinical_notes: '',
                started_at: new Date().toISOString(),
                clinic_id: this.clinicId
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase Error (start consultation):', error);
            throw new Error('Failed to start consultation');
        }

        return this.mapToConsultation(data);
    }

    async getActiveByDoctor(doctorId: string): Promise<Consultation | undefined> {
        const { data, error } = await this.supabase
            .from('consultations')
            .select('*')
            .eq('clinic_id', this.clinicId)
            .eq('doctor_id', doctorId)
            .is('finished_at', null)
            .maybeSingle();

        if (error) {
            console.error('Supabase Error (getActiveByDoctor):', error);
            return undefined;
        }

        if (!data) return undefined;

        return this.mapToConsultation(data);
    }

    async findById(id: string): Promise<Consultation | undefined> {
        const { data, error } = await this.supabase
            .from('consultations')
            .select('*')
            .eq('id', id)
            .eq('clinic_id', this.clinicId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return undefined;
            console.error('Supabase Error (findById):', error);
            throw new Error('Failed to find consultation');
        }

        return this.mapToConsultation(data);
    }

    async updateStructuredFields(id: string, fields: Partial<Pick<Consultation, 'chiefComplaint' | 'physicalExam' | 'diagnosis' | 'conduct'>>): Promise<void> {
        const { error, count } = await this.supabase
            .from('consultations')
            .update({
                chief_complaint: fields.chiefComplaint,
                physical_exam: fields.physicalExam,
                diagnosis: fields.diagnosis,
                conduct: fields.conduct,
                updated_at: new Date().toISOString()
            }, { count: 'exact' })
            .eq('id', id)
            .eq('clinic_id', this.clinicId);

        if (error) {
            console.error('Supabase Error (updateStructuredFields):', error);
            throw new Error('Failed to update clinical entry');
        }

        if (count === 0) {
            console.error(`Update failed: Consultation ${id} not found or clinic mismatch (${this.clinicId})`);
            throw new Error('Consultation not found or access denied');
        }
    }

    async finish(id: string): Promise<void> {
        const { error, count } = await this.supabase
            .from('consultations')
            .update({
                finished_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { count: 'exact' })
            .eq('id', id)
            .eq('clinic_id', this.clinicId);

        if (error) {
            console.error('Supabase Error (finish):', error);
            throw new Error('Failed to finish consultation');
        }

        if (count === 0) {
            console.error(`Finish failed: Consultation ${id} not found or clinic mismatch (${this.clinicId})`);
            throw new Error('Consultation not found or access denied');
        }
    }

    async listByPatient(patientId: string): Promise<Consultation[]> {
        const { data, error } = await this.supabase
            .from('consultations')
            .select('*')
            .eq('clinic_id', this.clinicId)
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase Error (listByPatient):', error);
            return [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((d: any) => this.mapToConsultation(d));
    }

    async countByPatient(patientId: string): Promise<number> {
        const { count, error } = await this.supabase
            .from('consultations')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', this.clinicId)
            .eq('patient_id', patientId);

        if (error) {
            console.error('Supabase Error (countByPatient):', error);
            return 0;
        }

        return count || 0;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapToConsultation(row: any): Consultation {
        return {
            id: row.id,
            patientId: row.patient_id,
            doctorId: row.doctor_id,
            queueItemId: row.queue_item_id,
            clinicalNotes: row.clinical_notes || '',
            chiefComplaint: row.chief_complaint || '',
            physicalExam: row.physical_exam || '',
            diagnosis: row.diagnosis || '',
            conduct: row.conduct || '',
            startedAt: row.started_at,
            finishedAt: row.finished_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
