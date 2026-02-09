import { NextRequest, NextResponse } from 'next/server';
import { ClinicalDocumentService } from '@/features/consultation/service.documents';
import { ClinicalDocumentsRegistryService } from '@/features/documents/service.registry';
import { generatePrescription, generateCertificate } from '@/lib/pdf/templates';
import { getCurrentUser } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ type: string; id: string }> }
) {
    try {
        const { type, id: consultationId } = await params;
        const searchParams = request.nextUrl.searchParams;
        const user = await getCurrentUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (type === 'prescription') {
            const data = await ClinicalDocumentService.getDocumentData(consultationId);
            if (!data) {
                return new NextResponse('Unauthorized or Not Found', { status: 403 });
            }

            // Record emission
            if (data.metadata) {
                await ClinicalDocumentsRegistryService.createRecord({
                    clinicId: data.metadata.clinicId,
                    patientId: data.metadata.patientId,
                    consultationId: data.metadata.consultationId,
                    doctorId: data.metadata.doctorId,
                    type: 'prescription',
                    issuedAt: new Date().toISOString(),
                    meta: { observations: data.observations },
                    createdBy: user.id
                });
            }

            const pdfBuffer = await generatePrescription(data);

            return new NextResponse(new Uint8Array(pdfBuffer), {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="Prescricao_${consultationId.substring(0, 8)}.pdf"`
                }
            });
        }

        if (type === 'certificate') {
            const days = parseInt(searchParams.get('days') || '0', 10);
            const cid = searchParams.get('cid') || undefined;

            const data = await ClinicalDocumentService.getCertificateData(consultationId, days, cid);
            if (!data) {
                return new NextResponse('Unauthorized or Not Found', { status: 403 });
            }

            // Record emission
            if (data.metadata) {
                await ClinicalDocumentsRegistryService.createRecord({
                    clinicId: data.metadata.clinicId,
                    patientId: data.metadata.patientId,
                    consultationId: data.metadata.consultationId,
                    doctorId: data.metadata.doctorId,
                    type: 'certificate',
                    issuedAt: new Date().toISOString(),
                    meta: { days, cid },
                    createdBy: user.id
                });
            }

            const pdfBuffer = await generateCertificate(data);

            return new NextResponse(new Uint8Array(pdfBuffer), {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="Atestado_${consultationId.substring(0, 8)}.pdf"`
                }
            });
        }

        return new NextResponse('Invalid document type', { status: 400 });
    } catch (error) {
        console.error('API Document Route Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
