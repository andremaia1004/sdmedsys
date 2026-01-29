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
