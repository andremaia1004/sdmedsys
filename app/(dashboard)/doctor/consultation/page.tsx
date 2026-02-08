import { requireRole } from '@/lib/session';
import { ConsultationService } from '@/features/consultation/service';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DoctorConsultationIndexPage() {
    const user = await requireRole(['DOCTOR', 'ADMIN']);

    if (user.role === 'DOCTOR') {
        const active = await ConsultationService.getActiveByDoctor(user.id);
        if (active) {
            redirect(`/doctor/consultation/${active.id}`);
        }

        redirect('/doctor/queue');
    }

    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ marginBottom: '0.75rem' }}>Consultas</h1>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                Para abrir uma consulta ativa, acesse a fila do médico.
            </p>
            <Link href="/doctor/queue" style={{ color: 'var(--primary)' }}>
                Ir para a fila →
            </Link>
        </div>
    );
}
