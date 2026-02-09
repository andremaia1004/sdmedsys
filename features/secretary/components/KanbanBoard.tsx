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
            case 'PENDING': return items.filter(i => i.appointmentStatus === 'SCHEDULED');
            case 'ARRIVED': return items.filter(i => i.appointmentStatus === 'ARRIVED' && !i.queueItemId);
            case 'WAITING': return items.filter(i => i.queueStatus === 'WAITING');
            case 'CALLED': return items.filter(i => i.queueStatus === 'CALLED');
            case 'IN_SERVICE': return items.filter(i => i.queueStatus === 'IN_SERVICE');
            case 'DONE': return items.filter(i => i.queueStatus === 'DONE' || i.appointmentStatus === 'COMPLETED');
            case 'NO_SHOW': return items.filter(i => i.appointmentStatus === 'NO_SHOW' || i.queueStatus === 'NO_SHOW');
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
                                        {item.ticketCode && <span className={styles.ticket}>{item.ticketCode}</span>}
                                        <span className={styles.sourceLabel}>{item.kind === 'SCHEDULED' ? '📅' : '🏃'}</span>
                                    </div>
                                    <span className={styles.time}>{item.startTime ? new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hora de chegada'}</span>
                                </div>
                                <h4 className={styles.patientName}>{item.patientName}</h4>

                                <div className={styles.actions}>
                                    {item.appointmentStatus === 'SCHEDULED' && (
                                        <>
                                            <button onClick={() => handleAction(() => checkInAction(item.id))} className={styles.actionBtn}>Chegou</button>
                                            <button onClick={() => handleAction(() => markNoShowAction(item.id))} className={styles.noShowBtn}>Faltou</button>
                                        </>
                                    )}
                                    {item.queueStatus === 'WAITING' && (
                                        <button onClick={() => handleAction(() => updateQueueStatusAction(item.id, item.queueItemId!, 'CALLED'))} className={styles.actionBtn}>Chamar</button>
                                    )}
                                    {item.queueStatus === 'CALLED' && (
                                        <button onClick={() => handleAction(() => updateQueueStatusAction(item.id, item.queueItemId!, 'IN_SERVICE'))} className={styles.actionBtn}>Iniciar</button>
                                    )}
                                    {item.queueStatus === 'IN_SERVICE' && (
                                        <button onClick={() => handleAction(() => updateQueueStatusAction(item.id, item.queueItemId!, 'DONE'))} className={styles.doneBtn}>Finalizar</button>
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
