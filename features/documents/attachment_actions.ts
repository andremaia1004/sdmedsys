'use server';

import { requireRole } from '@/lib/session';
import { PatientAttachmentService, AttachmentCategory, PatientAttachment } from './service.attachments';
import { revalidatePath } from 'next/cache';
import { ActionResponse, formatSuccess, formatError } from '@/lib/action-response';
import { supabaseServer } from '@/lib/supabase-server';

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

export async function getAttachmentSignedUrlAction(filePath: string): Promise<ActionResponse<string>> {
    try {
        await requireRole(['ADMIN', 'DOCTOR', 'SECRETARY']);
        const { data, error } = await supabaseServer.storage
            .from('patient_attachments')
            .createSignedUrl(filePath, 3600); // 1 hour expiry
        if (error || !data) return { success: false, error: 'Erro ao gerar URL do arquivo.' };
        return formatSuccess(data.signedUrl);
    } catch (error) {
        return formatError(error);
    }
}
