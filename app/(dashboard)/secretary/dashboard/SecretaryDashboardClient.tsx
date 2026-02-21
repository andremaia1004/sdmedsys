'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchDailyDashboardAction, checkInAction } from '@/features/secretary/actions';
import { DashboardItem } from '@/features/secretary/service.dashboard';
import KanbanBoard from '@/features/secretary/components/KanbanBoard';
import NewWalkInModal from '@/features/secretary/components/NewWalkInModal';
import styles from '@/features/secretary/styles/Dashboard.module.css';

export default function SecretaryDashboard() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<DashboardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showWalkInModal, setShowWalkInModal] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchDailyDashboardAction(date);
            setItems(data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredItems = items.filter(item =>
        item.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ticket_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const scheduledItems = items.filter(item => item.appointment_status === 'SCHEDULED');

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleInfo}>
                    <h1>Painel Operacional do Dia</h1>
                    <p>Modo Híbrido: Agendados e Ordem de Chegada</p>
                </div>
                <div className={styles.filters}>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={styles.datePicker}
                    />
                    <input
                        type="text"
                        placeholder="Buscar paciente ou ticket..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.search}
                    />
                    <button onClick={loadData} className={styles.refreshBtn}>🔄 Atualizar</button>
                </div>
            </div>

            <div className={styles.topGrid}>
                <div className={styles.scheduledBlock}>
                    <div className={styles.blockHeader}>
                        <h3>📅 Hora Marcada</h3>
                        <span className={styles.badge}>{scheduledItems.length}</span>
                    </div>
                    <div className={styles.appList}>
                        {scheduledItems.length === 0 ? <p className={styles.noData}>Nenhum agendado pendente.</p> :
                            scheduledItems.map(item => (
                                <div key={item.id} className={styles.appCard}>
                                    <div className={styles.appInfo}>
                                        <strong>{item.start_time ? new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</strong>
                                        <span>{item.patient_name}</span>
                                    </div>
                                    <div className={styles.appActions}>
                                        <button onClick={async () => {
                                            await checkInAction(item.id);
                                            loadData();
                                        }} className={styles.checkInBtn}>Check-in</button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>

                <div className={styles.arrivalBlock}>
                    <div className={styles.blockHeader}>
                        <h3>🏃 Chegada (Eventual)</h3>
                    </div>
                    <div className={styles.arrivalContent}>
                        <p>Paciente sem hora marcada? Adicione-o diretamente à fila.</p>
                        <button onClick={() => setShowWalkInModal(true)} className={styles.newArrivalBtn}>➕ Novo Atendimento</button>
                    </div>
                </div>
            </div>

            {showWalkInModal && (
                <NewWalkInModal
                    onClose={() => setShowWalkInModal(false)}
                    onSuccess={loadData}
                />
            )}

            {loading ? (
                <div className={styles.loading}>Carregando dados...</div>
            ) : (
                <KanbanBoard items={filteredItems} onUpdate={loadData} />
            )}
        </div>
    );
}
