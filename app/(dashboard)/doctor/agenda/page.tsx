import { requireRole } from '@/lib/session';
import WeeklyCalendar from '@/features/agenda/components/WeeklyCalendar';
import { AppointmentService } from '@/features/agenda/service';

export const dynamic = 'force-dynamic';

export default async function DoctorAgendaPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>;
}) {
    const user = await requireRole(['DOCTOR', 'ADMIN']);

    // Resolve searchParams
    const { date } = await searchParams;

    // Calculate start/end of the week based on 'date' or today
    const baseDate = date ? new Date(date) : new Date();
    // Adjust to Sunday (start of week)
    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day; // adjust when day is sunday
    const startOfWeek = new Date(baseDate.setDate(diff));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startStr = startOfWeek.toISOString().split('T')[0];
    const endStr = endOfWeek.toISOString().split('T')[0];

    // Fetch appointments for this doctor only
    const appointments = await AppointmentService.list(user.id, `${startStr}T00:00:00`, `${endStr}T23:59:59`);

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                    Minha Agenda
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Gerencie seus horários e atendimentos.</p>
            </div>

            <WeeklyCalendar
                appointments={appointments}
                doctorId={user.id}
                role={user.role}
                baseDate={startStr}
            />
        </div>
    );
}
