import { requireRole } from '@/lib/session';
import { PatientService } from '@/features/patients/service';
import { ClinicalSummaryService } from '@/features/consultation/service.summary';
// import { ClinicalEntryService } from '@/features/consultation/service.clinical';
import { ConsultationService } from '@/features/consultation/service';
import PatientHub from '@/features/patients/components/PatientHub';
import Link from 'next/link';

import { ClinicalDocumentsRegistryService } from '@/features/documents/service.registry';
import { PatientAttachmentService } from '@/features/documents/service.attachments';

export const dynamic = 'force-dynamic';

export default async function SharedPatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);

    const patient = await PatientService.findById(id);

    if (!patient) {
        return (
            <div style={{ padding: '2rem', border: '2rem solid #fee2e2', borderRadius: '1rem' }}>
                <h2 style={{ color: '#991b1b', marginBottom: '1rem' }}>⚠️ Erro: Paciente não encontrado</h2>
                <div style={{ marginTop: '1.5rem' }}>
                    <Link href="/patients" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>← Voltar para a lista</Link>
                </div>
            </div>
        );
    }

    // RBAC: SECRETARY gets null for summary/timeline
    const isClinicalAllowed = user.role !== 'SECRETARY';

    // Parallel Fetching for Performance
    const [summary, historyCount, documentsCount, attachmentsCount, activeConsultation] = await Promise.all([
        isClinicalAllowed ? ClinicalSummaryService.getLatestEntryByPatient(id) : null,
        // isClinicalAllowed ? ConsultationService.listByPatient(id) : [], // Moved to PatientTimeline component
        isClinicalAllowed ? ConsultationService.countByPatient(id) : null,
        ClinicalDocumentsRegistryService.countByPatient(id),
        PatientAttachmentService.countByPatient(id),
        user.role === 'DOCTOR' ? ConsultationService.getActiveByDoctor(user.id) : null
    ]);

    const backLink = user.role === 'DOCTOR' ? '/doctor/agenda' :
        user.role === 'SECRETARY' ? '/secretary/agenda' : '/patients';
    const backLabel = user.role === 'ADMIN' ? '← Lista' : '← Minha Agenda';

    return (
        <div style={{ padding: '0 1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
                <Link href={backLink} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}>
                    {backLabel}
                </Link>
            </div>

            <PatientHub
                patient={patient}
                summary={summary}
                // timeline={timeline} // Component fetches its own data now
                role={user.role}
                historyCount={historyCount}
                documentsCount={documentsCount}
                attachmentsCount={attachmentsCount}
                lastConsultationDate={summary?.date}
                activeConsultationId={activeConsultation?.id}
            />
        </div>
    );
}
