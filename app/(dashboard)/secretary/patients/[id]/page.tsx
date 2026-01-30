import { requireRole } from '@/lib/session';
import { PatientService } from '@/features/patients/service';
import { ClinicalSummaryService } from '@/features/consultation/service.summary';
import PatientOverview from '@/features/patients/components/PatientOverview';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SecretaryPatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await requireRole(['SECRETARY', 'ADMIN']);

    const patient = await PatientService.findById(id);
    if (!patient) return <div>Paciente não encontrado</div>;

    // Service will return null for SECRETARY
    const summary = await ClinicalSummaryService.getLatestEntryByPatient(id);

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/secretary/agenda" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}>← Voltar para Agenda</Link>
                <h1 style={{ marginTop: '0.5rem' }}>Ficha do Paciente</h1>
            </div>

            <PatientOverview
                patient={patient}
                summary={summary}
                role={user.role}
            />
        </div>
    );
}
