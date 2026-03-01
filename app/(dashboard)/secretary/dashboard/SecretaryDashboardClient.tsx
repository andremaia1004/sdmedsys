'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchDailyDashboardAction, checkInAction } from '@/features/secretary/actions';
import { DashboardItem } from '@/features/secretary/service.dashboard';
import KanbanBoard from '@/features/secretary/components/KanbanBoard';
import NewWalkInModal from '@/features/secretary/components/NewWalkInModal';
import styles from '@/features/secretary/styles/Dashboard.module.css';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RefreshCw, Calendar, Users, Plus, Search } from 'lucide-react';

export default function SecretaryDashboard() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<DashboardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showWalkInModal, setShowWalkInModal] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchDailyDashboardAction(date);
            setItems(res.data || []);
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
        <div className="page-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">Painel Operacional do Dia</h1>
                    <p className="page-subtitle">Modo Híbrido: Agendados e Ordem de Chegada</p>
                </div>
                <div className={styles.filters} style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
                    <div style={{ width: '150px' }}>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={{ height: '42px' }}
                        />
                    </div>
                    <div style={{ width: '320px', position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', bottom: '13px', color: 'var(--text-muted)', zIndex: 10 }} />
                        <Input
                            type="text"
                            placeholder="Buscar paciente ou ticket..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.5rem', height: '42px' }}
                        />
                    </div>
                    <Button onClick={loadData} variant="outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, height: '42px' }}>
                        <RefreshCw size={16} /> Atualizar
                    </Button>
                </div>
            </div>

            <div className={styles.topGrid}>
                <Card padding="none" style={{ overflow: 'hidden' }}>
                    <div className={styles.blockHeader}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', letterSpacing: '0.05em', fontWeight: 700 }}><Calendar size={18} color="var(--primary)" /> HORA MARCADA</h3>
                        <span className={styles.badge}>{scheduledItems.length}</span>
                    </div>
                    <div className={styles.appList}>
                        {scheduledItems.length === 0 ? <p className={styles.noData}>Nenhum agendado pendente.</p> :
                            scheduledItems.map(item => (
                                <div key={item.id} className={styles.appCard}>
                                    <div className={styles.appInfo}>
                                        <strong>{item.start_time ? new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</strong>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>{item.patient_name}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>🩺 {item.doctor_name}</span>
                                        </div>
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
                </Card>

                <Card padding="none" style={{ overflow: 'hidden' }}>
                    <div className={styles.blockHeader}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', letterSpacing: '0.05em', fontWeight: 700 }}><Users size={18} color="var(--warning)" /> CHEGADA (EVENTUAL)</h3>
                    </div>
                    <div className={styles.arrivalContent}>
                        <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>Paciente sem hora marcada? Adicione-o diretamente à fila.</p>
                        <Button onClick={() => setShowWalkInModal(true)} variant="primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.8rem', fontWeight: 700 }}>
                            <Plus size={18} /> Novo Atendimento
                        </Button>
                    </div>
                </Card>
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
