import WeeklyCalendar from '@/features/agenda/components/WeeklyCalendar';
import { DoctorService } from '@/features/doctors/service';
import { AppointmentService } from '@/features/agenda/service';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function SecretaryAgendaPage(props: { searchParams: Promise<{ doctorId?: string }> }) {
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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Agenda (Secretaria)</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Visualizando agenda de: <strong>{selectedDoctor?.name || 'Médico não encontrado'}</strong></p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxWidth: '400px', justifyContent: 'flex-end' }}>
                    {doctors.map((doc: any) => (
                        <Link key={doc.id} href={`/secretary/agenda?doctorId=${doc.id}`}>
                            <Button
                                variant={selectedDoctorId === doc.id ? 'primary' : 'outline'}
                                size="sm"
                            >
                                {doc.name.split(' ')[0]}
                            </Button>
                        </Link>
                    ))}
                    {doctors.length === 0 && <span style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>Nenhum médico ativo cadastrado</span>}
                </div>
            </div>

            <WeeklyCalendar
                doctorId={selectedDoctorId}
                appointments={appointments}
            />
        </div>
    );
}
