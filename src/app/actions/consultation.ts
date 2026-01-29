'use server';

import { ConsultationService } from '@/features/consultation/service';
import { ConsultationInput } from '@/features/consultation/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/session';

export async function startConsultationAction(queueItemId: string, patientId: string) {
    const user = await requireRole(['DOCTOR']); // Only Doctor starts
    const doctorId = user.id;

    // Check if ALREADY has active
    const active = await ConsultationService.getActiveByDoctor(doctorId);
    if (active) {
        redirect(`/doctor/consultation/${active.id}`);
    }

    const input: ConsultationInput = {
        patientId,
        doctorId,
        queueItemId
    };

    const newConsultation = await ConsultationService.start(input);
    revalidatePath('/doctor/queue');
    redirect(`/doctor/consultation/${newConsultation.id}`);
}

export async function updateNotesAction(id: string, notes: string) {
    const user = await requireRole(['DOCTOR']);
    await ConsultationService.updateNotes(id, notes, user.id);
    return { success: true };
}

export async function finishConsultationAction(id: string) {
    const user = await requireRole(['DOCTOR']);
    await ConsultationService.finish(id, user.id);
    redirect('/doctor/queue');
}

export async function getConsultationAction(id: string) {
    // Audit: Admin might read, but Doctor owns it.
    const user = await requireRole(['DOCTOR', 'ADMIN']);
    // Logic inside service (getById) doesn't check ownership yet, should we?
    // Service handles data, Action handles permissions.
    const consult = await ConsultationService.getById(id);
    if (!consult) return undefined;

    if (user.role === 'DOCTOR' && consult.doctorId !== user.id) {
        // Simple Ownership check
        return undefined; // Or throw
    }

    return consult;
}
