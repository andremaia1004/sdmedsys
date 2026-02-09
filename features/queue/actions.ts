'use server';

import { QueueService } from '@/features/queue/service';
import { QueueStatus } from '@/features/queue/types';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { DoctorService } from '@/features/doctors/service';

export async function fetchDoctorsAction() {
    try {
        await requireRole(['ADMIN', 'SECRETARY']);
        return await DoctorService.list(true);
    } catch (error) {
        console.error('fetchDoctorsAction Error:', error);
        return [];
    }
}

export async function fetchOperationalQueueAction(doctorId?: string) {
    try {
        await requireRole(['ADMIN', 'SECRETARY']);
        return await QueueService.getOperationalQueue(doctorId);
    } catch (error) {
        console.error('fetchOperationalQueueAction Error:', error);
        return [];
    }
}

export async function callNextAction(doctorId?: string) {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY']);

        // 1. Get the current operational queue
        const queue = await QueueService.getOperationalQueue(doctorId);

        // 2. Find the first WAITING candidate
        const nextItem = queue.find(i => i.status === 'WAITING');

        if (!nextItem) {
            return { success: false, error: 'Não há pacientes aguardando na fila.' };
        }

        // 3. Transition to CALLED
        await QueueService.changeStatus(nextItem.id, 'CALLED', user.role);

        // 4. Audit
        await logAudit('CALL_NEXT', 'QUEUE_ITEM', nextItem.id, {
            patientId: nextItem.patientId,
            doctorId: nextItem.doctorId || doctorId
        });

        revalidatePath('/secretary/queue/ops');
        revalidatePath('/tv');

        return { success: true, item: nextItem };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function quickStartAction(id: string) {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY']);
        await QueueService.changeStatus(id, 'IN_SERVICE', user.role);
        revalidatePath('/secretary/queue/ops');
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function quickNoShowAction(id: string) {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY']);
        await QueueService.changeStatus(id, 'NO_SHOW', user.role);
        revalidatePath('/secretary/queue/ops');
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
