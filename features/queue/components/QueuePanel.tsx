'use client';

import { useActionState } from 'react';
import { QueueItemWithPatient } from '../types';
import { addToQueueAction, changeQueueStatusAction } from '@/app/actions/queue';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import styles from '../styles/Queue.module.css';

export default function QueuePanel({ items }: { items: QueueItemWithPatient[] }) {
    // @ts-ignore
    const [state, formAction, isPending] = useActionState(addToQueueAction, { error: '' });

    // Map status to Portuguese
    const statusMap: Record<string, string> = {
        'WAITING': 'AGUARDANDO',
        'CALLED': 'CHAMADO',
        'IN_SERVICE': 'EM ATENDIMENTO',
        'DONE': 'CONCLUÍDO'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <Card header="Fila de Espera Digital" padding="none">
                    <Table headers={['Senha', 'Paciente', 'Status', 'Ações']}>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td><strong>{item.ticketCode}</strong></td>
                                <td>{item.patientName || 'Manual/Espontâneo'}</td>
                                <td><Badge variant={item.status.toLowerCase() as any}>{statusMap[item.status] || item.status}</Badge></td>
                                <td>
                                    {item.status === 'WAITING' && (
                                        <Button size="sm" onClick={() => changeQueueStatusAction(item.id, 'CALLED')}>
                                            Chamar
                                        </Button>
                                    )}
                                    {item.status === 'CALLED' && (
                                        <Button size="sm" variant="accent" onClick={() => changeQueueStatusAction(item.id, 'IN_SERVICE')}>
                                            Iniciar
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    Nenhum paciente na fila.
                                </td>
                            </tr>
                        )}
                    </Table>
                </Card>

                <Card header="Senha Espontânea">
                    <form action={formAction} className={styles.manualForm}>
                        <Input
                            label="Nome (Opcional)"
                            name="patientName"
                            placeholder="Ex: Visitante 1"
                        />
                        <Button
                            type="submit"
                            disabled={isPending}
                            variant="primary"
                            fullWidth
                        >
                            {isPending ? 'Gerando...' : 'Gerar Nova Senha'}
                        </Button>
                        {/* @ts-ignore */}
                        {state?.error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{state.error}</p>}
                    </form>
                </Card>
            </div>
        </div>
    );
}
