'use server';

import { PatientTimelineService } from './service.timeline';
import { TimelineFilters, TimelineResponse } from './types';
import { getCurrentUser } from '@/lib/session';

export async function getClinicalTimelineAction(
    patientId: string,
    page: number = 1,
    limit: number = 20,
    filters?: TimelineFilters
): Promise<{ data?: TimelineResponse; error?: string }> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { error: 'Unauthorized' };
        }

        // RBAC: Doctors and Admins only for Clinical Data
        const allowedRoles = ['ADMIN', 'DOCTOR', 'MASTER'];
        if (!allowedRoles.includes(user.role)) {
            return { error: 'Permission Denied: Clinical data is restricted.' };
        }

        const result = await PatientTimelineService.getClinicalTimeline(patientId, page, limit, filters);
        return { data: result };
    } catch (err: unknown) {
        console.error('getClinicalTimelineAction Error:', err);
        return { error: 'Failed to fetch timeline data.' };
    }
}
