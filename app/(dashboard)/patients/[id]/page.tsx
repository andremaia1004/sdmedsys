import { requireRole } from '@/lib/session';
import { PatientService } from '@/features/patients/service';
import { ClinicalSummaryService } from '@/features/consultation/service.summary';
import { ClinicalEntryService } from '@/features/consultation/service.clinical';
import PatientHub from '@/features/patients/components/PatientHub';
import Link from 'next/link';

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
    const summary = isClinicalAllowed ? await ClinicalSummaryService.getLatestEntryByPatient(id) : null;
    const timeline = isClinicalAllowed ? await ClinicalEntryService.listByPatient(id) : [];

    const backLink = user.role === 'DOCTOR' ? '/doctor/agenda' :
        user.role === 'SECRETARY' ? '/secretary/agenda' : '/patients';
    const backLabel = user.role === 'ADMIN' ? '← Lista' : '← Minha Agenda';

    return (
        <div style={{ padding: '0 1rem' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <Link href={backLink} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}>
                        {backLabel}
                    </Link>
                    <h1 style={{ marginTop: '0.5rem', marginBottom: '0' }}>Prontuário 360: {patient.name}</h1>
                </div>
                {/* Visual indicator of role/context if needed */}
            </div>

            <PatientHub
                patient={patient}
                summary={summary}
                timeline={timeline}
                role={user.role}
            />
        </div>
    );
}
