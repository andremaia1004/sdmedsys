import { SupabaseClient } from '@supabase/supabase-js';
import { Appointment, AppointmentInput, AppointmentStatus } from './types';
import { IAppointmentsRepository } from './repository.types';

export class SupabaseAppointmentsRepository implements IAppointmentsRepository {
    constructor(
        private supabase: SupabaseClient,
        private clinicId: string
    ) { }

    async checkConflict(doctorId: string, startTime: string, endTime: string): Promise<boolean> {
        const start = new Date(startTime).toISOString();
        const end = new Date(endTime).toISOString();

        const { data, error } = await this.supabase
            .from('appointments')
            .select('id')
            .eq('clinic_id', this.clinicId)
            .eq('doctor_id', doctorId)
            .neq('status', 'CANCELED')
            .lt('start_time', end)
            .gt('end_time', start);

        if (error) {
            console.error('Supabase Error (checkConflict):', error);
            return true;
        }

        return data && data.length > 0;
    }

    async create(input: AppointmentInput): Promise<Appointment> {
        const { data, error } = await this.supabase
            .from('appointments')
            .insert([{
                patient_id: input.patientId,
                patient_name: input.patientName,
                doctor_id: input.doctorId,
                start_time: input.startTime,
                end_time: input.endTime,
                status: input.status,
                notes: input.notes,
                clinic_id: this.clinicId
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase Error (create appointment):', error);
            throw new Error('Failed to create appointment');
        }

        return this.mapToAppointment(data);
    }

    async list(doctorId?: string, startRange?: string, endRange?: string): Promise<Appointment[]> {
        let builder = this.supabase
            .from('appointments')
            .select('*')
            .eq('clinic_id', this.clinicId)
            .neq('status', 'CANCELED')
            .order('start_time', { ascending: true });

        if (doctorId) {
            builder = builder.eq('doctor_id', doctorId);
        }

        if (startRange && endRange) {
            builder = builder
                .gte('start_time', startRange)
                .lte('start_time', endRange);
        }

        const { data, error } = await builder;

        if (error) {
            console.error('Supabase Error (list appointments):', error);
            throw new Error('Failed to list appointments');
        }

        return data.map(this.mapToAppointment);
    }

    async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment | null> {
        const { data, error } = await this.supabase
            .from('appointments')
            .update({
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('clinic_id', this.clinicId)
            .select()
            .single();

        if (error) {
            console.error('Supabase Error (updateStatus):', error);
            throw new Error('Failed to update appointment status');
        }

        return this.mapToAppointment(data);
    }

    private mapToAppointment(row: any): Appointment {
        return {
            id: row.id,
            patientId: row.patient_id,
            patientName: row.patient_name,
            doctorId: row.doctor_id,
            startTime: row.start_time,
            endTime: row.end_time,
            status: row.status,
            notes: row.notes,
        };
    }
}
