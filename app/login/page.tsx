'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import styles from './login.module.css';

const initialState = {
    error: '',
    message: '',
};

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(loginAction, initialState);

    return (
        <div className={styles.page}>
            <Card className={styles.loginCard} padding="lg">
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        SDMED<span className={styles.titleAccent}>SYS</span>
                    </h1>
                    <p className={styles.subtitle}>Sistema de Gestão Médica</p>
                </div>

                <form action={formAction} className={styles.form}>
                    <Input
                        label="E-mail ou Usuário"
                        name="username"
                        type="text"
                        placeholder="admin@sdmed.com"
                        required
                    />

                    <Input
                        label="Senha"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                    />

                    <Button
                        type="submit"
                        disabled={isPending}
                        fullWidth
                        size="lg"
                    >
                        {isPending ? 'Entrando...' : 'Entrar'}
                    </Button>

                    {state?.error && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            textAlign: 'center',
                            border: '1px solid #fecaca'
                        }}>
                            {state.error === 'Invalid login credentials' ? 'Credenciais de acesso inválidas' : state.error}
                        </div>
                    )}
                </form>
            </Card>

            <div className={styles.hints}>
                <p><strong>Modo de Teste (AUTH_MODE=stub)</strong></p>
                <ul className={styles.hintList}>
                    <li><code>admin</code> (Admin)</li>
                    <li><code>sec</code> (Secretaria)</li>
                    <li><code>doc</code> (Médico)</li>
                </ul>
            </div>
        </div>
    );
}
