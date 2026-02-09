'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QueueItemWithPatient } from '@/features/queue/types';
import { changeQueueStatusAction } from '@/app/actions/queue';
import { startConsultationAction } from '../actions';

export default function DoctorWorklist({ items }: { items: QueueItemWithPatient[] }) {
    const currentPatient = items.find(i => i.status === 'IN_SERVICE');
    const calledPatient = items.find(i => i.status === 'CALLED');
    const waitingList = items.filter(i => i.status === 'WAITING');

    const [state, formAction] = useActionState(startConsultationAction, { success: false });
    const router = useRouter();

    if (state?.success && state.consultation) {
        router.push(`/doctor/consultation/${state.consultation.id}`);
    }

    return (
        <div>
            {currentPatient && (
                <div style={{ padding: '2rem', backgroundColor: '#e6f7ff', border: '1px solid #1890ff', marginBottom: '2rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2>In Service</h2>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{currentPatient.patientName}</p>
                            <p>Ticket: {currentPatient.ticketCode}</p>
                        </div>
                        <Link href={`/patients/${currentPatient.patientId}`}>
                            <button style={{ padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid #1890ff', borderRadius: '4px', background: '#fff' }}>Ver Ficha</button>
                        </Link>
                    </div>

                    <form action={formAction}>
                        <input type="hidden" name="queueItemId" value={currentPatient.id} />
                        <input type="hidden" name="patientId" value={currentPatient.patientId} />
                        <button type="submit" style={{ marginTop: '1rem', padding: '0.8rem', backgroundColor: 'green', color: 'white', border: 'none', cursor: 'pointer' }}>
                            Open Consultation Workspace
                        </button>
                    </form>
                    {state?.error && <p style={{ color: 'red' }}>{state.error}</p>}
                </div>
            )}

            {calledPatient && !currentPatient && (
                <div style={{ padding: '2rem', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', marginBottom: '2rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2>Waiting for Patient</h2>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{calledPatient.patientName}</p>
                            <p>Ticket: {calledPatient.ticketCode}</p>
                        </div>
                        <Link href={`/patients/${calledPatient.patientId}`}>
                            <button style={{ padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid #faad14', borderRadius: '4px', background: '#fff' }}>Ver Ficha</button>
                        </Link>
                    </div>
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
                            <strong style={{ background: '#e6f7ff', padding: '2px 6px', borderRadius: '4px' }}>{item.ticketCode}</strong>
                            <span style={{ fontSize: '1rem', marginLeft: '4px', marginRight: '8px' }}>{item.sourceType === 'SCHEDULED' ? '📅' : '🏃'}</span>
                            - {item.patientName}
                            <Link href={`/patients/${item.patientId}`} style={{ marginLeft: '1rem', fontSize: '0.8rem', color: '#0070f3' }}>
                                (Ficha)
                            </Link>
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
