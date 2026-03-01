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
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title"> Gestão de Fila </h1>
                    <p className="page-subtitle">Controle de chamadas e atendimentos.</p>
                </div>
            </div>

            <DoctorQueue doctorId={doctorId} />
        </div>
    );
}
