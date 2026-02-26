'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MonitorPlay, KeyRound } from 'lucide-react';

export default function TVLoginPage() {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // A simple way to validate is just to push them to /tv?pin=XXXX
        // The middleware will catch it, validate the PIN, and either set the cookie
        // to let them in, or bounce them back if the PIN is wrong.

        // Wait briefly to show loading state
        setTimeout(() => {
            router.push(`/tv?pin=${pin}`);
            setIsLoading(false);
        }, 500);
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            padding: '1rem',
            fontFamily: 'var(--font-inter)'
        }}>
            <Card style={{ maxWidth: '400px', width: '100%', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(10px)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px', height: '64px', background: 'rgba(59, 130, 246, 0.2)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem', color: '#60a5fa'
                    }}>
                        <MonitorPlay size={32} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.5rem' }}>
                        Acesso ao Painel TV
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                        Insira o PIN de acesso (TV_PIN) configurado no servidor para exibir a fila de chamadas.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                            Código PIN
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                                <KeyRound size={18} />
                            </div>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.toUpperCase())}
                                placeholder="• • • •"
                                maxLength={10}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem 0.8rem 2.5rem',
                                    borderRadius: '12px',
                                    border: '1px solid #475569',
                                    background: '#0f172a',
                                    color: '#fff',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    letterSpacing: '0.2em',
                                    textAlign: 'center'
                                }}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <Button type="submit" style={{ width: '100%', padding: '0.8rem', background: '#3b82f6', color: '#fff', fontSize: '1rem', fontWeight: 600 }} disabled={isLoading}>
                        {isLoading ? 'Autenticando...' : 'Liberar Painel'}
                    </Button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <a href="/login" style={{ color: '#94a3b8', fontSize: '0.8rem', textDecoration: 'none' }}>
                        &larr; Voltar para o Login Administrativo
                    </a>
                </div>
            </Card>
        </div>
    );
}
