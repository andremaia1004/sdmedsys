'use client';

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { createAppointmentAction } from '../actions';
import { Patient } from '@/features/patients/types';
import { searchPatientsAction } from '@/features/patients/actions';
import PatientForm from '@/features/patients/components/PatientForm';
import { listDoctorsAction, getDoctorAction } from '@/features/doctors/actions';
import { Doctor } from '@/features/doctors/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from '../styles/Agenda.module.css';
import { Calendar as CalendarIcon, Clock, Check, Search, User, X, UserPlus, ArrowLeft, Stethoscope, ChevronDown } from 'lucide-react';

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

    // Doctor Selection State
    const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState(doctorId);
    const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);

    // Appointment Action
    // @ts-ignore
    const [apptState, apptFormAction, isApptPending] = useActionState(createAppointmentAction, { error: '', success: false });

    // Fetch Doctors for selection
    useEffect(() => {
        setIsLoadingDoctors(true);
        console.log('[AppointmentModal] Fetching doctors for doctorId:', doctorId);

        Promise.all([
            listDoctorsAction(false), // Fetch ALL doctors to debug
            getDoctorAction(doctorId)
        ]).then(([allDocs, currentDoc]) => {
            console.log('[AppointmentModal] Fetched docs:', allDocs.length, 'Current doc:', currentDoc);

            let docs = allDocs || [];
            // Ensure current doctor is in the list (if exists and not already there)
            if (currentDoc && !docs.find(d => d.id === currentDoc.id)) {
                console.log('[AppointmentModal] Adding current doctor manually to list');
                docs = [currentDoc, ...docs];
            }
            setAvailableDoctors(docs);
            setIsLoadingDoctors(false);
        }).catch(err => {
            console.error('[AppointmentModal] Error fetching doctors:', err);
            setIsLoadingDoctors(false);
        });
    }, [doctorId]); // Re-run if doctorId changes (e.g. diff slot)

    // Also update local state if prop changes (though usually modal unmounts)
    useEffect(() => {
        setSelectedDoctorId(doctorId);
    }, [doctorId]);

    // Handle Appointment Success
    useEffect(() => {
        if (apptState?.success) {
            const timer = setTimeout(() => onClose(), 1500);
            return () => clearTimeout(timer);
        }
    }, [apptState?.success, onClose]);

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
        <div className={styles.registerForm} style={{ padding: 0 }}>
            <div className={styles.formHeader} style={{ marginBottom: '1rem' }}>
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

            <PatientForm
                onSuccess={(patient) => {
                    setSelectedPatient(patient);
                    setMode('search');
                }}
            />
        </div>
    );

    return (
        <div className={styles.modalOverlay}>
            <Card
                className={styles.modalCard}
                style={{
                    border: 'none',
                    maxWidth: mode === 'register' ? '900px' : '700px', // Wider default
                    width: '100%',
                    transition: 'max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
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
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderBottom: '1px solid #e2e8f0'
                }}>
                    <div className={styles.slotInfo} style={{ padding: 0, background: 'none', border: 'none', marginBottom: 0 }}>
                        <div className={styles.slotIcon}>
                            <CalendarIcon size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Horário Selecionado</div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>
                                {date && new Date(date).toLocaleDateString('pt-BR')} às {time}
                            </div>
                        </div>
                    </div>

                    <div className={styles.slotInfo} style={{ padding: 0, background: 'none', border: 'none', marginBottom: 0 }}>
                        <div className={styles.slotIcon} style={{ background: 'var(--accent)', color: '#fff' }}>
                            <Stethoscope size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Profissional</div>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <select
                                    value={selectedDoctorId}
                                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                                    disabled={isLoadingDoctors}
                                    style={{
                                        width: '100%',
                                        appearance: 'none',
                                        background: 'transparent',
                                        border: 'none',
                                        fontWeight: 800,
                                        fontSize: '1rem',
                                        color: 'var(--primary)',
                                        cursor: isLoadingDoctors ? 'wait' : 'pointer',
                                        paddingRight: '1.5rem',
                                        outline: 'none',
                                        opacity: isLoadingDoctors ? 0.7 : 1
                                    }}
                                >
                                    {availableDoctors.map(doc => (
                                        <option key={doc.id} value={doc.id}>
                                            {doc.name}
                                        </option>
                                    ))}
                                    {isLoadingDoctors && <option>Carregando...</option>}
                                    {!isLoadingDoctors && availableDoctors.length === 0 && <option value="" disabled>Nenhum médico encontrado</option>}
                                </select>
                                <ChevronDown size={14} style={{ position: 'absolute', right: 0, pointerEvents: 'none', color: 'var(--primary)' }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                    {mode === 'search' ? (
                        <>
                            <div style={{ marginTop: '1.5rem' }}>
                                {renderSearchMode()}
                            </div>
                            <form id="appointment-form" action={apptFormAction}>
                                <input type="hidden" name="doctorId" value={selectedDoctorId} />
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
                        <div style={{ marginTop: '1.5rem' }}>
                            {renderRegisterMode()}
                        </div>
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
