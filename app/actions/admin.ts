'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { requireRole } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { DoctorInput, Doctor } from '@/features/doctors/types';

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
    const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
    const { SupabaseDoctorsRepository } = await import('@/features/doctors/repository.supabase');

    // Use Service Role to ensure we can read all doctors for the clinic, avoiding partial RLS visibility
    const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
    const repo = new SupabaseDoctorsRepository(supabaseServer, clinicId);

    return repo.list(activeOnly);
}

export async function createDoctorAction(formData: FormData) {
    try {
        const user = await requireRole(['ADMIN']);
        const { SupabaseDoctorsRepository } = await import('@/features/doctors/repository.supabase');
        const { logAudit } = await import('@/lib/audit');

        // Critical Check for Service Role Key and URL
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
            console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_URL is missing or invalid');
            return {
                success: false,
                error: 'Erro de Configuração: URL do Supabase inválida ou não definida. Verifique as configurações do projeto.'
            };
        }

        if (!serviceKey) {
            console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY missing in environment variables');
            return {
                success: false,
                error: 'Erro de Configuração: Chave de Serviço do Supabase não encontrada. Verifique as variáveis de ambiente no Vercel.'
            };
        }

        const name = formData.get('name') as string;
        const specialty = formData.get('specialty') as string;
        const crm = formData.get('crm') as string || undefined;
        const phone = formData.get('phone') as string || undefined;
        const email = formData.get('email') as string || undefined;
        const password = formData.get('password') as string || undefined;
        const createAuth = formData.get('createAuth') === 'true';

        let profileId: string | undefined = undefined;

        // 1. Create Auth User if requested
        if (createAuth && email && password) {
            // Create user via Admin API (ignores confirmation)
            const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name }
            });

            if (authError) {
                console.error('Auth Error during doctor creation:', authError);
                return { success: false, error: `Erro ao criar conta de acesso: ${authError.message}` };
            }

            profileId = authData.user.id;

            // 2. Create Profile
            const { error: profileError } = await supabaseServer
                .from('profiles')
                .upsert({
                    id: profileId,
                    email: email,
                    role: 'DOCTOR',
                    clinic_id: user.clinicId,
                    updated_at: new Date().toISOString()
                });

            if (profileError) {
                // Rollback Auth user
                await supabaseServer.auth.admin.deleteUser(profileId);
                return { success: false, error: `Erro ao criar perfil de acesso: ${profileError.message}` };
            }
        }

        // 3. Create Doctor Record
        try {
            const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
            const repo = new SupabaseDoctorsRepository(supabaseServer, clinicId);
            const doctor = await repo.create({
                name,
                specialty,
                crm,
                phone,
                email,
                profileId
            });

            await logAudit('CREATE', 'DOCTOR', doctor.id, { name, specialty, crm });

            revalidatePath('/admin/doctors');
            revalidatePath('/doctor/agenda');
            revalidatePath('/secretary/agenda');

            return { success: true, doctor };
        } catch (dbError: unknown) {
            // Rollback Auth user if it was created
            if (profileId) {
                await supabaseServer.auth.admin.deleteUser(profileId);
                await supabaseServer.from('profiles').delete().eq('id', profileId);
            }
            const msg = dbError instanceof Error ? dbError.message : 'Erro desconhecido';
            return { success: false, error: `Erro ao salvar dados do médico: ${msg}` };
        }
    } catch (err: unknown) {
        console.error('Unexpected error in createDoctorAction:', err);
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        return { success: false, error: `Erro inesperado: ${msg}` };
    }
}

export async function updateDoctorAction(id: string, data: Partial<DoctorInput> & { password?: string, profileId?: string, active?: boolean }) {
    try {
        const user = await requireRole(['ADMIN']);
        const { SupabaseDoctorsRepository } = await import('@/features/doctors/repository.supabase');
        const { logAudit } = await import('@/lib/audit');

        // Critical Check for Service Role Key
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return {
                success: false,
                error: 'Erro de Configuração: Chave de Serviço ausente.'
            };
        }

        // 1. Check if we need to update password
        if (data.password && data.password.length > 0) {
            // We need the profileId. If it's not in 'data', we fetch the doctor first
            let profileId = data.profileId;

            if (!profileId) {
                // Fetch doctor to get profileId
                const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
                const tempRepo = new SupabaseDoctorsRepository(supabaseServer, clinicId);
                const doctor = await tempRepo.findById(id);
                profileId = doctor?.profileId;
            }

            if (profileId) {
                const { error: authError } = await supabaseServer.auth.admin.updateUserById(
                    profileId,
                    { password: data.password }
                );

                if (authError) {
                    console.error('Error updating password:', authError);
                    return { success: false, error: `Erro ao atualizar senha: ${authError.message}` };
                }
            }
        }

        // 2. Update Doctor Record using Service Role
        const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
        const repo = new SupabaseDoctorsRepository(supabaseServer, clinicId);

        // Remove password from data before passing to repository as it's not a doctor field
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...doctorData } = data;

        const doctor = await repo.update(id, doctorData as Partial<Doctor>);

        await logAudit('UPDATE', 'DOCTOR', id, { active: data.active });

        revalidatePath('/admin/doctors');
        revalidatePath('/doctor/agenda');
        revalidatePath('/secretary/agenda');
        return { success: true, doctor };
    } catch (err: unknown) {
        console.error('Error in updateDoctorAction:', err);
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: msg || 'Erro ao atualizar médico' };
    }
}

// --- Clinic Settings ---

import { SupabaseSettingsRepository } from '@/features/admin/settings/repository.supabase';
import { ClinicSettingsInput } from '@/features/admin/settings/types';

export async function fetchSettingsAction() {
    const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
    const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
    const repo = new SupabaseSettingsRepository(supabaseServer, clinicId);
    const settings = await repo.get();

    if (settings) return settings;

    // Default fallback if no settings in DB
    return {
        id: 'default',
        clinicId,
        clinicName: 'SDMED SYS',
        workingHours: {},
        appointmentDurationMinutes: 30,
        queuePrefix: 'A',
        tvRefreshSeconds: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

export async function updateSettingsAction(data: Partial<ClinicSettingsInput>) {
    await requireRole(['ADMIN']);
    const { SettingsService } = await import('@/features/admin/settings/service');
    const { logAudit } = await import('@/lib/audit');

    const settings = await SettingsService.update(data);
    await logAudit('UPDATE', 'SETTINGS', settings.id, { clinicName: settings.clinicName });

    revalidatePath('/admin/settings');
    revalidatePath('/tv');
    return { success: true, settings };
}

/**
 * Publicly accessible configurations for the TV panel.
 * Protected by PIN in middleware, but doesn't need a full User role.
 */
export async function fetchPublicSettingsAction() {
    // TV panel uses default clinic for now
    const clinicId = '550e8400-e29b-41d4-a716-446655440000';
    const repo = new SupabaseSettingsRepository(supabaseServer, clinicId);
    const settings = await repo.get();

    if (settings) return settings;

    return {
        id: 'default',
        clinicId,
        clinicName: 'SDMED SYS',
        workingHours: {},
        appointmentDurationMinutes: 30,
        queuePrefix: 'A',
        tvRefreshSeconds: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}
