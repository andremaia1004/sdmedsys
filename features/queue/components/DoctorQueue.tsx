'use client';

import { QueueItemWithPatient } from '@/features/queue/types';
import { changeQueueStatusAction } from '@/app/actions/queue';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import Link from 'next/link';

export default function DoctorQueue({ items }: { items: QueueItemWithPatient[] }) {
    const currentPatient = items.find(i => i.status === 'IN_SERVICE');
    const calledPatient = items.find(i => i.status === 'CALLED');
    const waitingList = items.filter(i => i.status === 'WAITING');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {currentPatient && (
                <Card
                    header="Current Service"
                    style={{ borderLeft: '8px solid var(--primary)', backgroundColor: 'rgba(0, 45, 94, 0.02)' }}
                    footer={
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Link href={`/doctor/consultation/${currentPatient.id}`} style={{ flex: 1 }}>
                                <Button fullWidth variant="primary" size="lg">Open Consultation Workspace</Button>
                            </Link>
                            <Button onClick={() => changeQueueStatusAction(currentPatient.id, 'DONE')} variant="secondary" size="lg">
                                Mark as Done
                            </Button>
                        </div>
                    }
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Patient in Room</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>{currentPatient.patientName}</div>
                            <div style={{ marginTop: '0.5rem' }}>
                                <Badge variant="in_service">TICKET: {currentPatient.ticketCode}</Badge>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {calledPatient && !currentPatient && (
                <Card
                    header="Awaiting Arrival"
                    style={{ borderLeft: '8px solid var(--warning)' }}
                    footer={
                        <Button onClick={() => changeQueueStatusAction(calledPatient.id, 'IN_SERVICE')} variant="primary" size="lg" fullWidth>
                            Start Service
                        </Button>
                    }
                >
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>Patient Called</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{calledPatient.patientName}</div>
                        <div style={{ marginTop: '1rem' }}>
                            <Badge variant="called">TICKET: {calledPatient.ticketCode}</Badge>
                        </div>
                    </div>
                </Card>
            )}

            <Card header={`Patients in Queue (${waitingList.length})`} padding="none">
                <Table headers={['Ticket', 'Patient', 'Status', 'Actions']}>
                    {waitingList.map(item => (
                        <tr key={item.id}>
                            <td><strong>{item.ticketCode}</strong></td>
                            <td>{item.patientName}</td>
                            <td><Badge variant="waiting">{item.status}</Badge></td>
                            <td>
                                {!calledPatient && !currentPatient && (
                                    <form action={async () => {
                                        await changeQueueStatusAction(item.id, 'CALLED');
                                    }}>
                                        <Button type="submit" size="sm">
                                            Call Next
                                        </Button>
                                    </form>
                                )}
                            </td>
                        </tr>
                    ))}
                    {waitingList.length === 0 && (
                        <tr>
                            <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No patients waiting.
                            </td>
                        </tr>
                    )}
                </Table>
            </Card>
        </div>
    );
}
