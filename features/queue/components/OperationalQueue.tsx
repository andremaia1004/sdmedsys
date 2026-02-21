'use client';

import React, { useState, useEffect } from 'react';
import { QueueItemWithPatient } from '../types';
import {
    fetchOperationalQueueAction,
    callNextAction,
    quickStartAction,
    quickNoShowAction,
    fetchDoctorsAction
} from '../actions';
import { Doctor } from '@/features/doctors/types';
import styles from '../styles/Queue.module.css';
import { PhoneOutgoing, Play, UserX, UserPlus, RefreshCcw } from 'lucide-react';
import NewWalkInModal from '@/features/secretary/components/NewWalkInModal';
import { useToast } from '@/components/ui/Toast';

export default function OperationalQueue() {
    const [items, setItems] = useState<QueueItemWithPatient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
    const { showToast } = useToast();

    const loadData = async () => {
        setLoading(true);
        try {
            const [queueRes, doctorRes] = await Promise.all([
                fetchOperationalQueueAction(selectedDoctorId || undefined),
                fetchDoctorsAction()
            ]);
            setItems(queueRes.data || []);
            if (doctorRes.data && doctorRes.data.length > 0) setDoctors(doctorRes.data);
        } catch (error) {
            console.error('OperationalQueue Load Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedDoctorId]);

    const handleCallNext = async () => {
        const result = await callNextAction(selectedDoctorId || undefined);
        if (result.success) {
            loadData();
        } else {
            showToast('error', result.error || 'Erro ao chamar próximo');
        }
    };

    const handleAction = async (promise: Promise<{ success: boolean; error?: string }>) => {
        const res = await promise;
        if (res.success) loadData();
        else showToast('error', res.error || 'Erro na operação');
    };

    return (
        <div className={styles.opsView}>
            <div className={styles.topBar}>
                <div className={styles.controls}>
                    <select
                        className={styles.doctorFilter}
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                    >
                        <option value="">Todos os Médicos</option>
                        {doctors.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                    <button onClick={loadData} className={styles.secondaryAction} title="Atualizar">
                        <RefreshCcw size={18} />
                    </button>
                </div>

                <div className={styles.controls}>
                    <button onClick={() => setIsWalkInModalOpen(true)} className={styles.secondaryAction}>
                        <UserPlus size={18} style={{ marginRight: '8px' }} />
                        Adicionar Chegada
                    </button>
                    <button onClick={handleCallNext} className={styles.mainAction}>
                        <PhoneOutgoing size={18} />
                        Chamar Próximo
                    </button>
                </div>
            </div>

            <div className={styles.opsList}>
                {loading && <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando fila...</div>}

                {!loading && items.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                        Nenhum paciente aguardando ou chamado no momento.
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

                            <div className={styles.doctorInfo}>
                                {item.doctor_id ? doctors.find(d => d.id === item.doctor_id)?.name || 'Médico' : 'Fila Geral'}
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
                                {item.status === 'WAITING' && (
                                    <button
                                        onClick={() => handleAction(callNextAction(item.doctor_id || undefined))}
                                        className={`${styles.inlineBtn} ${styles.btnCall}`}
                                    >
                                        Chamar
                                    </button>
                                )}
                                {item.status === 'CALLED' && (
                                    <button
                                        onClick={() => handleAction(quickStartAction(item.id))}
                                        className={`${styles.inlineBtn} ${styles.btnStart}`}
                                    >
                                        <Play size={14} style={{ marginRight: '4px' }} />
                                        Iniciar
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

            {isWalkInModalOpen && (
                <NewWalkInModal
                    onClose={() => setIsWalkInModalOpen(false)}
                    onSuccess={() => { setIsWalkInModalOpen(false); loadData(); }}
                />
            )}
        </div>
    );
}
