import { requireRole } from '@/lib/session';
import { getConsultationAction } from '@/features/consultation/actions';
import { PatientService } from '@/features/patients/service'; // Assuming this exists or I use repository directly
import ConsultationWorkspace from '@/features/consultation/components/ConsultationWorkspace';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ConsultationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await requireRole(['DOCTOR', 'ADMIN']);
    const { id } = await params;

    const consultation = await getConsultationAction(id);

    if (!consultation || consultation.doctorId !== user.id) {
        // Strict security: ensure doctor owns this consultation
        // Or if admin, allow view?
        if (user.role !== 'ADMIN' && consultation?.doctorId !== user.id) {
            return (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h1>Acesso Negado</h1>
                    <p>Você não tem permissão para acessar este atendimento.</p>
                </div>
            );
        }
        if (!consultation) notFound();
    }

    const patient = await PatientService.findById(consultation.patientId);
    if (!patient) return <div>Paciente não encontrado.</div>;

    return (
        <div style={{ padding: '1rem', maxWidth: '1600px', margin: '0 auto', height: '100%' }}>
            <ConsultationWorkspace consultation={consultation} patient={patient} />
        </div>
    );
}
