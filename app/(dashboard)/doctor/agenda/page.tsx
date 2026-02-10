import { requireRole } from '@/lib/session';
import WeeklyCalendar from '@/features/agenda/components/WeeklyCalendar';
import DailyCalendar from '@/features/agenda/components/DailyCalendar';
import { AppointmentService } from '@/features/agenda/service';
import Link from 'next/link';
import { List, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DoctorAgendaPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string; view?: 'day' | 'week' }>;
}) {
    const user = await requireRole(['DOCTOR', 'ADMIN']);

    // Resolve searchParams
    const { date, view = 'week' } = await searchParams;

    // Calculate range for fetching
    const baseDate = date ? new Date(date + 'T00:00:00') : new Date();

    let startStr: string;
    let endStr: string;

    if (view === 'day') {
        startStr = baseDate.toLocaleDateString('en-CA');
        endStr = startStr;
    } else {
        // Weekly range
        const day = baseDate.getDay();
        const diff = baseDate.getDate() - day;
        const startOfWeek = new Date(baseDate.setDate(diff));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        startStr = startOfWeek.toLocaleDateString('en-CA');
        endStr = endOfWeek.toLocaleDateString('en-CA');
    }

    // Fetch appointments for this doctor only
    const appointments = await AppointmentService.list(user.id, `${startStr}T00:00:00`, `${endStr}T23:59:59`);

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
                        Minha Agenda
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Gerencie seus horários e atendimentos clínicos.</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.4rem', borderRadius: '12px' }}>
                    <Link
                        href={`?view=day${date ? `&date=${date}` : ''}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            color: view === 'day' ? 'var(--primary)' : '#64748b',
                            background: view === 'day' ? '#fff' : 'transparent',
                            boxShadow: view === 'day' ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <List size={18} /> Dia
                    </Link>
                    <Link
                        href={`?view=week${date ? `&date=${date}` : ''}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            color: view === 'week' ? 'var(--primary)' : '#64748b',
                            background: view === 'week' ? '#fff' : 'transparent',
                            boxShadow: view === 'week' ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Calendar size={18} /> Semana
                    </Link>
                </div>
            </div>

            {view === 'day' ? (
                <DailyCalendar
                    appointments={appointments}
                    doctorId={user.id}
                    date={startStr}
                />
            ) : (
                <WeeklyCalendar
                    appointments={appointments}
                    doctorId={user.id}
                    role={user.role}
                    baseDate={startStr}
                />
            )}
        </div>
    );
}
