import { requireRole } from '@/lib/session';
import { PatientService } from '@/features/patients/service';
import { ClinicalSummaryService } from '@/features/consultation/service.summary';
import PatientOverview from '@/features/patients/components/PatientOverview';
import { PatientDocuments } from '@/features/documents/components/PatientDocuments';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SharedPatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);

    const patient = await PatientService.findById(id);
    if (!patient) return <div style={{ padding: '2rem' }}>Paciente não encontrado</div>;

    // Service will return null for SECRETARY (additional guard)
    const summary = await ClinicalSummaryService.getLatestEntryByPatient(id);

    // Contextual back link
    const backLink = user.role === 'DOCTOR' ? '/doctor/agenda' :
        user.role === 'SECRETARY' ? '/secretary/agenda' : '/patients';

    const backLabel = user.role === 'ADMIN' ? '← Voltar para Lista' : '← Voltar para Agenda';

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link href={backLink} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}>
                    {backLabel}
                </Link>
                <h1 style={{ marginTop: '0.5rem' }}>Ficha do Paciente</h1>
            </div>

            <PatientOverview
                patient={patient}
                summary={summary}
                role={user.role}
            />

            {user.role !== 'SECRETARY' && (
                <div style={{ marginTop: '2rem' }}>
                    <PatientDocuments patientId={id} />
                </div>
            )}
        </div>
    );
}
