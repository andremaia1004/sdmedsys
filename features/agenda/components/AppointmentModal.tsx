'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { useRouter } from 'next/navigation';
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
    const router = useRouter();
    const [mode, setMode] = useState<'search' | 'register'>('search');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);

    // Selection State (Interactive overrides)
    const [selectedDate, setSelectedDate] = useState(date);
    const [selectedTime, setSelectedTime] = useState(time);
    const [selectedDoctorId, setSelectedDoctorId] = useState(doctorId);

    // Doctor Selection State
    const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
    const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);

    // Dynamic slots from 07:00 to 20:00 with 30-minute intervals (Matches Calendar)
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let h = 7; h <= 20; h++) {
            const hour = h.toString().padStart(2, '0');
            slots.push(`${hour}:00`);
            if (h < 20) slots.push(`${hour}:30`);
        }
        return slots;
    }, []);

    // Appointment Action
    // @ts-ignore
    const [apptState, apptFormAction, isApptPending] = useActionState(createAppointmentAction, { error: '', success: false });

    // Fetch Doctors for selection
    useEffect(() => {
        setIsLoadingDoctors(true);
        Promise.all([
            listDoctorsAction(false),
            getDoctorAction(doctorId)
        ]).then(([allDocs, currentDoc]) => {
            let docs = allDocs || [];
            if (currentDoc && !docs.find(d => d.id === currentDoc.id)) {
                docs = [currentDoc, ...docs];
            }
            setAvailableDoctors(docs);
            setIsLoadingDoctors(false);
        }).catch(err => {
            console.error('[AppointmentModal] Error fetching doctors:', err);
            setIsLoadingDoctors(false);
        });
    }, [doctorId]);

    // Handle Appointment Success
    useEffect(() => {
        if (apptState?.success) {
            router.refresh();
            const timer = setTimeout(() => onClose(), 1500);
            return () => clearTimeout(timer);
        }
    }, [apptState?.success, onClose, router]);

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
                    <div style={{ position: 'absolute', right: '1rem', top: '0.8rem', color: 'var(--text-muted)' }}>
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
                    router.refresh();
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
                    maxWidth: mode === 'register' ? '900px' : '750px',
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
                    gridTemplateColumns: 'minmax(250px, 1fr) 1fr',
                    gap: '1rem',
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderBottom: '1px solid #e2e8f0'
                }}>
                    {/* Date/Time Selector Area */}
                    <div className={styles.slotInfo} style={{ padding: 0, background: 'none', border: 'none', marginBottom: 0, gap: '0.75rem' }}>
                        <div className={styles.slotIcon} style={{ flexShrink: 0 }}>
                            <CalendarIcon size={22} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Horário Selecionado</div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        fontWeight: 800,
                                        fontSize: '0.95rem',
                                        color: 'var(--primary)',
                                        outline: 'none',
                                        padding: 0,
                                        width: '125px',
                                        cursor: 'pointer'
                                    }}
                                />
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <select
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        style={{
                                            appearance: 'none',
                                            background: 'transparent',
                                            border: 'none',
                                            fontWeight: 800,
                                            fontSize: '0.95rem',
                                            color: 'var(--primary)',
                                            outline: 'none',
                                            cursor: 'pointer',
                                            paddingRight: '1rem'
                                        }}
                                    >
                                        {timeSlots.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} style={{ position: 'absolute', right: 0, pointerEvents: 'none', color: 'var(--primary)' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Professional Selector Area */}
                    <div className={styles.slotInfo} style={{ padding: 0, background: 'none', border: 'none', marginBottom: 0, gap: '0.75rem' }}>
                        <div className={styles.slotIcon} style={{ background: 'var(--accent)', color: '#fff', flexShrink: 0 }}>
                            <Stethoscope size={22} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Profissional</div>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '0.15rem' }}>
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
                                        fontSize: '0.95rem',
                                        color: 'var(--primary)',
                                        cursor: isLoadingDoctors ? 'wait' : 'pointer',
                                        paddingRight: '1rem',
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
                                </select>
                                <ChevronDown size={12} style={{ position: 'absolute', right: 0, pointerEvents: 'none', color: 'var(--primary)' }} />
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
                                <input type="hidden" name="date" value={selectedDate} />
                                <input type="hidden" name="time" value={selectedTime} />
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
