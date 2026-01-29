'use client';

import { useActionState } from 'react';
import { createPatientAction } from '../actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from '../styles/Patients.module.css';

export default function PatientForm() {
    // @ts-ignore
    const [state, formAction, isPending] = useActionState(createPatientAction, { error: '' });

    return (
        <div className={styles.formContainer}>
            <form action={formAction}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label="Nome Completo"
                        name="name"
                        placeholder="Ex: João Silva"
                        required
                        fullWidth
                    />

                    <Input
                        label="Documento (CPF / RG)"
                        name="document"
                        placeholder="000.000.000-00"
                        required
                        fullWidth
                    />

                    <Input
                        label="Data de Nascimento"
                        name="birthDate"
                        type="date"
                        required
                        fullWidth
                    />

                    <div style={{ marginTop: '1rem' }}>
                        <Button
                            type="submit"
                            disabled={isPending}
                            variant="primary"
                            fullWidth
                        >
                            {isPending ? 'Cadastrando...' : 'Cadastrar Paciente'}
                        </Button>
                    </div>

                    {state?.error && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            marginTop: '1rem',
                            border: '1px solid #fecaca'
                        }}>
                            {state.error}
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
