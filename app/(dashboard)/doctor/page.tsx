import { fetchQueueAction } from '@/app/actions/queue';
import DoctorQueue from '@/features/queue/components/DoctorQueue';
import { getCurrentUser } from '@/lib/session';

export default async function DoctorDashboard() {
    const items = await fetchQueueAction(); // Filters could be applied here
    const user = await getCurrentUser();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                    Doctor's Lounge
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    Welcome back, <strong>{user?.name}</strong>. Here is your worklist for today.
                </p>
            </header>

            <DoctorQueue items={items} />
        </div>
    );
}
