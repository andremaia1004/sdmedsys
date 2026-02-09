'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchDailyDashboardAction } from '@/features/secretary/actions';
import { DashboardItem } from '@/features/secretary/service.dashboard';
import KanbanBoard from '@/features/secretary/components/KanbanBoard';
import styles from '@/features/secretary/styles/Dashboard.module.css';

export default function SecretaryDashboard() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<DashboardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
        item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ticketCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleInfo}>
                    <h1>Painel Operacional do Dia</h1>
                    <p>Gerencie o fluxo de pacientes por ordem de chegada</p>
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

            {loading ? (
                <div className={styles.loading}>Carregando dados...</div>
            ) : (
                <KanbanBoard items={filteredItems} onUpdate={loadData} />
            )}
        </div>
    );
}
