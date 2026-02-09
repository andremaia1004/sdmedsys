'use client';

import React, { useState, useEffect } from 'react';
import { QueueItemWithPatient } from '../types';
import {
    fetchOperationalQueueAction,
    callNextAction,
    quickStartAction,
    quickNoShowAction
} from '../actions';
import { startConsultationFromQueueAction } from '../../consultation/actions';
import styles from '../styles/Queue.module.css';
import { PhoneOutgoing, Play, UserX, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
    doctorId: string;
}

export default function DoctorQueue({ doctorId }: Props) {
    const router = useRouter();
    const [items, setItems] = useState<QueueItemWithPatient[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const queueData = await fetchOperationalQueueAction(doctorId);
            setItems(queueData || []);
        } catch (error) {
            console.error('DoctorQueue Load Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [doctorId]);

    const handleCallNext = async () => {
        const result = await callNextAction(doctorId);
        if (result.success) {
            loadData();
        } else {
            alert(result.error);
        }
    };

    const handleAction = async (promise: Promise<{ success: boolean; error?: string }>, redirectPath?: string) => {
        const res = await promise;
        if (res.success) {
            if (redirectPath) {
                router.push(redirectPath);
            } else {
                loadData();
            }
        } else {
            alert(res.error);
        }
    };

    const handleStartConsultation = async (queueItemId: string, patientId: string) => {
        setLoading(true);
        const res = await startConsultationFromQueueAction(queueItemId, patientId);
        if (res.success && res.consultationId) {
            router.push(`/doctor/consultations/${res.consultationId}`);
        } else {
            alert(res.error || 'Erro ao iniciar consulta');
            setLoading(false);
            loadData();
        }
    };

    // Derived state
    const calledPatient = items.find(i => i.status === 'CALLED');

    return (
        <div className={styles.opsView}>
            <div className={styles.topBar}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)', margin: 0 }}>Fila de Atendimento</h2>

                <div className={styles.controls}>
                    <button onClick={loadData} className={styles.secondaryAction} title="Atualizar">
                        <RefreshCcw size={18} />
                    </button>
                    {!calledPatient && (
                        <button onClick={handleCallNext} className={styles.mainAction}>
                            <PhoneOutgoing size={18} />
                            Chamar Próximo
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.opsList}>
                {loading && <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando fila...</div>}

                {!loading && items.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                        Nenhum paciente na fila.
                    </div>
                )}

                {items.map(item => {
                    const isCalled = item.status === 'CALLED';
                    const isLate = item.sourceType === 'SCHEDULED' && item.startTime && new Date(item.startTime) < new Date();

                    return (
                        <div key={item.id} className={`${styles.opsCard} ${isCalled ? styles.called : ''}`}>
                            <div className={styles.ticketBadge}>{item.ticketCode}</div>

                            <div className={styles.patientInfo}>
                                <strong>{item.patientName}</strong>
                            </div>

                            <div>
                                <span className={`${styles.sourceTag} ${item.sourceType === 'SCHEDULED' ? styles.tagS : styles.tagW}`}>
                                    {item.sourceType === 'SCHEDULED' ? '📅 Agendado' : '🏃 Encaixe'}
                                </span>
                            </div>

                            <div className={`${styles.timeInfo} ${isLate ? styles.late : ''}`}>
                                {item.startTime ? new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                {isLate && ' (Atrasado)'}
                            </div>

                            <div className={styles.inlineActions}>
                                {item.status === 'WAITING' && !calledPatient && (
                                    <button
                                        onClick={() => handleAction(callNextAction(doctorId))}
                                        className={`${styles.inlineBtn} ${styles.btnCall}`}
                                    >
                                        Chamar
                                    </button>
                                )}
                                {item.status === 'CALLED' && (
                                    <button
                                        onClick={() => handleStartConsultation(item.id, item.patientId)}
                                        className={`${styles.inlineBtn} ${styles.btnStart}`}
                                        title="Iniciar Consulta"
                                    >
                                        <Play size={14} style={{ marginRight: '4px' }} />
                                        Atender
                                    </button>
                                )}
                                <button
                                    onClick={() => handleAction(quickNoShowAction(item.id))}
                                    className={`${styles.inlineBtn} ${styles.btnCancel}`}
                                >
                                    <UserX size={14} style={{ marginRight: '4px' }} />
                                    Faltou
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
