'use client';

import { useState } from 'react';
import { Appointment } from '@/features/agenda/types';
import AppointmentModal from './AppointmentModal';

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
        // Mock Date Mapping: Assume current week starts Mon Jan 29 2026 for simplicity of MVP Visual
        // Real app would calculate exact dates
        const mockDate = `2026-01-${29 + dayIndex}`;

        return appointments.find(a => {
            const d = new Date(a.startTime);
            // Simple match
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
        <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(5, 1fr)', gap: '1px', backgroundColor: '#ddd', border: '1px solid #ccc' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#f9f9f9' }}></div>
            {DAYS.map(d => <div key={d} style={{ backgroundColor: '#f9f9f9', padding: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>{d}</div>)}

            {/* Grid */}
            {HOURS.map(hour => (
                <>
                    <div key={`h-${hour}`} style={{ backgroundColor: '#fff', padding: '0.5rem', textAlign: 'right', fontSize: '0.8rem', color: '#666' }}>
                        {hour}:00
                    </div>
                    {DAYS.map((_, dayIndex) => {
                        const event = getEvent(dayIndex, hour);
                        return (
                            <div
                                key={`${dayIndex}-${hour}`}
                                onClick={() => !event && handleCellClick(dayIndex, hour)}
                                style={{
                                    backgroundColor: event ? '#e6f7ff' : '#fff',
                                    padding: '0.2rem',
                                    minHeight: '40px',
                                    cursor: !event && role !== 'DOCTOR' ? 'pointer' : 'default',
                                    borderLeft: event ? '3px solid #0070f3' : 'none',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {event ? (
                                    <div>
                                        <strong>{event.patientName}</strong>
                                        <div style={{ fontSize: '0.7rem', color: '#666' }}>{event.status}</div>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </>
            ))}

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
