'use server';

import { ConsultationService } from './service';
import { ClinicalEntryService } from './service.clinical';
import { ConsultationInput, Consultation, ClinicalEntry, ClinicalEntryInput } from './types';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export type ActionState = {
    error?: string;
    success?: boolean;
    consultation?: Consultation;
    entry?: ClinicalEntry;
};

export async function startConsultationAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        const user = await requireRole(['DOCTOR']);
        const doctorId = user.id;

        const queueItemId = formData.get('queueItemId') as string;
        const patientId = formData.get('patientId') as string;

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

// --- Clinical Entry Actions ---

export async function upsertClinicalEntryAction(input: ClinicalEntryInput & { id?: string }): Promise<ActionState> {
    try {
        const user = await requireRole(['DOCTOR']);
        // Ensure doctorUserId is the current user
        const entry = await ClinicalEntryService.upsert({
            ...input,
            doctorUserId: user.id
        });

        await logAudit('UPDATE', 'CLINICAL_ENTRY', entry.id, {
            patientId: entry.patientId,
            isFinal: entry.isFinal
        });

        revalidatePath(`/doctor/consultation`);
        revalidatePath(`/patients/${entry.patientId}`);
        return { success: true, entry };
    } catch (err: any) {
        console.error('Upsert Clinical Entry Error:', err);
        return { error: err.message, success: false };
    }
}

export async function finalizeClinicalEntryAction(id: string): Promise<ActionState> {
    try {
        const user = await requireRole(['DOCTOR']);
        const entry = await ClinicalEntryService.finalize(id);

        await logAudit('FINALIZE', 'CLINICAL_ENTRY', entry.id, {
            patientId: entry.patientId
        });

        revalidatePath(`/doctor/consultation`);
        revalidatePath(`/patients/${entry.patientId}`);
        return { success: true, entry };
    } catch (err: any) {
        console.error('Finalize Clinical Entry Error:', err);
        return { error: err.message, success: false };
    }
}

export async function getPatientTimelineAction(patientId: string): Promise<ClinicalEntry[]> {
    try {
        await requireRole(['DOCTOR', 'ADMIN']);
        return await ClinicalEntryService.listByPatient(patientId);
    } catch (err) {
        console.error('Get Patient Timeline Error:', err);
        return [];
    }
}

// Deprecated: Keeping for backward compatibility but redirecting to new logic if possible
export async function updateClinicalNotesAction(id: string, notes: string): Promise<{ success: boolean, error?: string }> {
    try {
        const user = await requireRole(['DOCTOR']);
        // Attempt to find or create entry for this consultation
        const existing = await ClinicalEntryService.findByConsultation(id);

        await ClinicalEntryService.upsert({
            id: existing?.id,
            consultationId: id,
            patientId: existing?.patientId || '', // This is a bit weak for legacy notes update
            doctorUserId: user.id,
            freeNotes: notes,
            isFinal: false,
            chiefComplaint: existing?.chiefComplaint || null,
            diagnosis: existing?.diagnosis || null,
            conduct: existing?.conduct || null,
            observations: existing?.observations || null,
        });

        revalidatePath(`/doctor/consultation`);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function finishConsultationAction(id: string): Promise<{ success: boolean, error?: string }> {
    try {
        const user = await requireRole(['DOCTOR']);

        // Also finalize clinical entry if it exists
        const entry = await ClinicalEntryService.findByConsultation(id);
        if (entry && !entry.isFinal) {
            await ClinicalEntryService.finalize(entry.id);
        }

        await ConsultationService.finish(id, user.id);
        await logAudit('STATUS_CHANGE', 'CONSULTATION', id, { status: 'FINISHED' });

        revalidatePath('/doctor/queue');
        revalidatePath('/doctor/consultation');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function getConsultationAction(id: string): Promise<Consultation | undefined> {
    return await ConsultationService.findById(id);
}

export async function getClinicalEntryAction(consultationId: string): Promise<ClinicalEntry | null> {
    try {
        await requireRole(['DOCTOR']);
        return await ClinicalEntryService.findByConsultation(consultationId);
    } catch (err) {
        console.error('Get Clinical Entry Error:', err);
        return null;
    }
}
