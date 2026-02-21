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
                patient_id: input.patient_id,
                doctor_id: input.doctor_id,
                queue_item_id: input.queue_item_id,
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
            .select('*, clinical_entries(*)')
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
            .select('*, clinical_entries(*)')
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

    async updateStructuredFields(id: string, fields: Partial<Pick<Consultation, 'chief_complaint' | 'diagnosis' | 'conduct'>>): Promise<void> {
        // 1. Get auth session for doctor_user_id
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');
        const authUid = user.id;

        // 2. Resolve consultation to verify ownership and patient_id
        const { data: consultation, error: fetchErr } = await this.supabase
            .from('consultations')
            .select('patient_id, doctor_id')
            .eq('id', id)
            .eq('clinic_id', this.clinicId)
            .single();

        if (fetchErr || !consultation || consultation.doctor_id !== authUid) {
            console.error(`Update failed: Consultation ${id} not found, clinic mismatch, or not owner`);
            throw new Error('Consultation not found or access denied');
        }

        // 3. Find existing entry
        const { data: existingEntry } = await this.supabase
            .from('clinical_entries')
            .select('id, is_final')
            .eq('consultation_id', id)
            .maybeSingle();

        if (existingEntry?.is_final) {
            throw new Error('Cannot edit a finalized clinical entry');
        }

        const payload = {
            clinic_id: this.clinicId,
            chief_complaint: fields.chief_complaint,
            diagnosis: fields.diagnosis,
            conduct: fields.conduct,
            updated_at: new Date().toISOString()
        };

        let result;
        if (existingEntry) {
            result = await this.supabase.from('clinical_entries')
                .update(payload).eq('id', existingEntry.id);
        } else {
            result = await this.supabase.from('clinical_entries')
                .insert([{
                    ...payload,
                    consultation_id: id,
                    patient_id: consultation.patient_id,
                    doctor_user_id: authUid, // Must match RLS
                    is_final: false
                }]);
        }

        if (result.error) {
            console.error('Supabase Error (updateStructuredFields clinical_entries):', result.error);
            throw new Error('Failed to update clinical entry');
        }
    }

    async finish(id: string): Promise<void> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');
        const authUid = user.id;

        // Finalize consultation
        const { error: cError, count } = await this.supabase
            .from('consultations')
            .update({
                finished_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { count: 'exact' })
            .eq('id', id)
            .eq('doctor_id', authUid)
            .eq('clinic_id', this.clinicId);

        if (cError || count === 0) {
            console.error('Supabase Error (finish consultation):', cError);
            throw new Error('Consultation not found or access denied');
        }

        // Finalize clinical entry
        const { error: ceError } = await this.supabase
            .from('clinical_entries')
            .update({
                is_final: true,
                updated_at: new Date().toISOString()
            })
            .eq('consultation_id', id)
            .eq('doctor_user_id', authUid)
            .eq('clinic_id', this.clinicId);

        if (ceError) {
            console.error('Supabase Error (finish clinical_entry):', ceError);
        }
    }

    async listByPatient(patientId: string): Promise<Consultation[]> {
        const { data, error } = await this.supabase
            .from('consultations')
            .select('*, clinical_entries(*)')
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
        const entry = row.clinical_entries?.[0] || row.clinical_entries || {};
        return {
            id: row.id,
            clinic_id: row.clinic_id,
            patient_id: row.patient_id,
            doctor_id: row.doctor_id,
            queue_item_id: row.queue_item_id,
            chief_complaint: entry.chief_complaint || row.chief_complaint || '',
            diagnosis: entry.diagnosis || row.diagnosis || '',
            conduct: entry.conduct || row.conduct || '',
            is_final: entry.is_final || false,
            started_at: row.started_at,
            finished_at: row.finished_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
}
