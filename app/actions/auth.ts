'use server'

import { cookies } from 'next/headers';
import { AuthService } from '@/features/auth/service';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: any, formData: FormData) {
    const userStr = formData.get('username') as string;

    const result = await AuthService.login(userStr);

    if (!result) {
        return { error: 'Invalid credentials. Try "admin", "sec", or "doc".' };
    }

    const cookieStore = await cookies();
    cookieStore.set('auth_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
    });

    // Redirect based on role
    if (result.user.role === 'ADMIN') redirect('/admin');
    if (result.user.role === 'SECRETARY') redirect('/secretary');
    if (result.user.role === 'DOCTOR') redirect('/doctor');
}

export async function logoutAction() {
    await AuthService.logout();
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
    redirect('/login');
}
