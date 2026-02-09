import { requireRole } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';

import { PatientService } from '@/features/patients/service';
import { ClinicalSummaryService } from '@/features/consultation/service.summary';
import PatientOverview from '@/features/patients/components/PatientOverview';
import { PatientDocuments } from '@/features/documents/components/PatientDocuments';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SharedPatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);

    console.log(`[SharedPatientDetailPage] Fetching patient with ID: ${id} and clinic: ${user.clinicId}`);
    const patient = await PatientService.findById(id);
    console.log(`[SharedPatientDetailPage] Result: ${patient ? 'Found' : 'Not Found'}`);

    if (!patient) {
        const supabase = await createClient();
        const { count } = await supabase.from('patients').select('*', { count: 'exact', head: true });
        const { data: samples } = await supabase.from('patients').select('id, name').limit(3);

        return (
            <div style={{ padding: '2rem', border: '2rem solid #fee2e2', borderRadius: '1rem' }}>
                <h2 style={{ color: '#991b1b', marginBottom: '1rem' }}>⚠️ Erro: Paciente não encontrado</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#fff', padding: '1rem', borderRadius: '0.5rem' }}>
                    <p><strong>URL ID:</strong> <code>{id}</code></p>
                    <p><strong>Config Clinic:</strong> <code>{user.clinicId || 'default (fallback)'}</code></p>
                    <hr />
                    <p><strong>Diagnóstico do Banco:</strong></p>
                    <p>Total de pacientes na tabela: <code>{count ?? 'Erro ao contar'}</code></p>
                    <p>Amostras de IDs no banco:</p>
                    <ul style={{ fontSize: '0.8rem' }}>
                        {samples?.map((s: any) => (
                            <li key={s.id}>{s.name}: <code>{s.id}</code></li>
                        ))}
                    </ul>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                    <a href="/patients" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>← Voltar para a lista</a>
                </div>
            </div>
        );
    }

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
