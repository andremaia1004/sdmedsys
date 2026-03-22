import {
    listTransactions,
    getTransactionsByMonth,
    getTodayTransactions,
    listServices,
} from './repository.supabase';
import type {
    FinancialTransaction,
    FinancialSummary,
    TransactionFilters,
    IncomeCategory,
    ExpenseCategory,
    PaymentMethod,
} from './types';

// ─── Summary ──────────────────────────────────────────────────────────────────

export function calculateSummary(transactions: FinancialTransaction[]): FinancialSummary {
    const active = transactions.filter(t => t.status !== 'CANCELED');

    const totalIncome = active
        .filter(t => t.type === 'INCOME' && t.status === 'PAID')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = active
        .filter(t => t.type === 'EXPENSE' && t.status === 'PAID')
        .reduce((sum, t) => sum + t.amount, 0);

    const pendingIncome = active
        .filter(t => t.type === 'INCOME' && t.status === 'PENDING')
        .reduce((sum, t) => sum + t.amount, 0);

    const pendingExpense = active
        .filter(t => t.type === 'EXPENSE' && t.status === 'PENDING')
        .reduce((sum, t) => sum + t.amount, 0);

    const byCategory: Record<string, number> = {};
    for (const t of active) {
        byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    }

    const byPaymentMethod: Record<string, number> = {};
    for (const t of active.filter(t => t.type === 'INCOME' && t.payment_method)) {
        const method = t.payment_method as string;
        byPaymentMethod[method] = (byPaymentMethod[method] ?? 0) + t.amount;
    }

    return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        pendingIncome,
        pendingExpense,
        byCategory,
        byPaymentMethod,
    };
}

// ─── Period Queries ────────────────────────────────────────────────────────────

export async function getMonthSummary(
    year: number,
    month: number
): Promise<FinancialSummary> {
    const transactions = await getTransactionsByMonth(year, month);
    return calculateSummary(transactions);
}

export async function getDaySummary(): Promise<FinancialSummary> {
    const transactions = await getTodayTransactions();
    return calculateSummary(transactions);
}

export async function getFilteredTransactions(
    filters: TransactionFilters
): Promise<FinancialTransaction[]> {
    return listTransactions(filters);
}

// ─── Service Catalog ──────────────────────────────────────────────────────────

export async function getActiveServices() {
    return listServices(true);
}

export async function getAllServices() {
    return listServices(false);
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

export function getCurrentMonthRange(): { startDate: string; endDate: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    return { startDate, endDate };
}
