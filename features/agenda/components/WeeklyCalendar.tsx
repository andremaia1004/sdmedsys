'use client';

import { useState, useMemo, useCallback } from 'react';
import { Appointment } from '../types';
import AppointmentModal from './AppointmentModal';
import styles from '../styles/Agenda.module.css';
import { startConsultationFromAppointmentAction } from '../../consultation/actions';
import { Plus, ChevronLeft, ChevronRight, Play, User, Info, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function WeeklyCalendar({
    appointments,
    doctorId,
    baseDate
}: {
    appointments: Appointment[],
    doctorId: string,
    role?: string,
    baseDate?: string
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedSlot, setSelectedSlot] = useState<{ date: string, time: string } | null>(null);
    const [loadingApptId, setLoadingApptId] = useState<string | null>(null);

    // Days starting on Sunday (Standard in BR)
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Dynamic slots from 07:00 to 20:00 with 30-minute intervals
    const times = useMemo(() => {
        const slots = [];
        for (let h = 7; h <= 20; h++) {
            const hour = h.toString().padStart(2, '0');
            slots.push(`${hour}:00`);
            if (h < 20) slots.push(`${hour}:30`);
        }
        return slots;
    }, []);

    const currentWeekDates = useMemo(() => {
        const start = baseDate ? new Date(baseDate + 'T00:00:00') : new Date();
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            dates.push(d.toLocaleDateString('en-CA')); // YYYY-MM-DD local
        }
        return dates;
    }, [baseDate]);

    const handleNavigate = (weeks: number) => {
        const start = new Date((baseDate || currentWeekDates[0]) + 'T00:00:00');
        start.setDate(start.getDate() + (weeks * 7));
        const dateStr = start.toLocaleDateString('en-CA');

        const params = new URLSearchParams(searchParams.toString());
        params.set('date', dateStr);
        router.push(`?${params.toString()}`);
    };

    const handleModalClose = useCallback(() => {
        setSelectedSlot(null);
    }, []);

    const getAppointment = (date: string, time: string) => {
        return appointments.find(a => {
            if (!a.start_time) return false;
            const d = new Date(a.start_time);
            const apptDate = d.toLocaleDateString('en-CA'); // YYYY-MM-DD local
            const apptTime = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            return apptDate === date && apptTime === time;
        });
    };

    const handleAtender = async (apptId: string, patientId: string) => {
        setLoadingApptId(apptId);
        try {
            const res = await startConsultationFromAppointmentAction(apptId, patientId);
            if (res.success && res.consultationId) {
                router.push(`/doctor/consultations/${res.consultationId}`);
            } else {
                alert(res.error || 'Erro ao iniciar consulta');
                setLoadingApptId(null);
            }
        } catch (error) {
            console.error('Atender Error:', error);
            alert('Falha na comunicação com o servidor.');
            setLoadingApptId(null);
        }
    };

    const isToday = (date: string) => date === new Date().toLocaleDateString('en-CA');

    return (
        <div className={styles.agendaContainer} style={{ background: 'transparent' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={() => handleNavigate(-1)}
                        style={{ padding: '0.6rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', color: 'var(--primary)' }}
                        title="Semana Anterior"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div style={{
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        color: '#1e293b',
                        letterSpacing: '-0.02em',
                        background: '#fff',
                        padding: '0.6rem 1.5rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                    }}>
                        {new Date(currentWeekDates[0] + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </div>
                    <button
                        onClick={() => handleNavigate(1)}
                        style={{ padding: '0.6rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', color: 'var(--primary)' }}
                        title="Próxima Semana"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ borderRight: '1px solid #e2e8f0' }}></div>
                    {days.map((day, i) => {
                        const dateCode = currentWeekDates[i];
                        const active = isToday(dateCode);
                        return (
                            <div key={day} style={{
                                padding: '1rem',
                                textAlign: 'center',
                                borderRight: i === 6 ? 'none' : '1px solid #e2e8f0',
                                background: active ? '#eff6ff' : 'transparent'
                            }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: active ? 'var(--primary)' : '#64748b', letterSpacing: '0.05em' }}>{day}</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: active ? 'var(--primary)' : '#1e293b' }}>
                                    {new Date(dateCode + 'T00:00:00').getDate()}
                                </div>
                                {active && <div style={{ width: '4px', height: '4px', background: 'var(--primary)', borderRadius: '50%', margin: '4px auto 0' }} />}
                            </div>
                        );
                    })}
                </div>

                <div style={{ maxHeight: '700px', overflowY: 'auto' }}>
                    {times.map(time => (
                        <div key={time} style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{
                                padding: '1rem 0.5rem',
                                textAlign: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: '#94a3b8',
                                background: '#f8fafc',
                                borderRight: '1px solid #e2e8f0'
                            }}>
                                {time}
                            </div>
                            {currentWeekDates.map((date, i) => {
                                const appt = getAppointment(date, time);
                                const isLoading = appt && loadingApptId === appt.id;

                                return (
                                    <div
                                        key={`${date}-${time}`}
                                        style={{
                                            minHeight: '80px',
                                            padding: '4px',
                                            borderRight: i === 6 ? 'none' : '1px solid #f1f5f9',
                                            background: appt ? (appt.status === 'COMPLETED' ? '#f0fdf4' : '#eff6ff') : 'transparent',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                            if (!appt) setSelectedSlot({ date, time });
                                        }}
                                    >
                                        {appt ? (
                                            <div
                                                style={{
                                                    height: '100%',
                                                    borderRadius: '8px',
                                                    padding: '0.5rem',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                                    border: appt.status === 'COMPLETED' ? '1px solid #bbf7d0' : '1px solid #bfdbfe',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.2 }}>
                                                    {appt.patient_name.split(' ')[0]}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                                    {appt.status !== 'COMPLETED' && (
                                                        <button
                                                            disabled={!!loadingApptId}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAtender(appt.id, appt.patient_id);
                                                            }}
                                                            style={{
                                                                background: '#fff',
                                                                border: '1px solid #2563eb',
                                                                color: '#2563eb',
                                                                padding: '0.25rem',
                                                                borderRadius: '6px',
                                                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                                                opacity: !!loadingApptId && !isLoading ? 0.5 : 1
                                                            }}
                                                            title="Atender"
                                                        >
                                                            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                                                        </button>
                                                    )}
                                                    <button
                                                        disabled={!!loadingApptId}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/patients/${appt.patient_id}`);
                                                        }}
                                                        style={{
                                                            background: '#fff',
                                                            border: '1px solid #e2e8f0',
                                                            color: '#64748b',
                                                            padding: '0.25rem',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer'
                                                        }}
                                                        title="Ver Ficha"
                                                    >
                                                        <Info size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="hover-plus">
                                                <Plus size={16} color="var(--primary)" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {selectedSlot && (
                <AppointmentModal
                    doctorId={doctorId}
                    date={selectedSlot.date}
                    time={selectedSlot.time}
                    onClose={handleModalClose}
                />
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                div[style*="cursor: pointer"]:hover .hover-plus {
                    opacity: 1 !important;
                }
            `}} />
        </div>
    );
}
