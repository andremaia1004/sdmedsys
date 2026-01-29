'use client';

import { useActionState } from 'react';
import { createPatientAction } from '../actions';

const initialState = { error: '', success: false };

export default function PatientForm() {
    // @ts-ignore
    const [state, formAction, isPending] = useActionState(createPatientAction, initialState);

    if (state?.success) {
        return (
            <div style={{ padding: '1rem', backgroundColor: '#e6fffa', color: '#006644', borderRadius: '4px' }}>
                Patient created successfully!
                <button onClick={() => window.location.reload()} style={{ marginLeft: '1rem', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>Add another</button>
            </div>
        )
    }

    return (
        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '0.2rem' }}>Name*</label>
                <input name="name" required style={{ width: '100%', padding: '0.5rem' }} />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '0.2rem' }}>Document (CPF)*</label>
                <input name="document" required style={{ width: '100%', padding: '0.5rem' }} />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '0.2rem' }}>Phone*</label>
                <input name="phone" required style={{ width: '100%', padding: '0.5rem' }} />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '0.2rem' }}>Birth Date</label>
                <input name="birthDate" type="date" style={{ width: '100%', padding: '0.5rem' }} />
            </div>

            {state?.error && <p style={{ color: 'red' }}>{state.error}</p>}

            <button
                type="submit"
                disabled={isPending}
                style={{ padding: '0.8rem', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem' }}
            >
                {isPending ? 'Saving...' : 'Create Patient'}
            </button>
        </form>
    );
}
