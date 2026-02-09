'use server';

import { requireRole } from '@/lib/session';
import { SecretaryDashboardService, DashboardItem } from './service.dashboard';
import { revalidatePath } from 'next/cache';

export async function fetchDailyDashboardAction(date: string): Promise<DashboardItem[]> {
    try {
        const user = await requireRole(['SECRETARY', 'ADMIN', 'DOCTOR']);
        if (!user.clinicId) return [];
        return await SecretaryDashboardService.getDailyDashboard(user.clinicId, date);
    } catch (error) {
        console.error('fetchDailyDashboardAction Error:', error);
        return [];
    }
}

export async function checkInAction(appointmentId: string) {
    try {
        await requireRole(['SECRETARY', 'ADMIN']);
        const success = await SecretaryDashboardService.markArrived(appointmentId);
        revalidatePath('/secretary/dashboard');
        return { success };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function updateQueueStatusAction(appointmentId: string, queueItemId: string, newStatus: string) {
    try {
        await requireRole(['SECRETARY', 'ADMIN', 'DOCTOR']);
        const success = await SecretaryDashboardService.updateQueueStatus(appointmentId, queueItemId, newStatus);
        revalidatePath('/secretary/dashboard');
        return { success };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function markNoShowAction(appointmentId: string) {
    try {
        await requireRole(['SECRETARY', 'ADMIN']);
        const success = await SecretaryDashboardService.markNoShow(appointmentId);
        revalidatePath('/secretary/dashboard');
        return { success };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
