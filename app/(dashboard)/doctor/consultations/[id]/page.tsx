import { requireRole } from '@/lib/session';
import { getConsultationAction } from '@/features/consultation/actions';
import { PatientService } from '@/features/patients/service'; // Assuming this exists or I use repository directly
import ConsultationWorkspace from '@/features/consultation/components/ConsultationWorkspace';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ConsultationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await requireRole(['DOCTOR', 'ADMIN']);
    const { id } = await params;

    const res = await getConsultationAction(id);
    const consultation = res.data;

    let doctorIdContext = user.id;

    if (user.role === 'DOCTOR') {
        const { SupabaseDoctorsRepository } = await import('@/features/doctors/repository.supabase');
        const { supabaseServer } = await import('@/lib/supabase-server');
        const doctorsRepo = new SupabaseDoctorsRepository(supabaseServer, user.clinicId || '550e8400-e29b-41d4-a716-446655440000');
        const doctor = await doctorsRepo.findByProfileId(user.id);
        if (doctor) {
            doctorIdContext = doctor.id;
        }
    }

    if (!consultation || consultation.doctor_id !== doctorIdContext) {
        // Strict security: ensure doctor owns this consultation
        // Or if admin, allow view?
        if (user.role !== 'ADMIN' && consultation?.doctor_id !== doctorIdContext) {
            return (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h1>Acesso Negado</h1>
                    <p>Você não tem permissão para acessar este atendimento.</p>
                </div>
            );
        }
        if (!consultation) notFound();
    }

    const patient = await PatientService.findById(consultation.patient_id);
    if (!patient) return <div>Paciente não encontrado.</div>;

    return (
        <div style={{ padding: '1rem', maxWidth: '1600px', margin: '0 auto', height: '100%' }}>
            <ConsultationWorkspace consultation={consultation} patient={patient} />
        </div>
    );
}
