'use client';

import { useMemo, useState } from 'react';
import { Appointment } from '../types';
import styles from '../styles/Agenda.module.css';
import { startConsultationFromAppointmentAction } from '../../consultation/actions';
import { Plus, Play, ChevronLeft, ChevronRight, User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DailyCalendar({
    appointments,
    doctorId,
    date
}: {
    appointments: Appointment[],
    doctorId: string,
    date: string
}) {
    const router = useRouter();
    const [loadingApptId, setLoadingApptId] = useState<string | null>(null);

    // Slots from 07:00 to 20:00 with 30-minute intervals
    const times = useMemo(() => {
        const slots = [];
        for (let h = 7; h <= 20; h++) {
            const hour = h.toString().padStart(2, '0');
            slots.push(`${hour}:00`);
            if (h < 20) slots.push(`${hour}:30`);
        }
        return slots;
    }, []);

    const getAppointment = (time: string) => {
        return appointments.find(a => {
            if (!a.start_time) return false;
            const d = new Date(a.start_time);
            const apptTime = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            return apptTime === time;
        });
    };

    const handleAtender = async (apptId: string, patientId: string) => {
        setLoadingApptId(apptId);
        try {
            const res = await startConsultationFromAppointmentAction(apptId, patientId);
            if (res.success && res.data) {
                router.push(`/doctor/consultations/${res.data}`);
            } else {
                console.error(res.error || 'Erro ao iniciar consulta');
                setLoadingApptId(null);
            }
        } catch (error) {
            console.error('Atender Error:', error);
            setLoadingApptId(null);
        }
    };

    return (
        <div className={styles.calendarWrapper} style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className={styles.dailyHeader} style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                color: '#fff',
                borderRadius: '16px 16px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <div style={{ opacity: 0.8, fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Visão Diária</div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                        {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h2>
                </div>
            </div>

            <div className={styles.dailyScrollArea} style={{ background: '#fff', borderRadius: '0 0 16px 16px', border: '1px solid #e2e8f0', borderTop: 'none' }}>
                {times.map((time, i) => {
                    const appt = getAppointment(time);
                    const isLoading = appt && loadingApptId === appt.id;

                    return (
                        <div key={time} style={{
                            display: 'grid',
                            gridTemplateColumns: '100px 1fr',
                            borderBottom: i === times.length - 1 ? 'none' : '1px solid #f1f5f9',
                            minHeight: '80px'
                        }}>
                            <div style={{
                                padding: '1.5rem 1rem',
                                textAlign: 'right',
                                color: 'var(--text-muted)',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                borderRight: '1px solid #f1f5f9',
                                background: '#fafafa'
                            }}>
                                {time}
                            </div>
                            <div style={{ padding: '0.75rem', position: 'relative' }}>
                                {appt ? (
                                    <div style={{
                                        background: appt.status === 'COMPLETED' ? '#f0fdf4' : '#eff6ff',
                                        border: appt.status === 'COMPLETED' ? '1px solid #bbf7d0' : '1px solid #bfdbfe',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        height: '100%'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: appt.status === 'COMPLETED' ? '#dcfce7' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: appt.status === 'COMPLETED' ? '#16a34a' : '#2563eb' }}>
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{appt.patient_name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                    {appt.start_time ? new Date(appt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''} - {appt.end_time ? new Date(appt.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    <span style={{ marginLeft: '0.5rem' }}>• Cód: {appt.id.slice(0, 8)} • {appt.status === 'SCHEDULED' ? 'Agendado' : appt.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {appt.status !== 'COMPLETED' && (
                                                <button
                                                    disabled={!!loadingApptId}
                                                    onClick={() => handleAtender(appt.id, appt.patient_id)}
                                                    style={{
                                                        background: 'var(--primary)',
                                                        color: '#fff',
                                                        border: 'none',
                                                        padding: '0.6rem 1.2rem',
                                                        borderRadius: '10px',
                                                        fontWeight: 700,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                        opacity: !!loadingApptId && !isLoading ? 0.5 : 1
                                                    }}
                                                >
                                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                                                    Atender
                                                </button>
                                            )}
                                            <button
                                                disabled={!!loadingApptId}
                                                onClick={() => router.push(`/patients/${appt.patient_id}`)}
                                                style={{
                                                    background: '#fff',
                                                    color: 'var(--text-muted)',
                                                    border: '1px solid #e2e8f0',
                                                    padding: '0.6rem',
                                                    borderRadius: '10px',
                                                    cursor: 'pointer'
                                                }}
                                                title="Ver Ficha"
                                            >
                                                <User size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        height: '100%',
                                        border: '2px dashed #f1f5f9',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 1rem',
                                        color: '#cbd5e1',
                                        cursor: 'pointer'
                                    }}
                                        onClick={() => {/* Open Modal handles by Weekly logic if shared */ }}
                                    >
                                        <Plus size={18} style={{ marginRight: '0.5rem' }} /> Livre
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
