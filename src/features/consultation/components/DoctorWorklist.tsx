'use client';

import { QueueItemWithPatient } from '@/features/queue/types';
import { changeQueueStatusAction } from '@/app/actions/queue';
import { startConsultationAction } from '@/app/actions/consultation';

export default function DoctorWorklist({ items }: { items: QueueItemWithPatient[] }) {
    const currentPatient = items.find(i => i.status === 'IN_SERVICE');
    const calledPatient = items.find(i => i.status === 'CALLED');
    const waitingList = items.filter(i => i.status === 'WAITING');

    return (
        <div>
            {currentPatient && (
                <div style={{ padding: '2rem', backgroundColor: '#e6f7ff', border: '1px solid #1890ff', marginBottom: '2rem', borderRadius: '8px' }}>
                    <h2>In Service</h2>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{currentPatient.patientName}</p>
                    <p>Ticket: {currentPatient.ticketCode}</p>

                    <form action={() => startConsultationAction(currentPatient.id, currentPatient.patientId)}>
                        <button type="submit" style={{ marginTop: '1rem', padding: '0.8rem', backgroundColor: 'green', color: 'white', border: 'none', cursor: 'pointer' }}>
                            Open Consultation Workspace
                        </button>
                    </form>
                </div>
            )}

            {calledPatient && !currentPatient && (
                <div style={{ padding: '2rem', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', marginBottom: '2rem', borderRadius: '8px' }}>
                    <h2>Waiting for Patient</h2>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{calledPatient.patientName}</p>
                    <p>Ticket: {calledPatient.ticketCode}</p>
                    <button onClick={() => changeQueueStatusAction(calledPatient.id, 'IN_SERVICE')} style={{ marginTop: '1rem', padding: '0.8rem', backgroundColor: '#faad14', color: 'white', border: 'none', cursor: 'pointer' }}>
                        Start Service
                    </button>
                </div>
            )}

            <h3>Waiting List</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {waitingList.map(item => (
                    <li key={item.id} style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <strong>{item.ticketCode}</strong> - {item.patientName}
                        </div>
                        {!calledPatient && !currentPatient && (
                            <button onClick={() => changeQueueStatusAction(item.id, 'CALLED')} style={{ padding: '0.5rem', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none' }}>
                                Call Next
                            </button>
                        )}
                    </li>
                ))}
                {waitingList.length === 0 && <p style={{ color: '#888' }}>No patients waiting.</p>}
            </ul>
        </div>
    );
}
