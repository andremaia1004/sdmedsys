import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-server';

export type Role = 'ADMIN' | 'SECRETARY' | 'DOCTOR';

export interface UserSession {
    id: string;
    name: string;
    role: Role;
    clinicId?: string;
    email?: string;
}

// 1. Stub Implementation (Original)
async function getStubUser(): Promise<UserSession | null> {
    try {
        const cookieStore = await cookies();
        const mockRole = cookieStore.get('mock_role')?.value as Role | undefined;

        const role: Role = mockRole || 'SECRETARY';
        let id = 'u1';
        let name = 'User';

        if (role === 'DOCTOR') {
            id = 'doc';
            name = 'Dr. House';
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
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return null; // Not logged in
        }

        // Fetch Profile to get Role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, clinic_id, email')
            .eq('id', user.id)
            .maybeSingle(); // Use maybeSingle to avoid errors on missing profile

        if (profileError || !profile) {
            console.warn('Profile not found for user:', user.id);
            return null;
        }

        return {
            id: user.id,
            name: user.email || 'Supabase User',
            role: profile.role as Role,
            clinicId: profile.clinic_id,
            email: user.email
        };
    } catch (e) {
        console.warn('Session: Failed to get supabase user', e);
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
