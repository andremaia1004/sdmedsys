'use server';

import { requireRole } from '@/lib/session';
import { PatientAttachmentService, AttachmentCategory, PatientAttachment } from './service.attachments';
import { revalidatePath } from 'next/cache';

export async function fetchPatientAttachmentsAction(patientId: string): Promise<PatientAttachment[]> {
    try {
        await requireRole(['ADMIN', 'DOCTOR', 'SECRETARY']);
        return await PatientAttachmentService.listByPatient(patientId);
    } catch (error) {
        console.error('fetchPatientAttachmentsAction Error:', error);
        return [];
    }
}

export async function createAttachmentRecordAction(patientId: string, category: AttachmentCategory, fileName: string, filePath: string, fileType: string) {
    try {
        await requireRole(['ADMIN', 'DOCTOR', 'SECRETARY']);
        const attachment = await PatientAttachmentService.createRecord(patientId, category, fileName, filePath, fileType);
        revalidatePath(`/patients/${patientId}`);
        return { success: true, attachment };
    } catch (error) {
        console.error('createAttachmentRecordAction Error:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteAttachmentRecordAction(id: string, patientId: string) {
    try {
        await requireRole(['ADMIN', 'DOCTOR']);
        const success = await PatientAttachmentService.deleteRecord(id);
        revalidatePath(`/patients/${patientId}`);
        return { success };
    } catch (error) {
        console.error('deleteAttachmentRecordAction Error:', error);
        return { success: false, error: (error as Error).message };
    }
}
