import WeeklyCalendar from '@/features/agenda/components/WeeklyCalendar';
import { DoctorService } from '@/features/doctors/service';
import { AppointmentService } from '@/features/agenda/service';
import Link from 'next/link';
import { requireRole } from '@/lib/session';
import styles from '@/features/agenda/styles/Agenda.module.css';

export const dynamic = 'force-dynamic';

export default async function SecretaryAgendaPage(props: { searchParams: Promise<{ doctorId?: string }> }) {
    await requireRole(['SECRETARY', 'ADMIN']);
    const searchParams = await props.searchParams;

    // Call services directly for SSR stability
    let doctors: any[] = [];
    try {
        doctors = await DoctorService.list(true); // Active only
    } catch (e) {
        console.error('SecretaryAgendaPage: Failed to fetch doctors', e);
    }

    const selectedDoctorId = searchParams.doctorId || doctors[0]?.id || 'doc';
    const selectedDoctor = doctors.find((d: any) => d.id === selectedDoctorId);

    let appointments: any[] = [];
    try {
        appointments = await AppointmentService.list(selectedDoctorId);
    } catch (e) {
        console.error('SecretaryAgendaPage: Failed to fetch appointments', e);
    }

    return (
        <div className={styles.agendaContainer}>
            <div className={styles.agendaHeader}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 850, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                        Agenda Semanal
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, marginTop: '0.25rem' }}>
                        Visualizando atendimentos de: <strong style={{ color: 'var(--primary)', fontWeight: 700 }}>{selectedDoctor?.name || 'Médico não selecionado'}</strong>
                    </p>
                </div>

                <div className={styles.doctorSelector}>
                    {doctors.map((doc: any) => (
                        <Link key={doc.id} href={`/secretary/agenda?doctorId=${doc.id}`} prefetch={true}>
                            <button
                                className={`${styles.doctorTab} ${selectedDoctorId === doc.id ? styles.doctorTabActive : ''}`}
                            >
                                {doc.name.split(' ')[0]}
                            </button>
                        </Link>
                    ))}
                    {doctors.length === 0 && (
                        <span style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600, padding: '0.5rem' }}>
                            Nenhum médico ativo
                        </span>
                    )}
                </div>
            </div>

            <WeeklyCalendar
                doctorId={selectedDoctorId}
                appointments={appointments}
            />
        </div>
    );
}
