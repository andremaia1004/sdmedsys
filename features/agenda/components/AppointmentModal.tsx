'use client';

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { createAppointmentAction } from '../actions';
import { Patient } from '@/features/patients/types';
import { searchPatientsAction } from '@/features/patients/actions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from '../styles/Agenda.module.css';

export default function AppointmentModal({
    doctorId,
    date,
    time,
    onClose
}: {
    doctorId: string,
    date: string,
    time: string,
    onClose: () => void
}) {
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);

    // @ts-ignore
    const [state, formAction, isPending] = useActionState(createAppointmentAction, { error: '', success: false });

    useEffect(() => {
        if (state?.success) {
            const timer = setTimeout(() => onClose(), 1500);
            return () => clearTimeout(timer);
        }
    }, [state?.success, onClose]);

    if (state?.success) {
        return (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                <Card padding="lg" style={{ width: '350px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                    <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Agendamento Confirmado!</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Atualizando calendário...</p>
                </Card>
            </div>
        )
    }

    const handleSearch = async (q: string) => {
        setSearchQuery(q);
        if (q.length > 2) {
            const res = await searchPatientsAction(q);
            setSearchResults(res);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <Card
                className={styles.modalCard}
                header="Novo Agendamento"
                style={{ width: '450px', animation: 'slideUp 0.3s ease-out' }}
                footer={
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button variant="secondary" onClick={onClose} fullWidth>Cancelar</Button>
                        <Button
                            variant="primary"
                            disabled={!selectedPatient || isPending}
                            onClick={() => (document.getElementById('appointment-form') as HTMLFormElement)?.requestSubmit()}
                            fullWidth
                        >
                            {isPending ? 'Agendando...' : 'Confirmar'}
                        </Button>
                    </div>
                }
            >
                <div style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Horário Selecionado</div>
                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {date && new Date(date).toLocaleDateString('pt-BR')} às {time}
                        </div>
                    </div>

                    <form id="appointment-form" action={formAction}>
                        <input type="hidden" name="doctorId" value={doctorId} />
                        <input type="hidden" name="date" value={date} />
                        <input type="hidden" name="time" value={time} />

                        {!selectedPatient ? (
                            <div>
                                <Input
                                    label="Buscar Paciente"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Nome ou CPF do paciente..."
                                    autoFocus
                                />
                                {searchQuery.length > 2 && (
                                    <ul style={{
                                        marginTop: '0.5rem',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        maxHeight: '150px',
                                        overflowY: 'auto',
                                        listStyle: 'none',
                                        padding: 0,
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        {searchResults.map(p => (
                                            <li
                                                key={p.id}
                                                onClick={() => setSelectedPatient(p)}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid var(--border)',
                                                    transition: 'all 0.2s ease',
                                                    fontSize: '0.9375rem'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <strong>{p.name}</strong>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.document}</div>
                                            </li>
                                        ))}
                                        {searchResults.length === 0 && searchQuery.length > 2 && (
                                            <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                Nenhum paciente encontrado
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <div style={{
                                padding: '1rem',
                                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: '1px solid rgba(59, 130, 246, 0.2)'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paciente Selecionado</div>
                                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{selectedPatient.name}</div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)} style={{ color: 'var(--danger)' }}>Alterar</Button>
                                <input type="hidden" name="patientId" value={selectedPatient.id} />
                                <input type="hidden" name="patientName" value={selectedPatient.name} />
                            </div>
                        )}

                        {state?.error && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '0.75rem',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                border: '1px solid #fecaca'
                            }}>
                                {state.error}
                            </div>
                        )}
                    </form>
                </div>
            </Card>
        </div>
    );
}
