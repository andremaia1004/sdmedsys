import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-auth';

import { Role, UserSession } from './types/auth';

export { type Role, type UserSession };

// 2. Supabase Implementation
async function getSupabaseUser(): Promise<UserSession | null> {
    try {
        console.log('DEBUG: getSupabaseUser - start');
        const supabase = await createClient();
        console.log('DEBUG: getSupabaseUser - client created');

        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('DEBUG: getSupabaseUser - user resolved:', user?.id);

        if (error || !user) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, clinic_id, email')
            .eq('id', user.id)
            .maybeSingle();

        console.log('DEBUG: getSupabaseUser - profile resolved:', profile?.role);

        if (!profile) return null;

        return {
            id: user.id,
            name: user.email || 'Supabase User',
            role: profile.role as Role,
            clinicId: profile.clinic_id,
            email: user.email
        };
    } catch (e) {
        console.warn('DEBUG: Session Error:', e);
        return null;
    }
}

// Main Factory
export async function getCurrentUser(): Promise<UserSession | null> {
    return getSupabaseUser();
}

export async function requireRole(allowedRoles: Role[]) {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }
    if (!allowedRoles.includes(user.role)) {
        redirect('/unauthorized');
    }
    return user;
}
