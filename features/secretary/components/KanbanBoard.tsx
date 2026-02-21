'use client';

import React from 'react';
import { DashboardItem } from '../service.dashboard';
import { checkInAction, updateQueueStatusAction, markNoShowAction } from '../actions';
import styles from '../styles/Dashboard.module.css';

interface KanbanBoardProps {
    items: DashboardItem[];
    onUpdate: () => void;
}

const COLUMNS = [
    { id: 'PENDING', label: 'Pendentes' },
    { id: 'ARRIVED', label: 'Chegaram' },
    { id: 'WAITING', label: 'Aguardando' },
    { id: 'CALLED', label: 'Chamados' },
    { id: 'IN_SERVICE', label: 'Em Atendimento' },
    { id: 'DONE', label: 'Finalizados' },
    { id: 'NO_SHOW', label: 'Faltas' }
];

export default function KanbanBoard({ items, onUpdate }: KanbanBoardProps) {

    const getItemsByColumn = (colId: string) => {
        switch (colId) {
            case 'PENDING': return items.filter(i => i.appointment_status === 'SCHEDULED');
            case 'ARRIVED': return items.filter(i => i.appointment_status === 'ARRIVED' && !i.queue_item_id);
            case 'WAITING': return items.filter(i => i.queue_status === 'WAITING');
            case 'CALLED': return items.filter(i => i.queue_status === 'CALLED');
            case 'IN_SERVICE': return items.filter(i => i.queue_status === 'IN_SERVICE');
            case 'DONE': return items.filter(i => i.queue_status === 'DONE' || i.appointment_status === 'COMPLETED');
            case 'NO_SHOW': return items.filter(i => i.appointment_status === 'NO_SHOW' || i.queue_status === 'NO_SHOW');
            default: return [];
        }
    };

    const handleAction = async (action: () => Promise<{ success: boolean }>) => {
        const { success } = await action();
        if (success) onUpdate();
    };

    return (
        <div className={styles.kanban}>
            {COLUMNS.map(col => (
                <div key={col.id} className={styles.column}>
                    <div className={styles.columnHeader}>
                        <h3>{col.label}</h3>
                        <span className={styles.counter}>{getItemsByColumn(col.id).length}</span>
                    </div>
                    <div className={styles.columnContent}>
                        {getItemsByColumn(col.id).map(item => (
                            <div key={item.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardInfo}>
                                        {item.ticket_code && <span className={styles.ticket}>{item.ticket_code}</span>}
                                        <span className={styles.sourceLabel}>{item.start_time !== null ? '📅' : '🏃'}</span>
                                    </div>
                                    <span className={styles.time} suppressHydrationWarning>
                                        {item.start_time
                                            ? (() => {
                                                try { return new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                                                catch (e) { return 'Tempo indisponível' }
                                            })()
                                            : 'Hora de chegada'}
                                    </span>
                                </div>
                                <h4 className={styles.patientName}>{item.patient_name}</h4>

                                <div className={styles.actions}>
                                    {item.appointment_status === 'SCHEDULED' && (
                                        <>
                                            <button onClick={() => handleAction(() => checkInAction(item.id))} className={styles.actionBtn}>Chegou</button>
                                            <button onClick={() => handleAction(() => markNoShowAction(item.id))} className={styles.noShowBtn}>Faltou</button>
                                        </>
                                    )}
                                    {item.queue_status === 'WAITING' && (
                                        <button onClick={() => handleAction(() => updateQueueStatusAction(item.id, item.queue_item_id!, 'CALLED'))} className={styles.actionBtn}>Chamar</button>
                                    )}
                                    {item.queue_status === 'CALLED' && (
                                        <button onClick={() => handleAction(() => updateQueueStatusAction(item.id, item.queue_item_id!, 'IN_SERVICE'))} className={styles.actionBtn}>Iniciar</button>
                                    )}
                                    {item.queue_status === 'IN_SERVICE' && (
                                        <button onClick={() => handleAction(() => updateQueueStatusAction(item.id, item.queue_item_id!, 'DONE'))} className={styles.doneBtn}>Finalizar</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
