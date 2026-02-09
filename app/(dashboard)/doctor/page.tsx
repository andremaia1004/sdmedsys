import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function DoctorDashboard() {
    await requireRole(['DOCTOR', 'ADMIN']);
    redirect('/doctor/agenda');
}
