'use client';

import { useState } from 'react';
import { Appointment } from '../types';
import AppointmentModal from './AppointmentModal';
import styles from '../styles/Agenda.module.css';

export default function WeeklyCalendar({
    appointments,
    doctorId
}: {
    appointments: Appointment[],
    doctorId: string
}) {
    const [selectedSlot, setSelectedSlot] = useState<{ date: string, time: string } | null>(null);

    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    const times = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    // Get current week dates
    const today = new Date();
    const currentWeekDates = days.map((_, i) => {
        const d = new Date(today);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) + i;
        const dateObj = new Date(d.setDate(diff));
        return dateObj.toISOString().split('T')[0];
    });

    const getAppointment = (date: string, time: string) => {
        return appointments.find(a => {
            const apptDate = new Date(a.startTime).toISOString().split('T')[0];
            const apptTime = new Date(a.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            return apptDate === date && apptTime === time;
        });
    };

    return (
        <div className={styles.calendarContainer}>
            <div className={styles.grid}>
                <div className={styles.timeLabel}></div>
                {days.map((day, i) => (
                    <div key={day} className={styles.dayHeader}>
                        <div className={styles.dayName}>{day}</div>
                        <div className={styles.dayDate}>
                            {new Date(currentWeekDates[i]).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
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
                                    className={`${styles.cell} ${appt ? styles.occupied : styles.empty}`}
                                    onClick={() => !appt && setSelectedSlot({ date, time })}
                                >
                                    {appt ? (
                                        <div className={styles.appointment}>
                                            <div className={styles.patientName}>{appt.patientName}</div>
                                            <div className={styles.apptStatus}>{appt.status}</div>
                                        </div>
                                    ) : (
                                        <span className={styles.plusIcon}>+</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
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
