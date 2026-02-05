import WeeklyCalendar from '@/features/agenda/components/WeeklyCalendar';
import { requireRole } from '@/lib/session';
import { DoctorService } from '@/features/doctors/service';
import { AppointmentService } from '@/features/agenda/service';
import styles from '@/features/agenda/styles/Agenda.module.css';

export const dynamic = 'force-dynamic';

export default async function DoctorAgendaPage() {
    const user = await requireRole(['DOCTOR', 'ADMIN']);

    let doctors: any[] = [];
    try {
        doctors = await DoctorService.list(true);
    } catch (e) {
        console.error('DoctorAgendaPage: Failed to fetch doctors', e);
    }

    // Find matching doctor record for this profile
    const myDoctor = doctors.find((d: any) => d.profileId === user?.id);
    const doctorId = myDoctor?.id || 'doc'; // Fallback to 'doc' if not linked yet

    let appointments: any[] = [];
    try {
        appointments = await AppointmentService.list(doctorId);
    } catch (e) {
        console.error('DoctorAgendaPage: Failed to fetch appointments', e);
    }

    return (
        <div className={styles.agendaContainer}>
            <div className={styles.agendaHeader}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 850, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                        Minha Agenda
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, marginTop: '0.25rem' }}>
                        Bem-vindo(a), <strong style={{ color: 'var(--primary)', fontWeight: 700 }}>Dr(a). {myDoctor?.name || user?.name || 'Médico'}</strong>
                    </p>
                </div>
            </div>

            <WeeklyCalendar
                doctorId={doctorId}
                appointments={appointments}
            />
        </div>
    );
}
