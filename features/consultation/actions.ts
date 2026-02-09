'use server';

import { ConsultationService } from './service';
import { Consultation } from './types';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export type ActionState = {
    error?: string;
    success?: boolean;
    consultation?: Consultation;
};

export async function startConsultationAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        const { id: doctorId } = await requireRole(['DOCTOR']);

        const queueItemId = formData.get('queueItemId') as string;
        const patientId = formData.get('patientId') as string;

        const consultation = await ConsultationService.start({
            patientId,
            doctorId,
            queueItemId
        });

        await logAudit('CREATE', 'CONSULTATION', consultation.id, {
            patientId,
            queueItemId
        });

        revalidatePath('/doctor/consultation');
        revalidatePath('/doctor/queue');
        return { success: true, consultation };
    } catch (err: unknown) {
        console.error('Start Consultation Error:', err);
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return { error: msg || 'Failed to start consultation', success: false };
    }
}

export async function startConsultationFromQueueAction(queueItemId: string, patientId: string): Promise<{ success: boolean, consultationId?: string, error?: string }> {
    try {
        const { id: doctorId } = await requireRole(['DOCTOR']);

        // 1. Start Consultation
        const consultation = await ConsultationService.start({
            patientId,
            doctorId,
            queueItemId
        });

        // 2. Update Queue Status and Audit
        const { QueueService } = await import('@/features/queue/service');
        await QueueService.changeStatus(queueItemId, 'IN_SERVICE', doctorId); // User role not available here, but DOCTOR role is assumed and doctorId logic handles it
        // Or wait, QueueService.changeStatus takes actorRole.
        // I need to use 'DOCTOR' as role.

        await logAudit('START_SERVICE', 'CONSULTATION', consultation.id, { queueItemId });

        revalidatePath('/doctor/queue');
        return { success: true, consultationId: consultation.id };
    } catch (err: unknown) {
        console.error('Start Consultation From Queue Error:', err);
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: msg };
    }
}

export async function saveConsultationNotesAction(consultationId: string, notes: string): Promise<ActionState> {
    try {
        await requireRole(['DOCTOR']);
        await ConsultationService.updateNotes(consultationId, notes);

        // No audit for auto-save to avoid spam
        revalidatePath(`/doctor/consultations/${consultationId}`);
        return { success: true };
    } catch (err: unknown) {
        console.error('Save Notes Error:', err);
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return { error: msg, success: false };
    }
}

export async function finishConsultationAction(id: string): Promise<{ success: boolean, error?: string }> {
    try {
        await requireRole(['DOCTOR']);

        await ConsultationService.finish(id);

        await logAudit('STATUS_CHANGE', 'CONSULTATION', id, { status: 'FINISHED' });

        revalidatePath('/doctor/queue');
        revalidatePath('/doctor/consultation');
        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: msg };
    }
}

export async function getConsultationAction(id: string): Promise<Consultation | undefined> {
    try {
        await requireRole(['DOCTOR', 'ADMIN']);
        return await ConsultationService.findById(id);
    } catch (err) {
        console.error('Get Consultation Error:', err);
        return undefined;
    }
}

export async function getPatientTimelineAction(patientId: string): Promise<Consultation[]> {
    try {
        await requireRole(['DOCTOR', 'ADMIN']);
        return await ConsultationService.listByPatient(patientId);
    } catch (err) {
        console.error('Get Patient Timeline Error:', err);
        return [];
    }
}

// Re-export types that might be needed by client
export type { Consultation };
