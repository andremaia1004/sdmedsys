import { requireRole } from '@/lib/session';
import {
    getMonthSummary,
    getActiveServices,
    getCurrentMonthRange,
} from '@/features/financial/service';
import { listTransactions } from '@/features/financial/repository.supabase';
import FinancialDashboard from '@/features/financial/components/FinancialDashboard';
import AdminFinancialClient from './AdminFinancialClient';
import styles from '@/features/financial/components/Financial.module.css';

export default async function AdminFinancialPage() {
    await requireRole(['ADMIN']);

    const now = new Date();
    const { startDate, endDate } = getCurrentMonthRange();

    const [summary, transactions, services] = await Promise.all([
        getMonthSummary(now.getFullYear(), now.getMonth() + 1),
        listTransactions({ startDate, endDate }),
        getActiveServices(),
    ]);

    const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <div>
                    <h1>Dashboard Financeiro</h1>
                    <p>Visão geral — {monthLabel}</p>
                </div>
            </div>

            <FinancialDashboard
                summary={summary}
                periodLabel={`Mês atual — ${monthLabel}`}
            />

            <AdminFinancialClient
                initialTransactions={transactions}
                services={services}
            />
        </div>
    );
}
