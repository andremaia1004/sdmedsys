'use server';

import { ConsultationService } from './service';
import { ConsultationInput, Consultation } from './types';
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
        const user = await requireRole(['DOCTOR']);
        const doctorId = user.id;

        const queueItemId = formData.get('queueItemId') as string;
        const patientId = formData.get('patientId') as string;

        // Validation: Ensure doctor can only start if they are the one assigned or it's free
        // For MVP, we pass doctorId from session

        const input: ConsultationInput = {
            patientId,
            doctorId,
            queueItemId
        };

        const consultation = await ConsultationService.start(input);

        await logAudit('CREATE', 'CONSULTATION', consultation.id, {
            patientId,
            queueItemId
        });

        revalidatePath('/doctor/consultation');
        revalidatePath('/doctor/queue');
        return { success: true, consultation };
    } catch (err: any) {
        console.error('Start Consultation Error:', err);
        return { error: err.message || 'Failed to start consultation', success: false };
    }
}

export async function updateClinicalNotesAction(id: string, notes: string): Promise<{ success: boolean, error?: string }> {
    try {
        const user = await requireRole(['DOCTOR']);
        await ConsultationService.updateNotes(id, notes, user.id);
        revalidatePath(`/doctor/consultation/${id}`);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function finishConsultationAction(id: string): Promise<{ success: boolean, error?: string }> {
    try {
        const user = await requireRole(['DOCTOR']);
        await ConsultationService.finish(id, user.id);

        await logAudit('STATUS_CHANGE', 'CONSULTATION', id, { status: 'FINISHED' });

        revalidatePath('/doctor/queue');
        revalidatePath('/doctor/consultation');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// For retrieval, not mutation
export async function getConsultationAction(id: string): Promise<Consultation | undefined> {
    const consultation = await ConsultationService.findById(id);
    return consultation;
}
