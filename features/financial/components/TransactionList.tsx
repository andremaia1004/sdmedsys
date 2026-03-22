'use client';

import { useState, useTransition } from 'react';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';
import {
    markTransactionPaidAction,
    cancelTransactionAction,
    deleteTransactionAction,
} from '../actions';
import {
    INCOME_CATEGORY_LABELS,
    EXPENSE_CATEGORY_LABELS,
    PAYMENT_METHOD_LABELS,
    STATUS_LABELS,
} from '../types';
import type { FinancialTransaction, TransactionType, TransactionStatus } from '../types';
import { formatCurrency } from '../service';
import styles from './Financial.module.css';

interface TransactionListProps {
    transactions: FinancialTransaction[];
    isAdmin?: boolean;
    onRefresh: () => void;
}

export default function TransactionList({
    transactions,
    isAdmin = false,
    onRefresh,
}: TransactionListProps) {
    const [filterType, setFilterType] = useState<TransactionType | ''>('');
    const [filterStatus, setFilterStatus] = useState<TransactionStatus | ''>('');
    const [isPending, startTransition] = useTransition();

    const filtered = transactions.filter(t => {
        if (filterType && t.type !== filterType) return false;
        if (filterStatus && t.status !== filterStatus) return false;
        return true;
    });

    function getCategoryLabel(category: string): string {
        return (
            (INCOME_CATEGORY_LABELS as Record<string, string>)[category] ??
            (EXPENSE_CATEGORY_LABELS as Record<string, string>)[category] ??
            category
        );
    }

    function handleMarkPaid(id: string) {
        startTransition(async () => {
            await markTransactionPaidAction(id);
            onRefresh();
        });
    }

    function handleCancel(id: string) {
        if (!confirm('Cancelar esta transação?')) return;
        startTransition(async () => {
            await cancelTransactionAction(id);
            onRefresh();
        });
    }

    function handleDelete(id: string) {
        if (!confirm('Excluir permanentemente esta transação?')) return;
        startTransition(async () => {
            await deleteTransactionAction(id);
            onRefresh();
        });
    }

    return (
        <div>
            {/* Filters */}
            <div className={styles.filtersRow}>
                <select
                    className={styles.filterSelect}
                    value={filterType}
                    onChange={e => setFilterType(e.target.value as TransactionType | '')}
                >
                    <option value="">Todos os tipos</option>
                    <option value="INCOME">Entradas</option>
                    <option value="EXPENSE">Saídas</option>
                </select>
                <select
                    className={styles.filterSelect}
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as TransactionStatus | '')}
                >
                    <option value="">Todos os status</option>
                    <option value="PENDING">Pendente</option>
                    <option value="PAID">Pago</option>
                    <option value="CANCELED">Cancelado</option>
                </select>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginLeft: 'auto' }}>
                    {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className={styles.emptyState}>
                    Nenhuma transação encontrada.
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th>Categoria</th>
                                <th>Pagamento</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Valor</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(t => (
                                <tr key={t.id}>
                                    <td>
                                        <span style={{ fontSize: '0.85rem' }}>
                                            {new Date(t.competency_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.description}>{t.description}</div>
                                        {t.patient?.name && (
                                            <div className={styles.subtext}>{t.patient.name}</div>
                                        )}
                                    </td>
                                    <td>
                                        <span className={styles.subtext}>
                                            {getCategoryLabel(t.category)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={styles.subtext}>
                                            {t.payment_method
                                                ? PAYMENT_METHOD_LABELS[t.payment_method]
                                                : '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={
                                            t.status === 'PAID' ? styles.badgePaid :
                                            t.status === 'PENDING' ? styles.badgePending :
                                            styles.badgeCanceled
                                        }>
                                            {STATUS_LABELS[t.status]}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className={t.type === 'INCOME' ? styles.amountIncome : styles.amountExpense}>
                                            {t.type === 'EXPENSE' ? '−' : '+'}{formatCurrency(t.amount)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.rowActions}>
                                            {t.status === 'PENDING' && (
                                                <button
                                                    className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                                                    onClick={() => handleMarkPaid(t.id)}
                                                    disabled={isPending}
                                                    title="Marcar como pago"
                                                >
                                                    <CheckCircle size={13} />
                                                </button>
                                            )}
                                            {t.status !== 'CANCELED' && (
                                                <button
                                                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                                    onClick={() => handleCancel(t.id)}
                                                    disabled={isPending}
                                                    title="Cancelar"
                                                >
                                                    <XCircle size={13} />
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                                    onClick={() => handleDelete(t.id)}
                                                    disabled={isPending}
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
