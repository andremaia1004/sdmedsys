'use server';

import { ConsultationService } from './service';
import { Consultation } from './types';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { ActionResponse, formatSuccess, formatError } from '@/lib/action-response';

export async function startConsultationAction(prevState: ActionResponse<Consultation>, formData: FormData): Promise<ActionResponse<Consultation>> {
    try {
        const sessionUser = await requireRole(['DOCTOR']);
        const doctorId = sessionUser.id;

        const queueItemId = formData.get('queueItemId') as string;
        const patientId = formData.get('patientId') as string;

        const consultation = await ConsultationService.start({
            patient_id: patientId,
            doctor_id: doctorId,
            queue_item_id: queueItemId
        });

        await logAudit('CREATE', 'CONSULTATION', consultation.id, {
            patient_id: patientId,
            queue_item_id: queueItemId
        });

        revalidatePath('/doctor/consultation');
        revalidatePath('/doctor/queue');
        return formatSuccess(consultation);
    } catch (err) {
        return formatError(err);
    }
}

export async function startConsultationFromAppointmentAction(appointmentId: string, patientId: string): Promise<ActionResponse<string>> {
    try {
        const sessionUser = await requireRole(['DOCTOR']);
        const doctorId = sessionUser.id;

        const { QueueService } = await import('@/features/queue/service');
        const queueItems = await QueueService.list(doctorId);
        let queueItem = queueItems.find(i => i.appointment_id === appointmentId);

        if (!queueItem) {
            const newItem = await QueueService.add({
                patient_id: patientId,
                doctor_id: doctorId,
                appointment_id: appointmentId,
                status: 'WAITING',
                clinic_id: sessionUser.clinicId || '550e8400-e29b-41d4-a716-446655440000'
            }, 'DOCTOR');

            queueItem = { ...newItem, patient_name: '' } as any;
        }

        if (!queueItem) {
            return { success: false, error: 'Falha ao criar ou localizar item na fila.' };
        }

        return await startConsultationFromQueueAction(queueItem.id, patientId);
    } catch (err) {
        return formatError(err);
    }
}

export async function startConsultationFromQueueAction(queueItemId: string, patientId: string): Promise<ActionResponse<string>> {
    try {
        const sessionUser = await requireRole(['DOCTOR']);
        const doctorId = sessionUser.id;

        const consultation = await ConsultationService.start({
            patient_id: patientId,
            doctor_id: doctorId,
            queue_item_id: queueItemId
        });

        const { QueueService } = await import('@/features/queue/service');
        await QueueService.changeStatus(queueItemId, 'IN_SERVICE', 'DOCTOR');

        await logAudit('CREATE', 'CONSULTATION', consultation.id, { patient_id: patientId, queue_item_id: queueItemId });

        revalidatePath('/doctor/queue');
        return formatSuccess(consultation.id);
    } catch (err) {
        return formatError(err);
    }
}

export async function saveConsultationFieldsAction(
    consultationId: string,
    fields: Partial<Pick<Consultation, 'chief_complaint' | 'diagnosis' | 'conduct'>>
): Promise<ActionResponse> {
    try {
        await requireRole(['DOCTOR']);
        await ConsultationService.updateStructuredFields(consultationId, fields);

        revalidatePath(`/doctor/consultations/${consultationId}`);
        return formatSuccess();
    } catch (err) {
        return formatError(err);
    }
}

export async function finishConsultationAction(id: string): Promise<ActionResponse> {
    try {
        await requireRole(['DOCTOR']);

        await ConsultationService.finish(id);

        await logAudit('STATUS_CHANGE', 'CONSULTATION', id, { status: 'FINISHED' });

        revalidatePath('/doctor/queue');
        revalidatePath('/doctor/consultation');
        return formatSuccess();
    } catch (err) {
        return formatError(err);
    }
}

export async function getConsultationAction(id: string): Promise<ActionResponse<Consultation>> {
    try {
        await requireRole(['DOCTOR', 'ADMIN']);
        const data = await ConsultationService.findById(id);
        return formatSuccess(data);
    } catch (err) {
        return formatError(err);
    }
}

export async function getPatientTimelineAction(patientId: string): Promise<ActionResponse<Consultation[]>> {
    try {
        await requireRole(['DOCTOR', 'ADMIN']);
        const data = await ConsultationService.listByPatient(patientId);
        return formatSuccess(data);
    } catch (err) {
        return formatError(err);
    }
}

// Re-export types that might be needed by client
export type { Consultation };
