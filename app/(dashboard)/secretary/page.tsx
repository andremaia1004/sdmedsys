import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function SecretaryDashboard() {
    await requireRole(['SECRETARY', 'ADMIN']);
    redirect('/secretary/agenda');
}
