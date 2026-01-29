'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { requireRole } from '@/lib/session';
import { revalidatePath } from 'next/cache';

/**
 * Administrative action to link a Supabase Auth User with a Profile Role.
 * Only accessible by ADMINs.
 */
export async function createProfile(userId: string, email: string, role: 'ADMIN' | 'SECRETARY' | 'DOCTOR') {
    await requireRole(['ADMIN']);

    const { data, error } = await supabaseServer
        .from('profiles')
        .upsert({
            id: userId,
            email: email,
            role: role,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating profile:', error);
        throw new Error(`Failed to create profile: ${error.message}`);
    }

    return data;
}

export async function fetchAuditLogsAction(page: number = 1, limit: number = 20) {
    const user = await requireRole(['ADMIN']);
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, error, count } = await supabaseServer
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('clinic_id', user.clinicId) // Only current clinic
        .order('created_at', { ascending: false })
        .range(start, end);

    if (error) {
        console.error('Error fetching audit logs:', error);
        throw new Error('Failed to fetch audit logs');
    }

    return {
        logs: data,
        totalCount: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
    };
}

// --- Doctors Management ---

export async function fetchDoctorsAction(activeOnly: boolean = false) {
    await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
    const { DoctorService } = await import('@/features/doctors/service');
    return DoctorService.list(activeOnly);
}

export async function createDoctorAction(formData: FormData) {
    await requireRole(['ADMIN']);
    const { DoctorService } = await import('@/features/doctors/service');
    const { logAudit } = await import('@/lib/audit');

    const name = formData.get('name') as string;
    const specialty = formData.get('specialty') as string;
    const profileId = formData.get('profileId') as string || undefined;

    const doctor = await DoctorService.create({ name, specialty, profileId });
    await logAudit('CREATE', 'DOCTOR', doctor.id, { name, specialty });

    revalidatePath('/admin/doctors');
    revalidatePath('/doctor/agenda');
    revalidatePath('/secretary/agenda');
    return { success: true, doctor };
}

export async function updateDoctorAction(id: string, data: any) {
    await requireRole(['ADMIN']);
    const { DoctorService } = await import('@/features/doctors/service');
    const { logAudit } = await import('@/lib/audit');

    const doctor = await DoctorService.update(id, data);
    await logAudit('UPDATE', 'DOCTOR', id, { active: data.active });

    revalidatePath('/admin/doctors');
    revalidatePath('/doctor/agenda');
    revalidatePath('/secretary/agenda');
    return { success: true, doctor };
}

// --- Clinic Settings ---

export async function fetchSettingsAction() {
    await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
    const { SettingsService } = await import('@/features/admin/settings/service');
    return SettingsService.get();
}

export async function updateSettingsAction(data: any) {
    await requireRole(['ADMIN']);
    const { SettingsService } = await import('@/features/admin/settings/service');
    const { logAudit } = await import('@/lib/audit');

    const settings = await SettingsService.update(data);
    await logAudit('UPDATE', 'SETTINGS', settings.id, { clinicName: settings.clinicName });

    revalidatePath('/admin/settings');
    revalidatePath('/tv');
    return { success: true, settings };
}
