'use client';

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { createAppointmentAction } from '../actions';
import { Patient } from '@/features/patients/types';
import { searchPatientsAction, createPatientAction } from '@/features/patients/actions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from '../styles/Agenda.module.css';
import { Calendar as CalendarIcon, Clock, Check, Search, User, X, UserPlus, ArrowLeft } from 'lucide-react';

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
    const [mode, setMode] = useState<'search' | 'register'>('search');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);

    // Appointment Action
    // @ts-ignore
    const [apptState, apptFormAction, isApptPending] = useActionState(createAppointmentAction, { error: '', success: false });

    // Patient Action
    // @ts-ignore
    const [patientState, patientFormAction, isPatientPending] = useActionState(createPatientAction, { error: '', success: false });

    // Handle Appointment Success
    useEffect(() => {
        if (apptState?.success) {
            const timer = setTimeout(() => onClose(), 1500);
            return () => clearTimeout(timer);
        }
    }, [apptState?.success, onClose]);

    // Handle Patient Registration Success
    useEffect(() => {
        if (patientState?.success && patientState.patient) {
            setSelectedPatient(patientState.patient);
            setMode('search');
        }
    }, [patientState?.success, patientState?.patient]);

    if (apptState?.success) {
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

    const renderSearchMode = () => (
        <div className={styles.patientSelector}>
            <div className={styles.formHeader}>
                <div className={styles.formTitle}>Buscar Paciente</div>
                <div
                    className={styles.searchLink}
                    onClick={() => setMode('register')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                    <UserPlus size={14} />
                    Novo Paciente
                </div>
            </div>

            {!selectedPatient ? (
                <div style={{ position: 'relative' }}>
                    <Input
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Nome ou CPF do paciente..."
                        autoFocus
                        style={{ paddingRight: '3rem', borderRadius: '12px' }}
                    />
                    <div style={{ position: 'absolute', right: '1rem', top: '2.4rem', color: 'var(--text-muted)' }}>
                        <Search size={18} />
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
                                <div className={styles.noResults}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Nenhum paciente encontrado.</p>
                                    <button
                                        type="button"
                                        className={styles.registerButton}
                                        onClick={() => setMode('register')}
                                    >
                                        Cadastrar Novo Paciente
                                    </button>
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
                </div>
            )}
        </div>
    );

    const renderRegisterMode = () => (
        <form action={patientFormAction} className={styles.registerForm}>
            <div className={styles.formHeader}>
                <div className={styles.formTitle}>Cadastrar Novo Paciente</div>
                <div
                    className={styles.searchLink}
                    onClick={() => setMode('search')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                    <ArrowLeft size={14} />
                    Voltar para Busca
                </div>
            </div>

            <Input name="name" label="Nome Completo" required placeholder="Ex: João da Silva" />

            <div className={styles.formGrid}>
                <Input name="document" label="CPF" required placeholder="000.000.000-00" />
                <Input name="phone" label="Celular" required placeholder="(11) 99999-9999" />
            </div>

            <Input name="birthDate" label="Data de Nascimento" type="date" />

            {patientState?.error && (
                <div style={{ color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 600 }}>
                    {patientState.error}
                </div>
            )}

            <Button
                type="submit"
                variant="accent"
                disabled={isPatientPending}
                style={{ borderRadius: '12px', marginTop: '0.5rem' }}
            >
                {isPatientPending ? 'Cadastrando...' : 'Finalizar Cadastro'}
            </Button>
        </form>
    );

    return (
        <div className={styles.modalOverlay}>
            <Card
                className={styles.modalCard}
                style={{ border: 'none' }}
                footer={mode === 'search' ? (
                    <div style={{ display: 'flex', gap: '1rem', padding: '1.5rem', paddingTop: 0 }}>
                        <Button variant="secondary" onClick={onClose} fullWidth style={{ borderRadius: '12px' }}>Cancelar</Button>
                        <Button
                            variant="primary"
                            disabled={!selectedPatient || isApptPending}
                            onClick={() => (document.getElementById('appointment-form') as HTMLFormElement)?.requestSubmit()}
                            fullWidth
                            style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 45, 94, 0.2)' }}
                        >
                            {isApptPending ? 'Agendando...' : 'Confirmar Agendamento'}
                        </Button>
                    </div>
                ) : null}
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
                    {mode === 'search' ? (
                        <>
                            {renderSearchMode()}
                            <form id="appointment-form" action={apptFormAction}>
                                <input type="hidden" name="doctorId" value={doctorId} />
                                <input type="hidden" name="date" value={date} />
                                <input type="hidden" name="time" value={time} />
                                {selectedPatient && (
                                    <>
                                        <input type="hidden" name="patientId" value={selectedPatient.id} />
                                        <input type="hidden" name="patientName" value={selectedPatient.name} />
                                    </>
                                )}
                            </form>
                        </>
                    ) : (
                        renderRegisterMode()
                    )}

                    {apptState?.error && (
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
                            {apptState.error}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
