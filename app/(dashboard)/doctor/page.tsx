import { requireRole } from '@/lib/session';
import { Card } from '@/components/ui/Card';
import { QueueService } from '@/features/queue/service';
import { AppointmentService } from '@/features/agenda/service';
import { Users, Calendar, Clock, Play, Search, Settings, History, ClipboardList, ArrowRight, UserPlus } from 'lucide-react';
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
    const inServicePatient = queue.find(q => q.status === 'IN_SERVICE');
    const calledPatient = queue.find(q => q.status === 'CALLED');
    const completedToday = appointments.filter(a => a.status === 'COMPLETED');

    // Find next appointment
    const now = new Date().getTime();
    const upcomingAppointments = appointments
        .filter((a): a is Appointment & { startTime: string } => !!a.startTime && a.status !== 'COMPLETED' && a.status !== 'CANCELED')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const nextAppointment = upcomingAppointments.find(a => new Date(a.startTime).getTime() > now);

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Header / Welcome Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                        Bom dia, <span style={{ color: 'var(--primary-dark)' }}>Dr. {user.name.split(' ')[0]}</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                        <input
                            type="text"
                            placeholder="Buscar paciente..."
                            style={{ padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: '300px', outline: 'none', background: '#fff' }}
                        />
                    </div>
                </div>
            </div>

            {/* Top Pulse Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                {[
                    { label: 'Em Espera', value: waitingPatients.length, icon: Users, color: '#3b82f6', bg: '#eff6ff' },
                    { label: 'Agendados', value: appointments.length, icon: Calendar, color: '#10b981', bg: '#f0fdf4' },
                    { label: 'Atendidos', value: completedToday.length, icon: ClipboardList, color: '#8b5cf6', bg: '#f5f3ff' },
                    { label: 'Próximo', value: nextAppointment ? new Date(nextAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--', icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
                ].map((stat, i) => (
                    <Card key={i} style={{ border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
                            <div style={{ padding: '0.8rem', background: stat.bg, borderRadius: '14px', color: stat.color }}>
                                <stat.icon size={26} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b' }}>{stat.value}</div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Layout Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>

                {/* Center Column: Active Work & Shortcuts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* 1. Primary Action: Continuing Atendimento */}
                    {inServicePatient && (
                        <div style={{
                            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                            borderRadius: '20px',
                            padding: '2rem',
                            color: '#fff',
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', opacity: 0.9 }}>
                                    <div style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%' }} />
                                    EM ATENDIMENTO
                                </div>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>{inServicePatient.patientName}</h2>
                                <p style={{ opacity: 0.8, marginTop: '0.25rem' }}>Senha: {inServicePatient.ticketCode} • Iniciado há {Math.floor((new Date().getTime() - new Date(inServicePatient.updatedAt).getTime()) / 60000)} min</p>
                            </div>
                            <Link
                                href="/doctor/queue"
                                style={{
                                    background: '#fff',
                                    color: '#1e40af',
                                    padding: '1rem 2rem',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                }}
                            >
                                Continuar Atendimento <ArrowRight size={18} />
                            </Link>
                        </div>
                    )}

                    {/* 2. Secondary Context: Calling Next */}
                    {!inServicePatient && (
                        <Card header="Chamada de Paciente">
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                {calledPatient ? (
                                    <div style={{ padding: '1.5rem', background: '#fef3c7', borderRadius: '16px', border: '1px solid #fcd34d', marginBottom: '1.5rem' }}>
                                        <div style={{ fontWeight: 800, color: '#92400e', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Paciente Chamado</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{calledPatient.patientName} ({calledPatient.ticketCode})</div>
                                        <p style={{ color: '#b45309', marginTop: '0.5rem' }}>Aguardando entrada no consultório...</p>
                                    </div>
                                ) : (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#64748b' }}>
                                            <Users size={32} />
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Fila de Espera</h3>
                                        <p style={{ color: 'var(--text-muted)' }}>{waitingPatients.length > 0 ? `${waitingPatients.length} pacientes aguardando` : 'Sua fila está vazia no momento'}</p>
                                    </div>
                                )}
                                <Link
                                    href="/doctor/queue"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '1rem 2.5rem',
                                        background: calledPatient ? '#10b981' : 'var(--primary)',
                                        color: '#fff',
                                        borderRadius: '14px',
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {calledPatient ? <><Play size={20} fill="currentColor" /> Iniciar Agora</> : 'Avançar para Fila'}
                                </Link>
                            </div>
                        </Card>
                    )}

                    {/* 3. Quick Shortcuts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        {[
                            { label: 'Minha Agenda', icon: Calendar, href: '/doctor/agenda', color: '#3b82f6' },
                            { label: 'Fila Completa', icon: ClipboardList, href: '/doctor/queue', color: '#10b981' },
                            { label: 'Pacientes', icon: UserPlus, href: '/patients', color: '#8b5cf6' },
                            { label: 'Histórico', icon: History, href: '/doctor/consultations', color: '#f59e0b' },
                        ].map((item, i) => (
                            <Link key={i} href={item.href} style={{ textDecoration: 'none' }}>
                                <Card style={{ height: '100%', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer' }} className="hover-lift">
                                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
                                        <div style={{ color: item.color }}><item.icon size={28} /></div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>{item.label}</div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Right Column: Mini Agenda & Quick Settings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Next Patients List */}
                    <Card header="Próximos na Agenda">
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {upcomingAppointments.length > 0 ? (
                                upcomingAppointments.slice(0, 5).map((a, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '12px', border: '1px solid transparent', transition: 'all 0.2s' }}>
                                        <div style={{
                                            padding: '0.5rem',
                                            background: '#f8fafc',
                                            borderRadius: '10px',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: 'var(--primary)',
                                            width: '55px',
                                            textAlign: 'center'
                                        }}>
                                            {new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.patientName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.id.slice(0, 8)} • Rotina</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Sem mais agendamentos para hoje.
                                </div>
                            )}
                            <Link href="/doctor/agenda" style={{ display: 'block', textAlign: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
                                Ver Agenda Completa
                            </Link>
                        </div>
                    </Card>

                    {/* Quick Config / Profile */}
                    <Card>
                        <div style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div style={{ width: '48px', height: '48px', background: 'var(--primary)', borderRadius: '12px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700 }}>
                                    {user.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>Dr. {user.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Disponível • Clínico Geral</div>
                                </div>
                                <Settings size={20} style={{ color: '#94a3b8', cursor: 'pointer' }} />
                            </div>
                            <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <strong>Clínica:</strong> Matriz SDMED<br />
                                <strong>Sessão:</strong> Ativa até 18:00
                            </div>
                        </div>
                    </Card>

                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .hover-lift:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
                }
            `}} />
        </div>
    );
}
