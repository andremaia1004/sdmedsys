'use client';

import { QueueItemWithPatient } from '@/features/queue/types';
import { changeQueueStatusAction, addToQueueAction } from '@/app/actions/queue';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import styles from '@/features/patients/styles/Patients.module.css'; // Reuse table styles
import qStyles from '../styles/Queue.module.css';

export default function QueuePanel({ items }: { items: QueueItemWithPatient[] }) {
    return (
        <div className={qStyles.queueContainer}>
            <Card header="Issue Manual Ticket" className={qStyles.manualAdd}>
                <form action={addToQueueAction} className={qStyles.addForm}>
                    <div style={{ flex: 1 }}>
                        <Input name="patientName" label="Patient Name" placeholder="e.g. John Doe" required />
                    </div>
                    <div style={{ width: '200px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.4rem' }}>Doctor</label>
                        <select name="doctorId" style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--bg-surface)'
                        }}>
                            <option value="">General Queue</option>
                            <option value="doc">Dr. House</option>
                        </select>
                    </div>
                    <Button type="submit">Add to Queue</Button>
                </form>
            </Card>

            <Card header="Current Queue" padding="none">
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Ticket</th>
                            <th>Patient</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td><span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{item.ticketCode}</span></td>
                                <td>{item.patientName}</td>
                                <td>
                                    <Badge variant={item.status.toLowerCase() as any}>
                                        {item.status}
                                    </Badge>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {item.status === 'WAITING' && (
                                            <form action={async () => {
                                                await changeQueueStatusAction(item.id, 'CALLED');
                                            }}>
                                                <Button type="submit" size="sm" variant="primary">Call</Button>
                                            </form>
                                        )}
                                        {item.status === 'CALLED' && (
                                            <form action={async () => {
                                                await changeQueueStatusAction(item.id, 'IN_SERVICE');
                                            }}>
                                                <Button type="submit" size="sm" variant="primary">Start</Button>
                                            </form>
                                        )}
                                        <form action={async () => {
                                            await changeQueueStatusAction(item.id, 'NO_SHOW');
                                        }}>
                                            <Button type="submit" size="sm" variant="danger">No Show</Button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Queue is empty.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
