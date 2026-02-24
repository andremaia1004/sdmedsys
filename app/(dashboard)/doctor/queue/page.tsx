import { requireRole } from '@/lib/session';
import DoctorQueue from '@/features/queue/components/DoctorQueue';
import { DoctorService } from '@/features/doctors/service';

export const dynamic = 'force-dynamic';

export default async function DoctorQueuePage() {
    const user = await requireRole(['DOCTOR', 'ADMIN']);

    let doctorId = user.id;

    // If it's a doctor, we need their actual Doctor ID (UUID from Doctors table)
    // rather than their Profile ID (Auth ID)
    if (user.role === 'DOCTOR') {
        const doctor = await DoctorService.findByProfileId(user.id);
        if (doctor) {
            doctorId = doctor.id;
        }
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                    Gestão de Fila
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Controle de chamadas e atendimentos.</p>
            </div>

            <DoctorQueue doctorId={doctorId} />
        </div>
    );
}
