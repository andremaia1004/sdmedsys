import { SupabaseClient } from '@supabase/supabase-js';
import { CrmCard, CrmStage } from './types';

export interface ICrmRepository {
    getBoard(): Promise<CrmCard[]>;
    moveCard(id: string, stage: CrmStage, position: number): Promise<void>;
    updatePositions(updates: { id: string; position: number }[]): Promise<void>;
    updateNotes(id: string, notes: string): Promise<void>;
    upsertPatient(patientId: string, stage: CrmStage, doctorId?: string | null): Promise<void>;
}

export class SupabaseCrmRepository implements ICrmRepository {
    constructor(private readonly supabase: SupabaseClient, private readonly clinicId: string) { }

    async getBoard(): Promise<CrmCard[]> {
        const { data, error } = await this.supabase
            .from('patient_crm_stages')
            .select(`
                *,
                patient:patients(name, phone),
                doctor:doctors(name)
            `)
            .eq('clinic_id', this.clinicId)
            .order('position', { ascending: true })
            .order('moved_at', { ascending: false });

        if (error) {
            console.error('Error fetching CRM board:', error);
            throw new Error('Falha ao carregar CRM.');
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            clinic_id: row.clinic_id,
            patient_id: row.patient_id,
            stage: row.stage as CrmStage,
            doctor_id: row.doctor_id,
            notes: row.notes,
            position: row.position,
            moved_at: row.moved_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
            patient_name: row.patient?.name || 'Desconhecido',
            patient_phone: row.patient?.phone,
            doctor_name: row.doctor?.name
        }));
    }

    async moveCard(id: string, stage: CrmStage, position: number): Promise<void> {
        const { error } = await this.supabase
            .from('patient_crm_stages')
            .update({
                stage,
                position,
                moved_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('clinic_id', this.clinicId);

        if (error) {
            console.error('Error moving CRM card:', error);
            throw new Error('Falha ao mover card no banco de dados.');
        }
    }

    async updatePositions(updates: { id: string; position: number }[]): Promise<void> {
        if (updates.length === 0) return;

        await Promise.all(updates.map(u =>
            this.supabase
                .from('patient_crm_stages')
                .update({ position: u.position })
                .eq('id', u.id)
                .eq('clinic_id', this.clinicId)
        ));
    }

    async updateNotes(id: string, notes: string): Promise<void> {
        const { error } = await this.supabase
            .from('patient_crm_stages')
            .update({ notes })
            .eq('id', id)
            .eq('clinic_id', this.clinicId);

        if (error) {
            console.error('Error updating CRM notes:', error);
            throw new Error('Falha ao atualizar observações do paciente no CRM.');
        }
    }

    async upsertPatient(patientId: string, stage: CrmStage, doctorId?: string | null): Promise<void> {
        const { error } = await this.supabase
            .from('patient_crm_stages')
            .upsert({
                clinic_id: this.clinicId,
                patient_id: patientId,
                stage,
                doctor_id: doctorId,
                moved_at: new Date().toISOString()
            }, { onConflict: 'clinic_id,patient_id' });

        if (error) {
            console.error('Error adding patient to CRM:', error);
            throw new Error('Falha ao adicionar paciente no CRM.');
        }
    }
}
