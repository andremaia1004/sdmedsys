'use client';

import { useState } from 'react';
import { Appointment } from '@/features/agenda/types';
import AppointmentModal from './AppointmentModal';
import styles from '../styles/Agenda.module.css';

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00 to 18:00
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function WeeklyCalendar({
    appointments = [],
    role,
    doctorId
}: {
    appointments: Appointment[],
    role: string,
    doctorId: string
}) {
    const [modalData, setModalData] = useState<{ date: string, time: string } | null>(null);

    const getEvent = (dayIndex: number, hour: number) => {
        // Mock Date Mapping: Assume current week starts Mon Jan 29 2026
        const mockDate = `2026-01-${29 + dayIndex}`;

        return appointments.find(a => {
            const d = new Date(a.startTime);
            return d.getDate() === (29 + dayIndex) && d.getHours() === hour;
        });
    };

    const handleCellClick = (dayIndex: number, hour: number) => {
        if (role === 'DOCTOR') return; // Read only

        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        const dateStr = `2026-01-${29 + dayIndex}`;
        setModalData({ date: dateStr, time: timeStr });
    };

    return (
        <div className={styles.agendaContainer}>
            <div className={styles.calendarGrid}>
                {/* Header Row */}
                <div className={styles.timeHeaderPlaceholder}></div>
                {DAYS.map(d => (
                    <div key={d} className={styles.dayHeader}>
                        {d}
                    </div>
                ))}

                {/* Hour Rows */}
                {HOURS.map(hour => (
                    <React.Fragment key={`row-${hour}`}>
                        <div className={styles.timeCell}>
                            {hour}:00
                        </div>
                        {DAYS.map((_, dayIndex) => {
                            const event = getEvent(dayIndex, hour);
                            const isClickable = !event && role !== 'DOCTOR';

                            return (
                                <div
                                    key={`${dayIndex}-${hour}`}
                                    onClick={() => isClickable && handleCellClick(dayIndex, hour)}
                                    className={`${styles.calendarCell} ${isClickable ? styles.clickableCell : ''}`}
                                >
                                    {event ? (
                                        <div className={styles.appointment}>
                                            <span className={styles.patientName}>{event.patientName}</span>
                                            <span className={styles.statusText}>{event.status}</span>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>

            {modalData && (
                <AppointmentModal
                    doctorId={doctorId}
                    date={modalData.date}
                    time={modalData.time}
                    onClose={() => setModalData(null)}
                />
            )}
        </div>
    );
}

// React import for Fragment if not available globally in common patterns, but usually standard in TSX
import React from 'react';
