'use server';

import { QueueService } from '@/features/queue/service';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { DoctorService } from '@/features/doctors/service';
import { ActionResponse, formatSuccess, formatError } from '@/lib/action-response';
import { Doctor } from '@/features/doctors/types';
import { QueueItemWithPatient } from '@/features/queue/types';

export async function fetchDoctorsAction(): Promise<ActionResponse<Doctor[]>> {
    try {
        await requireRole(['ADMIN', 'SECRETARY']);
        const data = await DoctorService.list(true);
        return formatSuccess(data);
    } catch (error) {
        return formatError(error);
    }
}

export async function fetchOperationalQueueAction(doctorId?: string): Promise<ActionResponse<QueueItemWithPatient[]>> {
    try {
        console.log('DEBUG: fetchOperationalQueueAction - doctorId:', doctorId);
        await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        const data = await QueueService.getOperationalQueue(doctorId);
        return formatSuccess(data);
    } catch (error) {
        return formatError(error);
    }
}

export async function callNextAction(doctorId?: string): Promise<ActionResponse<QueueItemWithPatient>> {
    try {
        console.log('DEBUG: callNextAction - start', doctorId);
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        console.log('DEBUG: callNextAction - role verified', user.role);

        const queue = await QueueService.getOperationalQueue(doctorId);
        const nextItem = queue.find(i => i.status === 'WAITING');

        if (!nextItem) {
            console.log('DEBUG: callNextAction - no waiting item');
            return { success: false, error: 'Não há pacientes aguardando na fila.' };
        }
        console.log('DEBUG: callNextAction - next item found', nextItem.id);

        await QueueService.changeStatus(nextItem.id, 'CALLED', user.role);
        console.log('DEBUG: callNextAction - status changed to CALLED');

        await logAudit('CALL_NEXT', 'QUEUE_ITEM', nextItem.id, {
            patient_id: nextItem.patient_id,
            doctor_id: nextItem.doctor_id || doctorId
        }, user);

        console.log('DEBUG: callNextAction - revalidating paths');
        revalidatePath('/secretary/queue/ops');
        revalidatePath('/doctor/queue');
        revalidatePath('/tv');

        console.log('DEBUG: callNextAction - success');
        return formatSuccess(nextItem);
    } catch (error) {
        console.error('DEBUG: callNextAction - error:', error);
        return formatError(error);
    }
}

export async function quickStartAction(id: string): Promise<ActionResponse> {
    try {
        console.log('DEBUG: quickStartAction - start', id);
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        console.log('DEBUG: quickStartAction - role verified', user.role);
        await QueueService.changeStatus(id, 'IN_SERVICE', user.role, user.id);
        console.log('DEBUG: quickStartAction - status changed to IN_SERVICE');

        await logAudit('START_SERVICE', 'QUEUE_ITEM', id, { actor: user.id }, user);

        console.log('DEBUG: quickStartAction - revalidating paths');
        revalidatePath('/secretary/queue/ops');
        revalidatePath('/doctor/queue');

        console.log('DEBUG: quickStartAction - success');
        return formatSuccess();
    } catch (error) {
        console.error('DEBUG: quickStartAction - error:', error);
        return formatError(error);
    }
}

export async function quickNoShowAction(id: string): Promise<ActionResponse> {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        await QueueService.changeStatus(id, 'NO_SHOW', user.role);

        await logAudit('NO_SHOW', 'QUEUE_ITEM', id, { actor: user.id });

        revalidatePath('/secretary/queue/ops');
        revalidatePath('/doctor/queue');
        return formatSuccess();
    } catch (error) {
        return formatError(error);
    }
}
