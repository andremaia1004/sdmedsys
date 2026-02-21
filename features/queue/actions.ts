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
        await requireRole(['ADMIN', 'SECRETARY']);
        const data = await QueueService.getOperationalQueue(doctorId);
        return formatSuccess(data);
    } catch (error) {
        return formatError(error);
    }
}

export async function callNextAction(doctorId?: string): Promise<ActionResponse<QueueItemWithPatient>> {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY']);

        const queue = await QueueService.getOperationalQueue(doctorId);
        const nextItem = queue.find(i => i.status === 'WAITING');

        if (!nextItem) {
            return { success: false, error: 'Não há pacientes aguardando na fila.' };
        }

        await QueueService.changeStatus(nextItem.id, 'CALLED', user.role);

        await logAudit('CALL_NEXT', 'QUEUE_ITEM', nextItem.id, {
            patient_id: nextItem.patient_id,
            doctor_id: nextItem.doctor_id || doctorId
        });

        revalidatePath('/secretary/queue/ops');
        revalidatePath('/doctor/queue');
        revalidatePath('/tv');

        return formatSuccess(nextItem);
    } catch (error) {
        return formatError(error);
    }
}

export async function quickStartAction(id: string): Promise<ActionResponse> {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        await QueueService.changeStatus(id, 'IN_SERVICE', user.role);

        await logAudit('START_SERVICE', 'QUEUE_ITEM', id, { actor: user.id });

        revalidatePath('/secretary/queue/ops');
        revalidatePath('/doctor/queue');
        return formatSuccess();
    } catch (error) {
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
