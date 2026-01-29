'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { requireRole } from '@/lib/session';

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
