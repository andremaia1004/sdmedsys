'use server';

import { requireRole } from '@/lib/session';
import { PatientAttachmentService, AttachmentCategory, PatientAttachment } from './service.attachments';
import { revalidatePath } from 'next/cache';
import { ActionResponse, formatSuccess, formatError } from '@/lib/action-response';

export async function fetchPatientAttachmentsAction(patientId: string): Promise<ActionResponse<PatientAttachment[]>> {
    try {
        await requireRole(['ADMIN', 'DOCTOR', 'SECRETARY']);
        const data = await PatientAttachmentService.listByPatient(patientId);
        return formatSuccess(data);
    } catch (error) {
        return formatError(error);
    }
}

export async function createAttachmentRecordAction(patientId: string, category: AttachmentCategory, fileName: string, filePath: string, fileType: string): Promise<ActionResponse<PatientAttachment>> {
    try {
        await requireRole(['ADMIN', 'DOCTOR', 'SECRETARY']);
        const attachment = await PatientAttachmentService.createRecord(patientId, category, fileName, filePath, fileType);
        if (!attachment) return { success: false, error: 'Falha ao registrar anexo.' };
        revalidatePath(`/patients/${patientId}`);
        return formatSuccess(attachment);
    } catch (error) {
        return formatError(error);
    }
}

export async function deleteAttachmentRecordAction(id: string, patientId: string): Promise<ActionResponse> {
    try {
        await requireRole(['ADMIN', 'DOCTOR']);
        await PatientAttachmentService.deleteRecord(id);
        revalidatePath(`/patients/${patientId}`);
        return formatSuccess();
    } catch (error) {
        return formatError(error);
    }
}
