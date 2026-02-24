import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase-auth';

import { Role, UserSession } from './types/auth';

export { type Role, type UserSession };

// 1. Stub Implementation (Original)
async function getStubUser(): Promise<UserSession | null> {
    try {
        const cookieStore = await cookies();
        const mockRole = cookieStore.get('mock_role')?.value as Role | undefined;

        const role: Role = mockRole || 'SECRETARY';
        let id = 'u1';
        let name = 'User';

        if (role === 'DOCTOR') {
            id = 'd5e044f1-ef68-4731-aebe-5a8afc8c15a9'; // Andre Maia (Valid UUID for testing)
            name = 'Dr. House (Stub)';
        } else if (role === 'ADMIN') {
            id = 'admin';
            name = 'Admin User';
        }

        return { id, name, role, email: 'stub@example.com' };
    } catch (e) {
        console.warn('Session: Failed to get stub user', e);
        return null;
    }
}

// 2. Supabase Implementation
async function getSupabaseUser(): Promise<UserSession | null> {
    try {
        console.log('DEBUG: getSupabaseUser - start');
        const supabase = await createClient();
        console.log('DEBUG: getSupabaseUser - client created');

        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('DEBUG: getSupabaseUser - user resolved:', user?.id);

        if (error || !user) return null;

        // Use supabaseServer for the profile check to be safer/faster
        const { supabaseServer } = await import('./supabase-server');
        const { data: profile } = await supabaseServer
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
    const authMode = process.env.AUTH_MODE || 'stub';

    if (authMode === 'supabase') {
        return getSupabaseUser();
    }

    return getStubUser();
}

export async function requireRole(allowedRoles: Role[]) {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Unauthorized: No active session');
    }
    if (!allowedRoles.includes(user.role)) {
        throw new Error(`Forbidden: Role ${user.role} is not allowed. Required: ${allowedRoles.join(', ')}`);
    }
    return user;
}
