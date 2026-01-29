'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { createAppointmentAction } from '../actions';
import { Patient } from '@/features/patients/types';
import { searchPatientsAction } from '@/features/patients/actions';

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
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);

    // @ts-ignore
    const [state, formAction, isPending] = useActionState(createAppointmentAction, { error: '', success: false });

    if (state?.success) {
        setTimeout(() => onClose(), 1500);
        return (
            <div style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', textAlign: 'center' }}>
                <h3 style={{ color: 'green' }}>Appointment Scheduled!</h3>
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

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '400px' }}>
                <h3>New Appointment</h3>
                <p style={{ marginBottom: '1rem', color: '#666' }}>{date} at {time}</p>

                <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input type="hidden" name="doctorId" value={doctorId} />
                    <input type="hidden" name="date" value={date} />
                    <input type="hidden" name="time" value={time} />

                    {!selectedPatient ? (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Search Patient</label>
                            <input
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Type name..."
                                style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
                            />
                            <ul style={{ border: '1px solid #eee', maxHeight: '100px', overflowY: 'auto', listStyle: 'none', padding: 0 }}>
                                {searchResults.map(p => (
                                    <li
                                        key={p.id}
                                        onClick={() => setSelectedPatient(p)}
                                        style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                                    >
                                        {p.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div style={{ padding: '0.5rem', backgroundColor: '#eef', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{selectedPatient.name}</span>
                            <button type="button" onClick={() => setSelectedPatient(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'red' }}>Change</button>
                            <input type="hidden" name="patientId" value={selectedPatient.id} />
                            <input type="hidden" name="patientName" value={selectedPatient.name} />
                        </div>
                    )}

                    {state?.error && <p style={{ color: 'red' }}>{state.error}</p>}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                        <button
                            type="submit"
                            disabled={!selectedPatient || isPending}
                            style={{ flex: 1, padding: '0.8rem', backgroundColor: '#0070f3', color: 'white', border: 'none', cursor: 'pointer' }}
                        >
                            {isPending ? 'Scheduling...' : 'Confirm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
