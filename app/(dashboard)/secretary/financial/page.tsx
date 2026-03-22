import { requireRole } from '@/lib/session';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { getTodayTransactions } from '@/features/financial/repository.supabase';
import { getActiveServices } from '@/features/financial/service';
import { calculateSummary } from '@/features/financial/service';
import FinancialDashboard from '@/features/financial/components/FinancialDashboard';
import SecretaryFinancialClient from './SecretaryFinancialClient';
import styles from '@/features/financial/components/Financial.module.css';

export default async function SecretaryFinancialPage() {
    await requireRole(['ADMIN', 'SECRETARY']);

    const [todayTransactions, services] = await Promise.all([
        getTodayTransactions(),
        getActiveServices(),
    ]);

    const summary = calculateSummary(todayTransactions);
    const today = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long'
    });

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <div>
                    <h1>Caixa do Dia</h1>
                    <p>{today}</p>
                </div>
            </div>

            <FinancialDashboard summary={summary} periodLabel="Hoje" />

            <SecretaryFinancialClient
                initialTransactions={todayTransactions}
                services={services}
            />
        </div>
    );
}
