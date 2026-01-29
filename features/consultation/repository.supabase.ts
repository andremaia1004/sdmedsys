import { supabaseServer as supabase } from '@/lib/supabase-server';
import { Consultation, ConsultationInput } from './types';
import { IConsultationRepository } from './repository.types';

export class SupabaseConsultationRepository implements IConsultationRepository {
    async start(input: ConsultationInput): Promise<Consultation> {
        // Map camelCase to snake_case for DB
        const { data, error } = await supabase
            .from('consultations')
            .insert([{
                patient_id: input.patientId,
                doctor_id: input.doctorId,
                queue_item_id: input.queueItemId,
                clinical_notes: '',
                started_at: new Date().toISOString()
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
        const { data, error } = await supabase
            .from('consultations')
            .select('*')
            .eq('doctor_id', doctorId)
            .is('finished_at', null)
            .maybeSingle(); // Use maybeSingle to avoid 406 if none found

        if (error) {
            console.error('Supabase Error (getActiveByDoctor):', error);
            return undefined; // Fail gracefully or throw
        }

        if (!data) return undefined;

        return this.mapToConsultation(data);
    }

    async findById(id: string): Promise<Consultation | undefined> {
        const { data, error } = await supabase
            .from('consultations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return undefined;
            console.error('Supabase Error (findById):', error);
            throw new Error('Failed to find consultation');
        }

        return this.mapToConsultation(data);
    }

    async updateNotes(id: string, notes: string): Promise<void> {
        const { error } = await supabase
            .from('consultations')
            .update({
                clinical_notes: notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Supabase Error (updateNotes):', error);
            throw new Error('Failed to update notes');
        }
    }

    async finish(id: string): Promise<void> {
        const { error } = await supabase
            .from('consultations')
            .update({
                finished_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Supabase Error (finish):', error);
            throw new Error('Failed to finish consultation');
        }
    }

    private mapToConsultation(row: any): Consultation {
        return {
            id: row.id,
            patientId: row.patient_id,
            doctorId: row.doctor_id,
            queueItemId: row.queue_item_id,
            clinicalNotes: row.clinical_notes || '',
            startedAt: row.started_at,
            finishedAt: row.finished_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
