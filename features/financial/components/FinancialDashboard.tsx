import { TrendingUp, TrendingDown, Wallet, Clock } from 'lucide-react';
import { formatCurrency } from '../service';
import type { FinancialSummary } from '../types';
import styles from './Financial.module.css';

interface FinancialDashboardProps {
    summary: FinancialSummary;
    periodLabel: string;
}

export default function FinancialDashboard({ summary, periodLabel }: FinancialDashboardProps) {
    const balanceClass = summary.balance >= 0
        ? styles.balancePositive
        : styles.balanceNegative;

    return (
        <div className={styles.summaryGrid}>
            <div className={`${styles.summaryCard} ${styles.income}`}>
                <div className={styles.summaryLabel}>
                    <TrendingUp size={14} />
                    Entradas
                </div>
                <div className={`${styles.summaryValue} ${styles.incomeColor}`}>
                    {formatCurrency(summary.totalIncome)}
                </div>
                <div className={styles.summarySubtext}>{periodLabel}</div>
            </div>

            <div className={`${styles.summaryCard} ${styles.expense}`}>
                <div className={styles.summaryLabel}>
                    <TrendingDown size={14} />
                    Saídas
                </div>
                <div className={`${styles.summaryValue} ${styles.expenseColor}`}>
                    {formatCurrency(summary.totalExpense)}
                </div>
                <div className={styles.summarySubtext}>{periodLabel}</div>
            </div>

            <div className={`${styles.summaryCard} ${styles.balance}`}>
                <div className={styles.summaryLabel}>
                    <Wallet size={14} />
                    Saldo
                </div>
                <div className={`${styles.summaryValue} ${balanceClass}`}>
                    {formatCurrency(summary.balance)}
                </div>
                <div className={styles.summarySubtext}>{periodLabel}</div>
            </div>

            <div className={`${styles.summaryCard} ${styles.pending}`}>
                <div className={styles.summaryLabel}>
                    <Clock size={14} />
                    Pendentes
                </div>
                <div className={styles.summaryValue}>
                    {formatCurrency(summary.pendingIncome + summary.pendingExpense)}
                </div>
                <div className={styles.summarySubtext}>
                    +{formatCurrency(summary.pendingIncome)} / −{formatCurrency(summary.pendingExpense)}
                </div>
            </div>
        </div>
    );
}
