'use client';

import { useState, useCallback } from 'react';
import { Plus, TrendingDown } from 'lucide-react';
import TransactionModal from '@/features/financial/components/TransactionModal';
import TransactionList from '@/features/financial/components/TransactionList';
import type { FinancialTransaction, FinancialService } from '@/features/financial/types';
import styles from '@/features/financial/components/Financial.module.css';

interface AdminFinancialClientProps {
    initialTransactions: FinancialTransaction[];
    services: FinancialService[];
}

export default function AdminFinancialClient({
    initialTransactions,
    services,
}: AdminFinancialClientProps) {
    const [showModal, setShowModal] = useState(false);
    const [modalDefaultType, setModalDefaultType] = useState<'INCOME' | 'EXPENSE'>('INCOME');

    const refresh = useCallback(() => {
        window.location.reload();
    }, []);

    return (
        <>
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionHeaderLeft}>
                        Transações do Mês
                    </span>
                    <div className={styles.headerActions}>
                        <button
                            onClick={() => { setModalDefaultType('INCOME'); setShowModal(true); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.5rem 1rem',
                                background: 'var(--success, #10b981)', color: '#fff',
                                border: 'none', borderRadius: '8px',
                                cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                            }}
                        >
                            <Plus size={14} /> Entrada
                        </button>
                        <button
                            onClick={() => { setModalDefaultType('EXPENSE'); setShowModal(true); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.5rem 1rem',
                                background: 'var(--danger, #ef4444)', color: '#fff',
                                border: 'none', borderRadius: '8px',
                                cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                            }}
                        >
                            <TrendingDown size={14} /> Saída
                        </button>
                    </div>
                </div>
                <div className={styles.sectionBody}>
                    <TransactionList
                        transactions={initialTransactions}
                        isAdmin={true}
                        onRefresh={refresh}
                    />
                </div>
            </div>

            {showModal && (
                <TransactionModal
                    services={services}
                    defaultType={modalDefaultType}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        refresh();
                    }}
                />
            )}
        </>
    );
}
