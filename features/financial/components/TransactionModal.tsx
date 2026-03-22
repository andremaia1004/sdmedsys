'use client';

import { useState } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { createTransactionAction } from '../actions';
import type { FinancialService, TransactionType, CreateTransactionInput } from '../types';
import IncomeForm from './IncomeForm';
import ExpenseForm from './ExpenseForm';
import styles from './Financial.module.css';

interface TransactionModalProps {
    services: FinancialService[];
    consultationId?: string;
    patientId?: string;
    patientName?: string;
    defaultType?: TransactionType;
    onClose: () => void;
    onSuccess: () => void;
}

export default function TransactionModal({
    services,
    consultationId,
    patientId,
    patientName,
    defaultType = 'INCOME',
    onClose,
    onSuccess,
}: TransactionModalProps) {
    const [type, setType] = useState<TransactionType>(defaultType);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(input: CreateTransactionInput) {
        setLoading(true);
        setError('');
        try {
            const result = await createTransactionAction(input);
            if (!result.success) {
                setError(result.error ?? 'Erro ao salvar.');
            } else {
                onSuccess();
            }
        } catch {
            setError('Erro inesperado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    const formId = type === 'EXPENSE' ? 'expense-form' : 'income-form';

    return (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <span className={styles.modalTitle}>
                        {type === 'INCOME' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        Nova Transação
                    </span>
                    <button className={styles.closeBtn} onClick={onClose} type="button">
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {/* Type Toggle */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <div className={styles.typeToggle}>
                            <button
                                type="button"
                                className={`${styles.typeBtn} ${type === 'INCOME' ? styles.activeIncome : ''}`}
                                onClick={() => setType('INCOME')}
                            >
                                <TrendingUp size={15} />
                                Entrada
                            </button>
                            <button
                                type="button"
                                className={`${styles.typeBtn} ${type === 'EXPENSE' ? styles.activeExpense : ''}`}
                                onClick={() => setType('EXPENSE')}
                            >
                                <TrendingDown size={15} />
                                Saída
                            </button>
                        </div>
                    </div>

                    {type === 'INCOME' ? (
                        <IncomeForm
                            services={services}
                            consultationId={consultationId}
                            patientId={patientId}
                            patientName={patientName}
                            onSubmit={handleSubmit}
                            loading={loading}
                        />
                    ) : (
                        <ExpenseForm
                            onSubmit={handleSubmit}
                            loading={loading}
                        />
                    )}

                    {error && <div className={styles.errorMsg} style={{ marginTop: '0.75rem' }}>{error}</div>}
                </div>

                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            padding: '0.6rem 1.2rem',
                            border: '1px solid var(--border, #e2e8f0)',
                            borderRadius: '8px',
                            background: 'var(--card-bg, #fff)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: 'var(--text-muted, #64748b)',
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form={type === 'INCOME' ? 'income-form' : 'expense-form'}
                        disabled={loading}
                        style={{
                            padding: '0.6rem 1.4rem',
                            border: 'none',
                            borderRadius: '8px',
                            background: type === 'INCOME' ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)',
                            color: '#fff',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
