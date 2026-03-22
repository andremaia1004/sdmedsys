'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { ActionResponse, formatSuccess, formatError } from '@/lib/action-response';
import {
    createTransaction,
    updateTransactionStatus,
    deleteTransaction,
    createService,
    updateService,
    deleteService,
} from './repository.supabase';
import type {
    FinancialTransaction,
    FinancialService,
    CreateTransactionInput,
    CreateServiceInput,
    UpdateServiceInput,
} from './types';

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function createTransactionAction(
    input: CreateTransactionInput
): Promise<ActionResponse<FinancialTransaction>> {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY']);
        const transaction = await createTransaction(input, user.id);

        await logAudit('CREATE_TRANSACTION', 'FINANCIAL_TRANSACTION', transaction.id, {
            type: input.type,
            amount: input.amount,
            description: input.description,
        }, user);

        revalidatePath('/secretary/financial');
        revalidatePath('/admin/financial');
        return formatSuccess(transaction);
    } catch (e) {
        return formatError(e);
    }
}

export async function markTransactionPaidAction(
    id: string
): Promise<ActionResponse<void>> {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY']);
        await updateTransactionStatus(id, 'PAID');

        await logAudit('UPDATE_TRANSACTION', 'FINANCIAL_TRANSACTION', id, {
            status: 'PAID',
        }, user);

        revalidatePath('/secretary/financial');
        revalidatePath('/admin/financial');
        return formatSuccess();
    } catch (e) {
        return formatError(e);
    }
}

export async function cancelTransactionAction(
    id: string
): Promise<ActionResponse<void>> {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY']);
        await updateTransactionStatus(id, 'CANCELED');

        await logAudit('UPDATE_TRANSACTION', 'FINANCIAL_TRANSACTION', id, {
            status: 'CANCELED',
        }, user);

        revalidatePath('/secretary/financial');
        revalidatePath('/admin/financial');
        return formatSuccess();
    } catch (e) {
        return formatError(e);
    }
}

export async function deleteTransactionAction(
    id: string
): Promise<ActionResponse<void>> {
    try {
        const user = await requireRole(['ADMIN']);
        await deleteTransaction(id);

        await logAudit('DELETE_TRANSACTION', 'FINANCIAL_TRANSACTION', id, {}, user);

        revalidatePath('/secretary/financial');
        revalidatePath('/admin/financial');
        return formatSuccess();
    } catch (e) {
        return formatError(e);
    }
}

// ─── Services ─────────────────────────────────────────────────────────────────

export async function createServiceAction(
    input: CreateServiceInput
): Promise<ActionResponse<FinancialService>> {
    try {
        const user = await requireRole(['ADMIN']);
        const service = await createService(input);

        await logAudit('CREATE_FINANCIAL_SERVICE', 'FINANCIAL_SERVICE', service.id, {
            name: input.name,
            default_price: input.default_price,
        }, user);

        revalidatePath('/admin/financial/services');
        return formatSuccess(service);
    } catch (e) {
        return formatError(e);
    }
}

export async function updateServiceAction(
    id: string,
    input: UpdateServiceInput
): Promise<ActionResponse<FinancialService>> {
    try {
        const user = await requireRole(['ADMIN']);
        const service = await updateService(id, input);

        await logAudit('UPDATE_FINANCIAL_SERVICE', 'FINANCIAL_SERVICE', id, {
            changes: input,
        }, user);

        revalidatePath('/admin/financial/services');
        return formatSuccess(service);
    } catch (e) {
        return formatError(e);
    }
}

export async function deactivateServiceAction(
    id: string
): Promise<ActionResponse<void>> {
    try {
        const user = await requireRole(['ADMIN']);
        await deleteService(id);

        await logAudit('DEACTIVATE_FINANCIAL_SERVICE', 'FINANCIAL_SERVICE', id, {}, user);

        revalidatePath('/admin/financial/services');
        return formatSuccess();
    } catch (e) {
        return formatError(e);
    }
}
