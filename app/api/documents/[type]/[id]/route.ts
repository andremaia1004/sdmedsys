import { NextRequest, NextResponse } from 'next/server';
import { ClinicalDocumentsRegistryService } from '@/features/documents/service.registry';
import { PatientService } from '@/features/patients/service';
import { DoctorService } from '@/features/doctors/service';
import { generatePrescription, generateCertificate, generateReport, generateExamRequest } from '@/lib/pdf/templates'; // Assuming ExamRequest template exists or will be added
import { getCurrentUser } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ type: string; id: string }> }
) {
    try {
        const { type, id: documentId } = await params;
        const user = await getCurrentUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 1. Fetch the Document Record
        const documentRecord = await ClinicalDocumentsRegistryService.findById(documentId);
        if (!documentRecord) {
            return new NextResponse('Document Not Found', { status: 404 });
        }

        // 2. Security Check (Clinic Tenant is already checked in findById)
        // Additional check if needed: e.g. if type matches record type
        if (documentRecord.type !== type) {
            return new NextResponse('Mismatch Document Type', { status: 400 });
        }

        // 3. Fetch Related Data (Patient & Doctor) to Re-hydrate the PDF
        const patient = await PatientService.findById(documentRecord.patientId);
        const doctor = await DoctorService.findById(documentRecord.doctorId);

        if (!patient || !doctor) {
            return new NextResponse('Referenced Data Not Found (Patient or Doctor)', { status: 500 });
        }

        // 4. Regenerate PDF based on Meta
        let pdfBuffer: Buffer;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const meta = documentRecord.meta as any;

        const commonHeader = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            clinicName: (user as any).clinicName || 'Clínica SDMED',
            clinicAddress: 'Rua Exemplo, 123 - São Paulo/SP', // Ideally fetch from Clinic Service
            clinicPhone: '(11) 99999-9999',
            logoUrl: 'https://placehold.co/150x50/png'
        };

        const patientInfo = {
            name: patient.name,
            document: patient.document,
            birthDate: patient.birth_date || undefined,
            address: patient.address || undefined
        };

        const doctorInfo = {
            name: doctor.name,
            crm: doctor.crm || undefined,
            signatureUrl: undefined // Could fetch if exists
        };

        const dateIssued = new Date(documentRecord.issuedAt).toLocaleDateString('pt-BR');

        if (type === 'prescription') {
            pdfBuffer = await generatePrescription({
                header: commonHeader,
                patient: patientInfo,
                doctor: doctorInfo,
                content: meta.medications || '', // Fallback
                observations: meta.instructions || '',
                date: dateIssued,
                metadata: {
                    consultationId: documentRecord.consultationId || '',
                    patientId: patient.id,
                    doctorId: doctor.id,
                    clinicId: documentRecord.clinicId
                }
            });
            await logAudit('DOWNLOAD_PRESCRIPTION', 'DOCUMENT', documentId, { action: 'DOWNLOAD' });
        } else if (type === 'certificate') {
            pdfBuffer = await generateCertificate({
                header: commonHeader,
                patient: patientInfo,
                doctor: doctorInfo,
                days: meta.days || 0,
                cid: meta.cid,
                date: dateIssued,
                metadata: {
                    consultationId: documentRecord.consultationId || '',
                    patientId: patient.id,
                    doctorId: doctor.id,
                    clinicId: documentRecord.clinicId
                }
            });
            await logAudit('DOWNLOAD_CERTIFICATE', 'DOCUMENT', documentId, { action: 'DOWNLOAD' });
        } else if (type === 'report') {
            pdfBuffer = await generateReport({
                header: commonHeader,
                patient: patientInfo,
                doctor: doctorInfo,
                content: meta.contentSample || meta.content || '',
                date: dateIssued,
                metadata: {
                    consultationId: documentRecord.consultationId || '',
                    patientId: patient.id,
                    doctorId: doctor.id,
                    clinicId: documentRecord.clinicId
                }
            });
            await logAudit('DOWNLOAD_REPORT', 'DOCUMENT', documentId, { action: 'DOWNLOAD' });
        } else if (type === 'exam_request') {
            pdfBuffer = await generateExamRequest({
                header: commonHeader,
                patient: patientInfo,
                doctor: doctorInfo,
                examList: meta.examList || meta.content || '',
                justification: meta.justification,
                date: dateIssued,
                metadata: {
                    consultationId: documentRecord.consultationId || '',
                    patientId: patient.id,
                    doctorId: doctor.id,
                    clinicId: documentRecord.clinicId
                }
            });
            await logAudit('DOWNLOAD_REPORT', 'DOCUMENT', documentId, { action: 'DOWNLOAD' });
        } else {
            return new NextResponse('Unsupported Type', { status: 400 });
        }

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${type}_${patient.name}_${dateIssued}.pdf"`
            }
        });

    } catch (error) {
        console.error('API Document Route Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
