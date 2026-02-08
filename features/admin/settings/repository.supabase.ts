import { SupabaseClient } from '@supabase/supabase-js';
import { ClinicSettings } from './types';
import { ISettingsRepository } from './repository.types';

export class SupabaseSettingsRepository implements ISettingsRepository {
    constructor(
        private supabase: SupabaseClient,
        private clinicId: string
    ) { }

    async get(): Promise<ClinicSettings | null> {
        const { data, error } = await this.supabase
            .from('clinic_settings')
            .select('*')
            .eq('clinic_id', this.clinicId)
            .maybeSingle();

        if (error) {
            console.error('Supabase Error (get settings):', error);
            return null;
        }

        if (!data) return null;

        return this.mapToSettings(data);
    }

    async update(input: Partial<ClinicSettings>): Promise<ClinicSettings> {
        const updateData: any = { updated_at: new Date().toISOString() };

        if (input.clinicName !== undefined) updateData.clinic_name = input.clinicName;
        if (input.clinicAddress !== undefined) updateData.clinic_address = input.clinicAddress;
        if (input.clinicPhone !== undefined) updateData.clinic_phone = input.clinicPhone;
        if (input.workingHours !== undefined) updateData.working_hours = input.workingHours;
        if (input.appointmentDurationMinutes !== undefined) updateData.appointment_duration_minutes = input.appointmentDurationMinutes;
        if (input.queuePrefix !== undefined) updateData.queue_prefix = input.queuePrefix;
        if (input.tvRefreshSeconds !== undefined) updateData.tv_refresh_seconds = input.tvRefreshSeconds;

        const { data, error } = await this.supabase
            .from('clinic_settings')
            .update(updateData)
            .eq('clinic_id', this.clinicId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.mapToSettings(data);
    }

    private mapToSettings(row: any): ClinicSettings {
        return {
            id: row.id,
            clinicId: row.clinic_id,
            clinicName: row.clinic_name,
            clinicAddress: row.clinic_address ?? '',
            clinicPhone: row.clinic_phone ?? '',
            workingHours: row.working_hours,
            appointmentDurationMinutes: row.appointment_duration_minutes,
            queuePrefix: row.queue_prefix,
            tvRefreshSeconds: row.tv_refresh_seconds,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
