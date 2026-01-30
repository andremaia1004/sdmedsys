import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function DoctorDashboard() {
    await requireRole(['DOCTOR', 'ADMIN']);
    return (
        <div>
            <h1>Doctor Dashboard</h1>
            <p>Welcome, Doctor.</p>
            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <h3>Queue Status</h3>
                    <p>Fetching active queue...</p>
                </div>
                <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <h3>Daily Appointments</h3>
                    <p>No appointments for today.</p>
                </div>
            </div>
        </div>
    );
}
