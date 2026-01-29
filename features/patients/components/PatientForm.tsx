'use client';

import { useActionState } from 'react';
import { createPatientAction } from '../actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from '../styles/Patients.module.css';

const initialState = {
    error: '',
    message: '',
};

export default function PatientForm() {
    // @ts-ignore - React 19 types
    const [state, formAction, isPending] = useActionState(createPatientAction, initialState);

    return (
        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
                label="Full Name"
                name="name"
                required
                placeholder="e.g. John Doe"
            />

            <Input
                label="Document (CPF/RG)"
                name="document"
                required
                placeholder="000.000.000-00"
            />

            <Input
                label="Phone Number"
                name="phone"
                required
                placeholder="(00) 00000-0000"
            />

            <Input
                label="Date of Birth"
                name="birthDate"
                type="date"
                required
            />

            <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isPending}
            >
                {isPending ? 'Saving...' : 'Register Patient'}
            </Button>

            {state?.error && (
                <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{state.error}</p>
            )}
            {state?.message && (
                <p style={{ color: 'var(--success)', fontSize: '0.875rem' }}>{state.message}</p>
            )}
        </form>
    );
}
