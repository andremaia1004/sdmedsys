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
    // @ts-ignore - React 19 / Next.js 15 types
    const [state, formAction, isPending] = useActionState(loginAction, initialState);

    return (
        <div className={styles.page}>
            <Card className={styles.loginCard} padding="lg">
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        SDMED<span className={styles.titleAccent}>SYS</span>
                    </h1>
                    <p className={styles.subtitle}>Medical Management System</p>
                </div>

                <form action={formAction} className={styles.form}>
                    <Input
                        label="Email or Username"
                        name="username"
                        type="text"
                        placeholder="admin@sdmed.com"
                        required
                    />

                    <Input
                        label="Password"
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
                        {isPending ? 'Signing in...' : 'Sign In'}
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
                            {state.error}
                        </div>
                    )}
                </form>
            </Card>

            <div className={styles.hints}>
                <p><strong>Demo Mode (AUTH_MODE=stub)</strong></p>
                <ul className={styles.hintList}>
                    <li><code>admin</code></li>
                    <li><code>sec</code></li>
                    <li><code>doc</code></li>
                </ul>
            </div>
        </div>
    );
}
