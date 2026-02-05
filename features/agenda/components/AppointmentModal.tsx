'use client';

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { createAppointmentAction } from '../actions';
import { Patient } from '@/features/patients/types';
import { searchPatientsAction } from '@/features/patients/actions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from '../styles/Agenda.module.css';
import { Calendar as CalendarIcon, Clock, Check, Search, User, X } from 'lucide-react';

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
            <div className={styles.modalOverlay}>
                <Card className={styles.modalCard}>
                    <div className={styles.successState}>
                        <div className={styles.successIcon}>✅</div>
                        <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem', fontWeight: 800 }}>Agendamento Confirmado!</h3>
                        <p style={{ color: 'var(--text-muted)' }}>O calendário será atualizado em instantes.</p>
                    </div>
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
        <div className={styles.modalOverlay}>
            <Card
                className={styles.modalCard}
                style={{ border: 'none' }}
                footer={
                    <div style={{ display: 'flex', gap: '1rem', padding: '1.5rem', paddingTop: 0 }}>
                        <Button variant="secondary" onClick={onClose} fullWidth style={{ borderRadius: '12px' }}>Cancelar</Button>
                        <Button
                            variant="primary"
                            disabled={!selectedPatient || isPending}
                            onClick={() => (document.getElementById('appointment-form') as HTMLFormElement)?.requestSubmit()}
                            fullWidth
                            style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 45, 94, 0.2)' }}
                        >
                            {isPending ? 'Agendando...' : 'Confirmar Agendamento'}
                        </Button>
                    </div>
                }
            >
                <div className={styles.slotInfo}>
                    <div className={styles.slotIcon}>
                        <CalendarIcon size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700, letterSpacing: '0.05em' }}>Horário Selecionado</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                            {date && new Date(date).toLocaleDateString('pt-BR')} às {time}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                    <form id="appointment-form" action={formAction}>
                        <input type="hidden" name="doctorId" value={doctorId} />
                        <input type="hidden" name="date" value={date} />
                        <input type="hidden" name="time" value={time} />

                        {!selectedPatient ? (
                            <div className={styles.patientSelector}>
                                <div style={{ position: 'relative' }}>
                                    <Input
                                        label="Buscar Paciente"
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        placeholder="Nome ou CPF do paciente..."
                                        autoFocus
                                        style={{ paddingRight: '3rem', borderRadius: '12px' }}
                                    />
                                    <div style={{ position: 'absolute', right: '1rem', top: '2.4rem', color: 'var(--text-muted)' }}>
                                        <Search size={18} />
                                    </div>
                                </div>

                                {searchQuery.length > 2 && (
                                    <div className={styles.patientResults}>
                                        {searchResults.map(p => (
                                            <div
                                                key={p.id}
                                                className={styles.searchItem}
                                                onClick={() => setSelectedPatient(p)}
                                            >
                                                <strong>{p.name}</strong>
                                                <small>{p.document}</small>
                                            </div>
                                        ))}
                                        {searchResults.length === 0 && (
                                            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                Nenhum paciente encontrado
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.selectedPatient}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Paciente Selecionado</div>
                                        <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>{selectedPatient.name}</div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedPatient(null)}
                                    style={{ color: 'var(--danger)', fontWeight: 700 }}
                                >
                                    Alterar
                                </Button>
                                <input type="hidden" name="patientId" value={selectedPatient.id} />
                                <input type="hidden" name="patientName" value={selectedPatient.name} />
                            </div>
                        )}

                        {state?.error && (
                            <div style={{
                                marginTop: '1.25rem',
                                padding: '1rem',
                                backgroundColor: '#fff1f2',
                                color: '#be123c',
                                borderRadius: '12px',
                                fontSize: '0.875rem',
                                border: '1px solid #fecdd3',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                fontWeight: 500
                            }}>
                                <X size={18} />
                                {state.error}
                            </div>
                        )}
                    </form>
                </div>
            </Card>
        </div>
    );
}
