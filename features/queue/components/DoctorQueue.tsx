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
import { useToast } from '@/components/ui/Toast';

interface Props {
    doctorId: string;
}

export default function DoctorQueue({ doctorId }: Props) {
    const router = useRouter();
    const [items, setItems] = useState<QueueItemWithPatient[]>([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetchOperationalQueueAction(doctorId);
            setItems(res.data || []);
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
            showToast('error', result.error || 'Erro ao chamar próximo');
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
            showToast('error', res.error || 'Erro na operação');
        }
    };

    const handleStartConsultation = async (queueItemId: string, patientId: string) => {
        setLoading(true);
        const res = await startConsultationFromQueueAction(queueItemId, patientId);
        if (res.success && res.data) {
            router.push(`/doctor/consultations/${res.data}`);
        } else {
            showToast('error', res.error || 'Erro ao iniciar consulta');
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
                    const isLate = !!item.appointment_id && item.start_time && new Date(item.start_time) < new Date();

                    return (
                        <div key={item.id} className={`${styles.opsCard} ${isCalled ? styles.called : ''}`}>
                            <div className={styles.ticketBadge}>{item.ticket_code}</div>

                            <div className={styles.patientInfo}>
                                <strong>{item.patient_name}</strong>
                            </div>

                            <div>
                                <span className={`${styles.sourceTag} ${!!item.appointment_id ? styles.tagS : styles.tagW}`}>
                                    {!!item.appointment_id ? '📅 Agendado' : '🏃 Encaixe'}
                                </span>
                            </div>

                            <div className={`${styles.timeInfo} ${isLate ? styles.late : ''}`}>
                                {item.start_time ? new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                {isLate && ' (Atrasado)'}
                            </div>

                            <div className={styles.inlineActions}>
                                {item.status === 'WAITING' && !items.some(i => i.status === 'CALLED') && (
                                    <button
                                        onClick={() => handleAction(callNextAction(doctorId))}
                                        className={`${styles.inlineBtn} ${styles.btnCall}`}
                                        style={{
                                            background: 'var(--primary)',
                                            color: '#fff',
                                            borderRadius: '8px',
                                            padding: '0.5rem 1rem',
                                            fontWeight: 700,
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem'
                                        }}
                                    >
                                        <PhoneOutgoing size={14} /> Chamar
                                    </button>
                                )}
                                {item.status === 'CALLED' && (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleStartConsultation(item.id, item.patient_id)}
                                            className={`${styles.inlineBtn} ${styles.btnStart}`}
                                            title="Iniciar Consulta"
                                            style={{
                                                background: '#16a34a',
                                                color: '#fff',
                                                borderRadius: '8px',
                                                padding: '0.5rem 1rem',
                                                fontWeight: 700,
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem'
                                            }}
                                        >
                                            <Play size={14} fill="currentColor" /> Atender
                                        </button>
                                        <button
                                            onClick={() => handleAction(callNextAction(doctorId))}
                                            className={styles.inlineBtn}
                                            title="Chamar Novamente"
                                            style={{
                                                background: '#fff',
                                                color: 'var(--primary)',
                                                border: '1px solid var(--primary)',
                                                borderRadius: '8px',
                                                padding: '0.5rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <RefreshCcw size={16} />
                                        </button>
                                    </div>
                                )}
                                {item.status !== 'CALLED' && item.status !== 'IN_SERVICE' && (
                                    <button
                                        onClick={() => handleAction(quickNoShowAction(item.id))}
                                        className={`${styles.inlineBtn} ${styles.btnCancel}`}
                                        style={{
                                            background: '#fff',
                                            color: '#ef4444',
                                            border: '1px solid #fecaca',
                                            borderRadius: '8px',
                                            padding: '0.5rem',
                                            cursor: 'pointer'
                                        }}
                                        title="Marcar como Falta"
                                    >
                                        <UserX size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
