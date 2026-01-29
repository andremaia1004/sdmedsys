'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth';

const initialState = {
    error: '',
};

export default function LoginPage() {
    // @ts-ignore - React 19 types might be slightly off in some envs, ignoring for MVP speed
    const [state, formAction, isPending] = useActionState(loginAction, initialState);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
            <h1>SDMED SYS</h1>
            <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
                <input
                    name="username"
                    placeholder="Username (admin, sec, doc)"
                    required
                    style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button
                    type="submit"
                    disabled={isPending}
                    style={{ padding: '0.8rem', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {isPending ? 'Logging in...' : 'Login'}
                </button>
                {state?.error && <p style={{ color: 'red' }}>{state.error}</p>}
            </form>
            <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
                <p><strong>Dev Hints:</strong></p>
                <ul>
                    <li>User: <code>admin</code> : Admin Role</li>
                    <li>User: <code>sec</code> : Secretary Role</li>
                    <li>User: <code>doc</code> : Doctor Role</li>
                </ul>
            </div>
        </div>
    );
}
