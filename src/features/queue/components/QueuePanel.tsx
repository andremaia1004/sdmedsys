'use client';

import { QueueItemWithPatient } from '@/features/queue/types';
import { changeQueueStatusAction, addToQueueAction } from '@/app/actions/queue';
import { useActionState } from 'react';

export default function QueuePanel({ items }: { items: QueueItemWithPatient[] }) {
    return (
        <div>
            <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd' }}>
                <h3>Add to Queue (Manual)</h3>
                <form action={addToQueueAction} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <input name="patientName" placeholder="Patient Name" required style={{ padding: '0.5rem' }} />
                    <select name="doctorId" style={{ padding: '0.5rem' }}>
                        <option value="">General Queue</option>
                        <option value="doc">Dr. House</option>
                    </select>
                    <button type="submit" style={{ padding: '0.5rem', cursor: 'pointer' }}>Add Ticket</button>
                </form>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', backgroundColor: '#eee' }}>
                        <th style={{ padding: '0.5rem' }}>Ticket</th>
                        <th style={{ padding: '0.5rem' }}>Patient</th>
                        <th style={{ padding: '0.5rem' }}>Status</th>
                        <th style={{ padding: '0.5rem' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '0.5rem' }}><strong>{item.ticketCode}</strong></td>
                            <td style={{ padding: '0.5rem' }}>{item.patientName}</td>
                            <td style={{ padding: '0.5rem' }}>
                                <span style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    backgroundColor: item.status === 'CALLED' ? '#d4edda' : '#f8d7da',
                                    color: item.status === 'CALLED' ? '#155724' : '#721c24'
                                }}>
                                    {item.status}
                                </span>
                            </td>
                            <td style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                {item.status === 'WAITING' && (
                                    <form action={async () => {
                                        await changeQueueStatusAction(item.id, 'CALLED');
                                    }}>
                                        <button type="submit" style={{ cursor: 'pointer' }}>Call</button>
                                    </form>
                                )}
                                {item.status === 'CALLED' && (
                                    <form action={async () => {
                                        await changeQueueStatusAction(item.id, 'IN_SERVICE');
                                    }}>
                                        <button type="submit" style={{ cursor: 'pointer' }}>Start</button>
                                    </form>
                                )}
                                <form action={async () => {
                                    await changeQueueStatusAction(item.id, 'NO_SHOW');
                                }}>
                                    <button type="submit" style={{ cursor: 'pointer', color: 'red' }}>No Show</button>
                                </form>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
