import WeeklyCalendar from '@/features/agenda/components/WeeklyCalendar';
import { requireRole } from '@/lib/session';
import { listDoctorsAction } from '@/features/doctors/actions';
import { fetchAppointmentsAction } from '@/features/agenda/actions';
import styles from '@/features/agenda/styles/Agenda.module.css';

export const dynamic = 'force-dynamic';

export default async function DoctorAgendaPage(props: { searchParams: Promise<{ date?: string }> }) {
    const searchParams = await props.searchParams;
    const user = await requireRole(['DOCTOR', 'ADMIN']);

    let doctors: any[] = [];
    try {
        doctors = await listDoctorsAction(true);
    } catch (e) {
        console.error('DoctorAgendaPage: Failed to fetch doctors', e);
    }

    // Find matching doctor record for this profile
    const myDoctor = doctors.find((d: any) => d.profileId === user?.id);
    const doctorId = myDoctor?.id || 'doc'; // Fallback to 'doc' if not linked yet

    // Date calculation - Find Sunday of the week
    const currentParamDate = searchParams.date ? new Date(searchParams.date + 'T00:00:00') : new Date();
    if (isNaN(currentParamDate.getTime())) {
        currentParamDate.setTime(new Date().getTime());
    }

    const day = currentParamDate.getDay(); // 0 (Sun) to 6 (Sat)
    const diffToSunday = currentParamDate.getDate() - day;
    const sundayDate = new Date(currentParamDate);
    sundayDate.setDate(diffToSunday);
    sundayDate.setHours(0, 0, 0, 0);

    const saturdayDate = new Date(sundayDate);
    saturdayDate.setDate(sundayDate.getDate() + 6);
    saturdayDate.setHours(23, 59, 59, 999);

    const startStr = sundayDate.toISOString();
    const endStr = saturdayDate.toISOString();

    let appointments: any[] = [];
    try {
        appointments = await fetchAppointmentsAction(doctorId, startStr, endStr);
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
                baseDate={sundayDate.toLocaleDateString('en-CA')}
            />
        </div>
    );
}
