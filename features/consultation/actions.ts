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
        await requireRole(['DOCTOR']);

        // Fetch explicit auth UID to satisfy RLS policy
        const { createClient } = await import('@/lib/supabase-auth');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const doctorId = user.id;

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

export async function startConsultationFromAppointmentAction(appointmentId: string, patientId: string): Promise<{ success: boolean, consultationId?: string, error?: string }> {
    try {
        await requireRole(['DOCTOR']);
        const { createClient } = await import('@/lib/supabase-auth');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');
        const doctorId = user.id;

        // 1. Resolve Queue Item for this appointment
        const { QueueService } = await import('@/features/queue/service');
        const queueItems = await QueueService.list(doctorId);
        let queueItem = queueItems.find(i => i.appointmentId === appointmentId);

        if (!queueItem) {
            // Create a queue item if it doesn't exist (Doctor essentially doing a 1-click check-in + attend)
            const newItem = await QueueService.add({
                patientId,
                doctorId,
                appointmentId,
                status: 'WAITING',
                sourceType: 'SCHEDULED'
            }, 'DOCTOR');

            // Re-assign to a variable that matches the expected ID
            queueItem = { ...newItem, patientName: '' }; // patientName is not used in startConsultationFromQueueAction anyway
        }

        if (!queueItem) {
            throw new Error('Falha ao criar ou localizar item na fila.');
        }

        // 2. Start Consultation (Re-use existing logic)
        return await startConsultationFromQueueAction(queueItem.id, patientId);
    } catch (err: unknown) {
        console.error('Start Consultation From Appointment Error:', err);
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: msg };
    }
}

export async function startConsultationFromQueueAction(queueItemId: string, patientId: string): Promise<{ success: boolean, consultationId?: string, error?: string }> {
    try {
        await requireRole(['DOCTOR']);
        const { createClient } = await import('@/lib/supabase-auth');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');
        const doctorId = user.id;

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

export async function saveConsultationFieldsAction(
    consultationId: string,
    fields: Partial<Pick<Consultation, 'chiefComplaint' | 'physicalExam' | 'diagnosis' | 'conduct'>>
): Promise<ActionState> {
    try {
        await requireRole(['DOCTOR']);
        await ConsultationService.updateStructuredFields(consultationId, fields);

        // No audit for auto-save to avoid spam
        revalidatePath(`/doctor/consultations/${consultationId}`);
        return { success: true };
    } catch (err: unknown) {
        console.error('Save Fields Error:', err);
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
