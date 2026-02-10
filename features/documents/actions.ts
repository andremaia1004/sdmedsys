'use server';

import { requireRole } from '@/lib/session';
import { ClinicalDocumentsRegistryService } from './service.registry';
import { ClinicalDocument } from './types';
import { PdfService } from './service.pdf';
import { PatientService } from '@/features/patients/service';
import { DoctorService } from '@/features/doctors/service';

export async function fetchPatientDocumentsAction(patientId: string): Promise<ClinicalDocument[]> {
    try {
        await requireRole(['ADMIN', 'DOCTOR']);
        return await ClinicalDocumentsRegistryService.listByPatient(patientId);
    } catch (error) {
        console.error('fetchPatientDocumentsAction Error:', error);
        return [];
    }
}

export async function generatePrescriptionAction(
    patientId: string,
    consultationId: string | null,
    medications: string,
    instructions: string
): Promise<{ success: boolean, pdfBase64?: string, error?: string }> {
    try {
        const user = await requireRole(['DOCTOR']);

        if (!user.clinicId) {
            throw new Error('Usuário sem clínica vinculada.');
        }

        // 1. Fetch Data
        const patient = await PatientService.findById(patientId);
        if (!patient) throw new Error('Paciente não encontrado');

        // Ideally fetch Doctor profile name, for now user.id or we need a service
        const doctor = await DoctorService.findById(user.id); // Assuming this works/exists
        const doctorName = doctor?.name || 'Médico';

        // 2. Generate PDF
        const pdfBuffer = await PdfService.generatePrescription({
            patientName: patient.name,
            doctorName: doctorName,
            crm: doctor?.crm,
            medications,
            instructions,
            date: new Date().toISOString()
        });

        // 3. Register Document
        await ClinicalDocumentsRegistryService.createRecord({
            clinicId: user.clinicId,
            patientId,
            consultationId: consultationId || null, // Ensure null if undefined
            doctorId: user.id,
            type: 'prescription',
            issuedAt: new Date().toISOString(),
            meta: { medications },
            createdBy: user.id
        });

        return {
            success: true,
            pdfBase64: pdfBuffer.toString('base64')
        };

    } catch (error: unknown) {
        console.error('generatePrescriptionAction Error:', error);
        const msg = error instanceof Error ? error.message : 'Erro desconhecido';
        return { success: false, error: msg };
    }
}

export async function generateCertificateAction(
    patientId: string,
    consultationId: string | null,
    days: number | undefined,
    cid: string | undefined,
    observation: string | undefined
): Promise<{ success: boolean, pdfBase64?: string, error?: string }> {
    try {
        const user = await requireRole(['DOCTOR']);
        if (!user.clinicId) throw new Error('Usuário sem clínica vinculada.');

        const patient = await PatientService.findById(patientId);
        if (!patient) throw new Error('Paciente não encontrado');

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

        return { success: true, pdfBase64: pdfBuffer.toString('base64') };
    } catch (error) {
        console.error('generateCertificateAction Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
}

export async function generateReportAction(
    patientId: string,
    consultationId: string | null,
    content: string
): Promise<{ success: boolean, pdfBase64?: string, error?: string }> {
    try {
        const user = await requireRole(['DOCTOR']);
        if (!user.clinicId) throw new Error('Usuário sem clínica vinculada.');

        const patient = await PatientService.findById(patientId);
        if (!patient) throw new Error('Paciente não encontrado');

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

        return { success: true, pdfBase64: pdfBuffer.toString('base64') };
    } catch (error) {
        console.error('generateReportAction Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
}

export async function generateExamRequestAction(
    patientId: string,
    consultationId: string | null,
    examList: string,
    justification?: string
): Promise<{ success: boolean, pdfBase64?: string, error?: string }> {
    try {
        const user = await requireRole(['DOCTOR']);
        if (!user.clinicId) throw new Error('Usuário sem clínica vinculada.');

        const patient = await PatientService.findById(patientId);
        if (!patient) throw new Error('Paciente não encontrado');

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

        return { success: true, pdfBase64: pdfBuffer.toString('base64') };
    } catch (error) {
        console.error('generateExamRequestAction Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
}
