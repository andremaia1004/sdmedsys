import WeeklyCalendar from '@/features/agenda/components/WeeklyCalendar';
import { fetchAppointmentsAction } from '@/features/agenda/actions';
import { fetchDoctorsAction } from '@/app/actions/admin';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function DoctorAgendaPage() {
    const user = await getCurrentUser();
    const doctors = await fetchDoctorsAction(true);

    // Find matching doctor record for this profile
    const myDoctor = doctors.find((d: any) => d.profileId === user?.id);
    const doctorId = myDoctor?.id || 'doc'; // Fallback to 'doc' if not linked yet

    const appointments = await fetchAppointmentsAction(doctorId);

    return (
        <div>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ margin: 0 }}>Minha Agenda</h1>
                <p style={{ color: 'var(--text-muted)' }}>Bem-vindo, Dr(a). {myDoctor?.name || user?.name || 'Médico'}</p>
            </div>

            <WeeklyCalendar
                doctorId={doctorId}
                appointments={appointments}
            />
        </div>
    );
}
