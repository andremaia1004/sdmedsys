'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-auth';
import { ActionState } from '@/lib/types/server-actions';

export async function loginAction(prevState: ActionState, formData: FormData) {
    const emailOrUsername = formData.get('username') as string;
    const password = formData.get('password') as string;

    const supabase = await createClient();

    // We assume input is email for Supabase
    const { error } = await supabase.auth.signInWithPassword({
        email: emailOrUsername,
        password: password
    });

    if (error) {
        return { error: error.message };
    }

    // Login successful - Redirect based on Profile Role
    // (We need to fetch profile to know where to redirect)
    const { data: { user } } = await supabase.auth.getUser();

    // We can fetch profile here OR let the middleware/layout handle it.
    // For specific redirect, let's fetch profile.
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

    const userRole = profile?.role || 'SECRETARY'; // Default fallback

    if (userRole === 'ADMIN') redirect('/admin');
    if (userRole === 'DOCTOR') redirect('/doctor');
    redirect('/secretary');
}

export async function logoutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
}
