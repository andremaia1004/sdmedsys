import { supabaseServer } from '@/lib/supabase-server';
import type {
    FinancialTransaction,
    FinancialService,
    CreateTransactionInput,
    CreateServiceInput,
    UpdateServiceInput,
    TransactionFilters,
} from './types';

const DEFAULT_CLINIC_ID = '550e8400-e29b-41d4-a716-446655440000';

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function listTransactions(
    filters: TransactionFilters = {}
): Promise<FinancialTransaction[]> {
    const supabase = supabaseServer;

    let query = supabase
        .from('financial_transactions')
        .select(`
            *,
            patient:patients(name),
            doctor:doctors(name),
            financial_service:financial_services(name)
        `)
        .eq('clinic_id', DEFAULT_CLINIC_ID)
        .order('competency_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (filters.type) query = query.eq('type', filters.type);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.startDate) query = query.gte('competency_date', filters.startDate);
    if (filters.endDate) query = query.lte('competency_date', filters.endDate);
    if (filters.patientId) query = query.eq('patient_id', filters.patientId);

    const { data, error } = await query;
    if (error) throw new Error(`listTransactions: ${error.message}`);
    return (data ?? []) as FinancialTransaction[];
}

export async function getTransaction(id: string): Promise<FinancialTransaction | null> {
    const supabase = supabaseServer;
    const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
            *,
            patient:patients(name),
            doctor:doctors(name),
            financial_service:financial_services(name)
        `)
        .eq('id', id)
        .eq('clinic_id', DEFAULT_CLINIC_ID)
        .single();

    if (error) return null;
    return data as FinancialTransaction;
}

export async function createTransaction(
    input: CreateTransactionInput,
    createdBy: string
): Promise<FinancialTransaction> {
    const supabase = supabaseServer;
    const { data, error } = await supabase
        .from('financial_transactions')
        .insert({
            ...input,
            clinic_id: DEFAULT_CLINIC_ID,
            created_by: createdBy,
            competency_date: input.competency_date ?? new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

    if (error) throw new Error(`createTransaction: ${error.message}`);
    return data as FinancialTransaction;
}

export async function updateTransactionStatus(
    id: string,
    status: 'PAID' | 'CANCELED',
    paidAt?: string
): Promise<void> {
    const supabase = supabaseServer;
    const { error } = await supabase
        .from('financial_transactions')
        .update({
            status,
            paid_at: status === 'PAID' ? (paidAt ?? new Date().toISOString()) : null,
        })
        .eq('id', id)
        .eq('clinic_id', DEFAULT_CLINIC_ID);

    if (error) throw new Error(`updateTransactionStatus: ${error.message}`);
}

export async function deleteTransaction(id: string): Promise<void> {
    const supabase = supabaseServer;
    const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id)
        .eq('clinic_id', DEFAULT_CLINIC_ID);

    if (error) throw new Error(`deleteTransaction: ${error.message}`);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export async function getTransactionsByMonth(
    year: number,
    month: number
): Promise<FinancialTransaction[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // last day of month

    return listTransactions({ startDate, endDate });
}

export async function getTodayTransactions(): Promise<FinancialTransaction[]> {
    const today = new Date().toISOString().split('T')[0];
    return listTransactions({ startDate: today, endDate: today });
}

// ─── Services ─────────────────────────────────────────────────────────────────

export async function listServices(onlyActive = true): Promise<FinancialService[]> {
    const supabase = supabaseServer;
    let query = supabase
        .from('financial_services')
        .select('*')
        .eq('clinic_id', DEFAULT_CLINIC_ID)
        .order('name');

    if (onlyActive) query = query.eq('active', true);

    const { data, error } = await query;
    if (error) throw new Error(`listServices: ${error.message}`);
    return (data ?? []) as FinancialService[];
}

export async function createService(input: CreateServiceInput): Promise<FinancialService> {
    const supabase = supabaseServer;
    const { data, error } = await supabase
        .from('financial_services')
        .insert({ ...input, clinic_id: DEFAULT_CLINIC_ID })
        .select()
        .single();

    if (error) throw new Error(`createService: ${error.message}`);
    return data as FinancialService;
}

export async function updateService(
    id: string,
    input: UpdateServiceInput
): Promise<FinancialService> {
    const supabase = supabaseServer;
    const { data, error } = await supabase
        .from('financial_services')
        .update(input)
        .eq('id', id)
        .eq('clinic_id', DEFAULT_CLINIC_ID)
        .select()
        .single();

    if (error) throw new Error(`updateService: ${error.message}`);
    return data as FinancialService;
}

export async function deleteService(id: string): Promise<void> {
    const supabase = supabaseServer;
    // Soft delete — set active = false
    const { error } = await supabase
        .from('financial_services')
        .update({ active: false })
        .eq('id', id)
        .eq('clinic_id', DEFAULT_CLINIC_ID);

    if (error) throw new Error(`deleteService: ${error.message}`);
}
