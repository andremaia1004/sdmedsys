'use server';

import { requireRole } from '@/lib/session';
import { SecretaryDashboardService, DashboardItem } from './service.dashboard';
import { revalidatePath } from 'next/cache';
import { ActionResponse, formatSuccess, formatError } from '@/lib/action-response';

export async function fetchDailyDashboardAction(date: string): Promise<ActionResponse<DashboardItem[]>> {
    try {
        const user = await requireRole(['SECRETARY', 'ADMIN', 'DOCTOR']);
        if (!user.clinicId) return formatSuccess([]);
        const data = await SecretaryDashboardService.getDailyDashboard(user.clinicId, date);
        return formatSuccess(data);
    } catch (error) {
        return formatError(error);
    }
}

export async function checkInAction(appointmentId: string): Promise<ActionResponse> {
    try {
        await requireRole(['SECRETARY', 'ADMIN']);
        await SecretaryDashboardService.markArrived(appointmentId);
        revalidatePath('/secretary/dashboard');
        return formatSuccess();
    } catch (error) {
        return formatError(error);
    }
}

export async function updateQueueStatusAction(appointmentId: string, queueItemId: string, newStatus: string): Promise<ActionResponse> {
    try {
        await requireRole(['SECRETARY', 'ADMIN', 'DOCTOR']);
        await SecretaryDashboardService.updateQueueStatus(appointmentId, queueItemId, newStatus);
        revalidatePath('/secretary/dashboard');
        return formatSuccess();
    } catch (error) {
        return formatError(error);
    }
}

export async function markNoShowAction(appointmentId: string): Promise<ActionResponse> {
    try {
        await requireRole(['SECRETARY', 'ADMIN']);
        await SecretaryDashboardService.markNoShow(appointmentId);
        revalidatePath('/secretary/dashboard');
        return formatSuccess();
    } catch (error) {
        return formatError(error);
    }
}

export async function createWalkInAction(patientId: string, doctorId: string, notes?: string): Promise<ActionResponse> {
    try {
        await requireRole(['SECRETARY', 'ADMIN']);
        await SecretaryDashboardService.createWalkIn(patientId, doctorId, notes);
        revalidatePath('/secretary/dashboard');
        return formatSuccess();
    } catch (error) {
        return formatError(error);
    }
}
