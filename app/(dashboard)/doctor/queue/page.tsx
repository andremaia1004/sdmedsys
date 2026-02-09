import { requireRole } from '@/lib/session';
import DoctorQueue from '@/features/queue/components/DoctorQueue';

export const dynamic = 'force-dynamic';

export default async function DoctorQueuePage() {
    const user = await requireRole(['DOCTOR', 'ADMIN']);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                    Gestão de Fila
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Controle de chamadas e atendimentos.</p>
            </div>

            <DoctorQueue doctorId={user.id} />
        </div>
    );
}
