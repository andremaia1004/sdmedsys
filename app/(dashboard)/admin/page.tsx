import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    await requireRole(['ADMIN']);
    return (
        <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome, Administrator.</p>
            <div style={{ marginTop: '2rem', padding: '1rem', border: '1px dashed #ccc' }}>
                <h3>System Overview</h3>
                <p>Stats placeholder...</p>
            </div>
        </div>
    );
}
