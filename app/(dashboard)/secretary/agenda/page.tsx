import WeeklyCalendar from '@/features/agenda/components/WeeklyCalendar';
import { fetchAppointmentsAction } from '@/features/agenda/actions';

export default async function SecretaryAgendaPage() {
    // Hardcoded doctor for MVP demo. Real app would have a selector.
    const selectedDoctorId = 'doc';
    const appointments = await fetchAppointmentsAction(selectedDoctorId);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h1>Agenda (Secretary)</h1>
                <div style={{ padding: '0.5rem', backgroundColor: '#eee', borderRadius: '4px' }}>
                    Doctor: <strong>Dr. House (Mock)</strong>
                </div>
            </div>

            <WeeklyCalendar
                role="SECRETARY"
                doctorId={selectedDoctorId}
                appointments={appointments}
            />
        </div>
    );
}
