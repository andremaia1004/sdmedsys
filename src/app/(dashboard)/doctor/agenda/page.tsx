import WeeklyCalendar from '@/features/agenda/components/WeeklyCalendar';
import { fetchAppointmentsAction } from '@/app/actions/agenda';

export default async function DoctorAgendaPage() {
    // Doctor sees only their own agenda
    const myDoctorId = 'doc';
    const appointments = await fetchAppointmentsAction(myDoctorId);

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>My Agenda</h1>

            <WeeklyCalendar
                role="DOCTOR"
                doctorId={myDoctorId}
                appointments={appointments}
            />
        </div>
    );
}
