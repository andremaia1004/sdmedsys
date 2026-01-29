'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth';

const initialState = {
    error: '',
    message: '',
};

export default function LoginPage() {
    // @ts-ignore - React 19 / Next.js 15 types
    const [state, formAction, isPending] = useActionState(loginAction, initialState);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5' }}>
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#0070f3' }}>SDMED SYS</h1>

                <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
                    <div>
                        <label style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Email / Username</label>
                        <input
                            name="username"
                            type="text"
                            placeholder="user@example.com or 'admin'"
                            required
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Password</label>
                        <input
                            name="password"
                            type="password"
                            placeholder="Password"
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        style={{ marginTop: '1rem', padding: '0.8rem', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {isPending ? 'Signing in...' : 'Sign In'}
                    </button>

                    {state?.error && (
                        <div style={{ marginTop: '1rem', padding: '0.8rem', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '0.9rem' }}>
                            {state.error}
                        </div>
                    )}
                </form>
            </div>

            <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#666', maxWidth: '300px', textAlign: 'center' }}>
                <p><strong>Dev & Test Modes:</strong></p>
                <p>If <code>AUTH_MODE=stub</code>, use 'admin', 'sec', or 'doc' (password ignored).</p>
                <p>If <code>AUTH_MODE=supabase</code>, use real email/password.</p>
            </div>
        </div>
    );
}
