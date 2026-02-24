import { requireRole } from '@/lib/session';
import { fetchDashboardStats } from '@/features/admin/dashboard/service';
import AdminDashboard from '@/features/admin/components/AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    await requireRole(['ADMIN']);

    let stats;
    try {
        stats = await fetchDashboardStats();
    } catch (error) {
        console.error('Dashboard fetch error:', error);
        stats = null;
    }

    return <AdminDashboard stats={stats} />;
}
