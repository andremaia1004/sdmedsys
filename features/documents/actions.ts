'use server';

import { requireRole } from '@/lib/session';
import { ClinicalDocumentsRegistryService } from './service.registry';
import { ClinicalDocument } from './types';
import { PdfService } from './service.pdf';
import { PatientService } from '@/features/patients/service';
import { DoctorService } from '@/features/doctors/service';
import { ActionResponse, formatSuccess, formatError } from '@/lib/action-response';

export async function fetchPatientDocumentsAction(patientId: string): Promise<ActionResponse<ClinicalDocument[]>> {
    try {
        await requireRole(['ADMIN', 'DOCTOR']);
        const data = await ClinicalDocumentsRegistryService.listByPatient(patientId);
        return formatSuccess(data);
    } catch (error) {
        return formatError(error);
    }
}

export async function generatePrescriptionAction(
    patientId: string,
    consultationId: string | null,
    medications: string,
    instructions: string
): Promise<ActionResponse<string>> {
    try {
        const user = await requireRole(['DOCTOR']);
        if (!user.clinicId) return { success: false, error: 'Usuário sem clínica vinculada.' };

        const patient = await PatientService.findById(patientId);
        if (!patient) return { success: false, error: 'Paciente não encontrado.' };

        const doctor = await DoctorService.findById(user.id);
        const doctorName = doctor?.name || 'Médico';

        const pdfBuffer = await PdfService.generatePrescription({
            patientName: patient.name,
            doctorName,
            crm: doctor?.crm,
            medications,
            instructions,
            date: new Date().toISOString()
        });

        await ClinicalDocumentsRegistryService.createRecord({
            clinicId: user.clinicId,
            patientId,
            consultationId: consultationId || null,
            doctorId: user.id,
            type: 'prescription',
            issuedAt: new Date().toISOString(),
            meta: { medications },
            createdBy: user.id
        });

        return formatSuccess(pdfBuffer.toString('base64'));
    } catch (error) {
        return formatError(error);
    }
}

export async function generateCertificateAction(
    patientId: string,
    consultationId: string | null,
    days: number | undefined,
    cid: string | undefined,
    observation: string | undefined
): Promise<ActionResponse<string>> {
    try {
        const user = await requireRole(['DOCTOR']);
        if (!user.clinicId) return { success: false, error: 'Usuário sem clínica vinculada.' };

        const patient = await PatientService.findById(patientId);
        if (!patient) return { success: false, error: 'Paciente não encontrado.' };

        const doctor = await DoctorService.findById(user.id);
        const doctorName = doctor?.name || 'Médico';

        const pdfBuffer = await PdfService.generateCertificate({
            patientName: patient.name,
            doctorName,
            crm: doctor?.crm,
            date: new Date().toISOString(),
            days,
            cid,
            observation
        });

        await ClinicalDocumentsRegistryService.createRecord({
            clinicId: user.clinicId,
            patientId,
            consultationId: consultationId || null,
            doctorId: user.id,
            type: 'certificate',
            issuedAt: new Date().toISOString(),
            meta: { days, cid, observation },
            createdBy: user.id
        });

        return formatSuccess(pdfBuffer.toString('base64'));
    } catch (error) {
        return formatError(error);
    }
}

export async function generateReportAction(
    patientId: string,
    consultationId: string | null,
    content: string
): Promise<ActionResponse<string>> {
    try {
        const user = await requireRole(['DOCTOR']);
        if (!user.clinicId) return { success: false, error: 'Usuário sem clínica vinculada.' };

        const patient = await PatientService.findById(patientId);
        if (!patient) return { success: false, error: 'Paciente não encontrado.' };

        const doctor = await DoctorService.findById(user.id);
        const doctorName = doctor?.name || 'Médico';

        const pdfBuffer = await PdfService.generateReport({
            patientName: patient.name,
            doctorName,
            crm: doctor?.crm,
            date: new Date().toISOString(),
            content
        });

        await ClinicalDocumentsRegistryService.createRecord({
            clinicId: user.clinicId,
            patientId,
            consultationId: consultationId || null,
            doctorId: user.id,
            type: 'report',
            issuedAt: new Date().toISOString(),
            meta: { contentSample: content.substring(0, 100) },
            createdBy: user.id
        });

        return formatSuccess(pdfBuffer.toString('base64'));
    } catch (error) {
        return formatError(error);
    }
}

export async function generateExamRequestAction(
    patientId: string,
    consultationId: string | null,
    examList: string,
    justification?: string
): Promise<ActionResponse<string>> {
    try {
        const user = await requireRole(['DOCTOR']);
        if (!user.clinicId) return { success: false, error: 'Usuário sem clínica vinculada.' };

        const patient = await PatientService.findById(patientId);
        if (!patient) return { success: false, error: 'Paciente não encontrado.' };

        const doctor = await DoctorService.findById(user.id);
        const doctorName = doctor?.name || 'Médico';

        const pdfBuffer = await PdfService.generateExamRequest({
            patientName: patient.name,
            doctorName,
            crm: doctor?.crm,
            date: new Date().toISOString(),
            examList,
            justification
        });

        await ClinicalDocumentsRegistryService.createRecord({
            clinicId: user.clinicId,
            patientId,
            consultationId: consultationId || null,
            doctorId: user.id,
            type: 'exam_request',
            issuedAt: new Date().toISOString(),
            meta: { examCount: examList.split('\n').filter(l => l.trim()).length },
            createdBy: user.id
        });

        return formatSuccess(pdfBuffer.toString('base64'));
    } catch (error) {
        return formatError(error);
    }
}

export async function generateReferralAction(
    patientId: string,
    consultationId: string | null,
    specialty: string,
    reason: string,
    clinicalSummary: string,
    observation?: string
): Promise<ActionResponse<string>> {
    try {
        const user = await requireRole(['DOCTOR']);
        if (!user.clinicId) return { success: false, error: 'Usuário sem clínica vinculada.' };

        const patient = await PatientService.findById(patientId);
        if (!patient) return { success: false, error: 'Paciente não encontrado.' };

        const doctor = await DoctorService.findById(user.id);
        const doctorName = doctor?.name || 'Médico';

        const pdfBuffer = await PdfService.generateReferral({
            patientName: patient.name,
            doctorName,
            crm: doctor?.crm,
            date: new Date().toISOString(),
            specialty,
            reason,
            clinicalSummary,
            observation
        });

        await ClinicalDocumentsRegistryService.createRecord({
            clinicId: user.clinicId,
            patientId,
            consultationId: consultationId || null,
            doctorId: user.id,
            type: 'referral',
            issuedAt: new Date().toISOString(),
            meta: { specialty, reasonSample: reason.substring(0, 100) },
            createdBy: user.id
        });

        return formatSuccess(pdfBuffer.toString('base64'));
    } catch (error) {
        return formatError(error);
    }
}
