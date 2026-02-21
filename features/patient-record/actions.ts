'use server';

import { PatientTimelineService } from './service.timeline';
import { TimelineFilters, TimelineResponse } from './types';
import { getCurrentUser } from '@/lib/session';
import { ActionResponse, formatSuccess, formatError } from '@/lib/action-response';

export async function getClinicalTimelineAction(
    patientId: string,
    page: number = 1,
    limit: number = 20,
    filters?: TimelineFilters
): Promise<ActionResponse<TimelineResponse>> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Acesso não autorizado.' };
        }

        const allowedRoles = ['ADMIN', 'DOCTOR', 'MASTER'];
        if (!allowedRoles.includes(user.role)) {
            return { success: false, error: 'Permissão negada: dados clínicos são restritos.' };
        }

        const result = await PatientTimelineService.getClinicalTimeline(patientId, page, limit, filters);
        return formatSuccess(result);
    } catch (err) {
        return formatError(err);
    }
}
