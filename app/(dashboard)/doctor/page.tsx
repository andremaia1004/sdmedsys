import { fetchQueueAction } from '@/app/actions/queue';
import DoctorQueue from '@/features/queue/components/DoctorQueue';
import { getCurrentUser } from '@/lib/session';

export default async function DoctorDashboard() {
    const items = await fetchQueueAction();
    const user = await getCurrentUser();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                    Painel do Médico
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    Bem-vindo de volta, Dr(a). <strong>{user?.name}</strong>. Esta é sua lista de pacientes para hoje.
                </p>
            </header>

            <DoctorQueue items={items} />
        </div>
    );
}
