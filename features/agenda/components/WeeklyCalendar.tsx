'use client';

import { useState, useMemo, useCallback } from 'react';
import { Appointment } from '../types';
import AppointmentModal from './AppointmentModal';
import styles from '../styles/Agenda.module.css';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
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

    // Calculate current week dates based on baseDate (which should be a Sunday)
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

    const getAppointment = (date: string, time: string) => {
        return appointments.find(a => {
            // a.startTime is ISO (UTC). Convert to local for display.
            const d = new Date(a.startTime);
            const apptDate = d.toLocaleDateString('en-CA'); // YYYY-MM-DD local
            const apptTime = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            return apptDate === date && apptTime === time;
        });
    };

    return (
        <div className={styles.agendaContainer}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                <button
                    onClick={() => handleNavigate(-1)}
                    className={styles.navButton}
                    title="Semana Anterior"
                >
                    <ChevronLeft size={20} />
                </button>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', letterSpacing: '-0.01em' }}>
                    {new Date(currentWeekDates[0] + 'T00:00:00').toLocaleDateString('pt-BR')} - {new Date(currentWeekDates[6] + 'T00:00:00').toLocaleDateString('pt-BR')}
                </div>
                <button
                    onClick={() => handleNavigate(1)}
                    className={styles.navButton}
                    title="Próxima Semana"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className={styles.calendarWrapper}>
                <div className={styles.grid} style={{ gridTemplateColumns: '70px repeat(7, 1fr)' }}>
                    <div className={styles.timeLabelCell}></div>
                    {days.map((day, i) => (
                        <div key={day} className={styles.dayHeader}>
                            <div className={styles.dayName}>{day}</div>
                            <div className={styles.dayDate}>
                                {new Date(currentWeekDates[i] + 'T00:00:00').getDate()}
                            </div>
                        </div>
                    ))}

                    {times.map(time => (
                        <div key={time} className={styles.row}>
                            <div className={styles.timeLabel}>{time}</div>
                            {currentWeekDates.map(date => {
                                const appt = getAppointment(date, time);
                                return (
                                    <div
                                        key={`${date}-${time}`}
                                        className={styles.cell}
                                        style={{ minHeight: '60px' }}
                                        onClick={() => !appt && setSelectedSlot({ date, time })}
                                    >
                                        {appt ? (
                                            <div className={styles.appointment}>
                                                <div className={styles.patientName} title={appt.patientName}>
                                                    {appt.patientName.split(' ')[0]}
                                                </div>
                                                <div className={styles.apptStatus}>{appt.status === 'SCHEDULED' ? 'Agendado' : appt.status}</div>
                                            </div>
                                        ) : (
                                            <div className={styles.plusIcon}>
                                                <Plus size={18} />
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
                    onClose={useCallback(() => setSelectedSlot(null), [])}
                />
            )}
        </div>
    );
}
