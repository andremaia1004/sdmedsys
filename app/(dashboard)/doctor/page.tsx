import { requireRole } from '@/lib/session';
import { Card } from '@/components/ui/Card';
import { QueueService } from '@/features/queue/service';
import { AppointmentService } from '@/features/agenda/service';
import { Users, Calendar, Clock, Play } from 'lucide-react';
import Link from 'next/link';
import { Appointment } from '@/features/agenda/types';

export const dynamic = 'force-dynamic';

export default async function DoctorDashboard() {
    const user = await requireRole(['DOCTOR', 'ADMIN']);

    // Fetch Data
    const today = new Date().toISOString().split('T')[0];
    const [queue, appointments] = await Promise.all([
        QueueService.getOperationalQueue(user.id),
        AppointmentService.list(user.id, `${today}T00:00:00`, `${today}T23:59:59`)
    ]);

    // Metrics
    const waitingPatients = queue.filter(q => q.status === 'WAITING');
    const calledPatient = queue.find(q => q.status === 'CALLED');
    const inServicePatient = queue.find(q => q.status === 'IN_SERVICE');
    const todayAppointments = appointments.length;

    // Find next appointment (Strict Type Safety)
    const now = new Date().getTime();
    const nextAppointment = appointments
        .filter((a): a is Appointment & { startTime: string } => !!a.startTime) // Type guard
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .find(a => new Date(a.startTime).getTime() > now);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                    Olá, Dr(a). {user.name}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Resumo do seu dia de atendimento</p>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
                        <div style={{ padding: '0.75rem', background: '#e0f2fe', borderRadius: '12px', color: '#0284c7' }}>
                            <Users size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Fila de Espera</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{waitingPatients.length}</div>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
                        <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: '12px', color: '#16a34a' }}>
                            <Calendar size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Agendados Hoje</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{todayAppointments}</div>
                        </div>
                    </div>
                </Card>

                {nextAppointment && (
                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
                            <div style={{ padding: '0.75rem', background: '#fff7ed', borderRadius: '12px', color: '#ea580c' }}>
                                <Clock size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Próximo Agendamento</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                    {new Date(nextAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#ea580c' }}>{nextAppointment.patientName}</div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Active Actions Area */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                {/* 1. Patient In Service (Priority) */}
                {inServicePatient && (
                    <Card header="Em Atendimento" style={{ borderLeft: '4px solid var(--primary)' }}>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{inServicePatient.patientName}</h3>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{inServicePatient.ticketCode}</span>
                                </div>
                                <div style={{ padding: '0.25rem 0.75rem', background: '#dbeafe', color: '#1e40af', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600 }}>
                                    EM CONSULTA
                                </div>
                            </div>
                            <Link
                                href="/doctor/queue"
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '0.75rem',
                                    textAlign: 'center',
                                    background: 'var(--primary)',
                                    color: '#fff',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontWeight: 600
                                }}
                            >
                                Continuar Atendimento
                            </Link>
                        </div>
                    </Card>
                )}

                {/* 2. Call Next or View Queue */}
                <Card header="Gestão de Fila">
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {calledPatient ? (
                            <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                                <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '0.25rem' }}>Paciente Chamado:</div>
                                <div style={{ fontSize: '1.1rem' }}>{calledPatient.patientName} ({calledPatient.ticketCode})</div>
                                <div style={{ fontSize: '0.85rem', color: '#b45309', marginTop: '0.5rem' }}>Aguardando entrada no consultório...</div>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)' }}>
                                {waitingPatients.length > 0
                                    ? `${waitingPatients.length} pacientes aguardando na sua fila.`
                                    : 'Não há pacientes aguardando no momento.'}
                            </p>
                        )}

                        <Link
                            href="/doctor/queue"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                width: '100%',
                                padding: '0.75rem',
                                textAlign: 'center',
                                background: calledPatient ? 'var(--success)' : 'var(--secondary)',
                                color: calledPatient ? '#fff' : 'var(--primary)',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 600,
                                border: calledPatient ? 'none' : '1px solid var(--border)'
                            }}
                        >
                            {calledPatient ? <><Play size={18} /> Iniciar Atendimento</> : 'Ver Minha Fila'}
                        </Link>
                    </div>
                </Card>

            </div>
        </div>
    );
}
