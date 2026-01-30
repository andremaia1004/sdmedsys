import WeeklyCalendar from '@/features/agenda/components/WeeklyCalendar';
import { getCurrentUser } from '@/lib/session';
import { DoctorService } from '@/features/doctors/service';
import { AppointmentService } from '@/features/agenda/service';

export const dynamic = 'force-dynamic';

export default async function DoctorAgendaPage() {
    const user = await getCurrentUser();

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
