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
}

// 2. Supabase Implementation
async function getSupabaseUser(): Promise<UserSession | null> {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return null; // Not logged in
    }

    // Fetch Profile to get Role
    // We can use the SAME client (as user) because RLS allows reading own profile.
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, clinic_id, email')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        console.error('Profile not found for user:', user.id);
        // Fallback or unauthorized if no profile?
        // Let's return null to force re-login/contact admin
        return null;
    }

    return {
        id: user.id,
        name: user.email || 'Supabase User', // Profile might have name later
        role: profile.role as Role,
        clinicId: profile.clinic_id,
        email: user.email
    };
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
        // In Server Actions, we throw errors. In Middleware/Pages, we redirect.
        // This helper is mostly for Actions/Services.
        throw new Error('Unauthorized: No active session');
    }
    if (!allowedRoles.includes(user.role)) {
        throw new Error(`Forbidden: Role ${user.role} is not allowed. Required: ${allowedRoles.join(', ')}`);
    }
    return user;
}
