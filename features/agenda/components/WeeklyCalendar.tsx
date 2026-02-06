'use client';

import { useState } from 'react';
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

    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const times = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    // Use provided baseDate or today
    const currentBase = baseDate ? new Date(baseDate) : new Date();

    const currentWeekDates = days.map((_, i) => {
        const d = new Date(currentBase);
        // If navigation is handled via baseDate from parent, we just offset from it
        d.setDate(d.getDate() + i);
        return d.toISOString().split('T')[0];
    });

    const handleNavigate = (weeks: number) => {
        const newDate = new Date(currentBase);
        newDate.setDate(newDate.getDate() + (weeks * 7));
        const dateStr = newDate.toISOString().split('T')[0];

        const params = new URLSearchParams(searchParams.toString());
        params.set('date', dateStr);
        router.push(`?${params.toString()}`);
    };

    const getAppointment = (date: string, time: string) => {
        return appointments.find(a => {
            const apptDate = new Date(a.startTime).toISOString().split('T')[0];
            const apptTime = new Date(a.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
                    {new Date(currentWeekDates[0]).toLocaleDateString('pt-BR')} - {new Date(currentWeekDates[6]).toLocaleDateString('pt-BR')}
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
                <div className={styles.grid} style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
                    <div className={styles.timeLabelCell}></div>
                    {days.map((day, i) => (
                        <div key={day} className={styles.dayHeader}>
                            <div className={styles.dayName}>{day}</div>
                            <div className={styles.dayDate}>
                                {new Date(currentWeekDates[i]).getDate()}
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
                                        onClick={() => !appt && setSelectedSlot({ date, time })}
                                    >
                                        {appt ? (
                                            <div className={styles.appointment}>
                                                <div className={styles.patientName}>{appt.patientName}</div>
                                                <div className={styles.apptStatus}>{appt.status}</div>
                                            </div>
                                        ) : (
                                            <div className={styles.plusIcon}>
                                                <Plus size={24} />
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
                    onClose={() => setSelectedSlot(null)}
                />
            )}
        </div>
    );
}
