import { NextRequest, NextResponse } from 'next/server';
import { ClinicalDocumentsRegistryService } from '@/features/documents/service.registry';
import { PatientService } from '@/features/patients/service';
import { DoctorService } from '@/features/doctors/service';
import { PdfService } from '@/features/documents/service.pdf';
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
        if (documentRecord.type !== type) {
            return new NextResponse('Mismatch Document Type', { status: 400 });
        }

        // 3. Fetch Related Data (Patient & Doctor) to Re-hydrate the PDF
        const patient = await PatientService.findById(documentRecord.patientId);
        const doctor = await DoctorService.findById(documentRecord.doctorId);

        if (!patient || !doctor) {
            return new NextResponse('Referenced Data Not Found (Patient or Doctor)', { status: 500 });
        }

        // 4. Regenerate PDF using consolidated PdfService
        let pdfBuffer: Buffer;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const meta = documentRecord.meta as any;
        const dateIssued = new Date(documentRecord.issuedAt).toLocaleDateString('pt-BR');

        switch (type) {
            case 'prescription':
                pdfBuffer = await PdfService.generatePrescription({
                    patientName: patient.name,
                    doctorName: doctor.name,
                    crm: doctor.crm || undefined,
                    medications: meta.medications || '',
                    instructions: meta.instructions || '',
                    date: dateIssued
                });
                break;
            case 'certificate':
                pdfBuffer = await PdfService.generateCertificate({
                    patientName: patient.name,
                    doctorName: doctor.name,
                    crm: doctor.crm || undefined,
                    date: dateIssued,
                    days: meta.days,
                    cid: meta.cid,
                    observation: meta.observation
                });
                break;
            case 'report':
                pdfBuffer = await PdfService.generateReport({
                    patientName: patient.name,
                    doctorName: doctor.name,
                    crm: doctor.crm || undefined,
                    date: dateIssued,
                    content: meta.content || meta.contentSample || ''
                });
                break;
            case 'exam_request':
                pdfBuffer = await PdfService.generateExamRequest({
                    patientName: patient.name,
                    doctorName: doctor.name,
                    crm: doctor.crm || undefined,
                    date: dateIssued,
                    examList: meta.examList || meta.content || '',
                    justification: meta.justification
                });
                break;
            case 'referral':
                pdfBuffer = await PdfService.generateReferral({
                    patientName: patient.name,
                    doctorName: doctor.name,
                    crm: doctor.crm || undefined,
                    date: dateIssued,
                    specialty: meta.specialty || 'Não informada',
                    reason: meta.reason || meta.reasonSample || '',
                    clinicalSummary: meta.clinicalSummary || '',
                    observation: meta.observation
                });
                break;
            default:
                return new NextResponse('Unsupported Type', { status: 400 });
        }

        await logAudit('DOWNLOAD_DOCUMENT', 'DOCUMENT', documentId, { action: 'DOWNLOAD', type });

        const searchParams = request.nextUrl.searchParams;
        const download = searchParams.get('download') === 'true';

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': download
                    ? `attachment; filename="${type}_${patient.name.replace(/\s+/g, '_')}.pdf"`
                    : 'inline'
            }
        });

    } catch (error) {
        console.error('API Document Route Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
