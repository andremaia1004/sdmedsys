import Link from 'next/link';
import { DashboardStats } from '../dashboard/service';
import styles from './AdminDashboard.module.css';
import { Users, CalendarDays, ClipboardList, Activity, Stethoscope } from 'lucide-react';
import PatientModalWrapper from '@/features/patients/components/PatientModalWrapper';

interface AdminDashboardProps {
    stats: DashboardStats | null;
}

export default function AdminDashboard({ stats }: AdminDashboardProps) {
    const today = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <h1>Painel Administrativo</h1>
                <p>{today}</p>
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                <PatientModalWrapper canCreate={true} />
                <Link href="/secretary/queue/ops" className={styles.quickActionBtn}>
                    <ClipboardList size={16} />
                    Ver Fila
                </Link>
                <Link href="/doctor/agenda" className={styles.quickActionBtn}>
                    <CalendarDays size={16} />
                    Agendar
                </Link>
            </div>

            {/* KPI Cards */}
            <div className={styles.dashboardGrid}>
                <div className={styles.statCard}>
                    <h3><Users size={14} style={{ marginRight: 4 }} />Pacientes Cadastrados</h3>
                    <div className={styles.statValue}>{stats?.totals.patients_total ?? '—'}</div>
                    <div className={styles.statDescription}>Total na clínica</div>
                </div>

                <div className={styles.statCard}>
                    <h3><CalendarDays size={14} style={{ marginRight: 4 }} />Agendamentos Hoje</h3>
                    <div className={styles.statValue}>{stats?.totals.appointments_today ?? '—'}</div>
                    <div className={styles.statDescription}>Consultas marcadas para hoje</div>
                </div>

                <div className={styles.statCard}>
                    <h3><ClipboardList size={14} style={{ marginRight: 4 }} />Fila Ativa</h3>
                    <div className={styles.statValue}>{stats?.totals.queue_active ?? '—'}</div>
                    <div className={styles.statDescription}>Pacientes aguardando / em atendimento</div>
                </div>
            </div>

            <div className={styles.sectionsLayout}>
                {/* Consultations Overview */}
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <Activity size={16} /> Consultas do Dia
                    </div>
                    <div className={styles.sectionBody}>
                        {!stats || stats.consultations_today.length === 0 ? (
                            <div className={styles.emptyState}>Nenhuma consulta registrada hoje.</div>
                        ) : (
                            <div className={styles.statusList}>
                                {stats.consultations_today.map(c => (
                                    <div key={c.status} className={styles.statusRow}>
                                        <span className={styles.statusLabel}>
                                            {c.status === 'Agendadas' && '📅 '}
                                            {c.status === 'Canceladas' && '❌ '}
                                            {c.status === 'Em Atendimento' && '🔵 '}
                                            {c.status === 'Concluídas' && '✅ '}
                                            {c.status}
                                        </span>
                                        <span className={styles.statusCount}>{c.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Doctors */}
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <Stethoscope size={16} /> Médicos Ativos Hoje
                    </div>
                    <div className={styles.sectionBody}>
                        {!stats || stats.active_doctors.length === 0 ? (
                            <div className={styles.emptyState}>Nenhum médico com atividade registrada hoje.</div>
                        ) : (
                            <div className={styles.doctorList}>
                                {stats.active_doctors.map(doc => (
                                    <div key={doc.id} className={styles.doctorChip}>
                                        <div className={styles.doctorAvatar}>
                                            {doc.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className={styles.doctorInfo}>
                                            <strong>{doc.name}</strong>
                                            <span>{doc.specialty}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Queue by Doctor */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <ClipboardList size={16} /> Fila por Médico
                </div>
                <div className={styles.sectionBody}>
                    {!stats || stats.queue_by_doctor.length === 0 ? (
                        <div className={styles.emptyState}>Nenhum paciente na fila agora.</div>
                    ) : (
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Médico</th>
                                    <th>Aguardando</th>
                                    <th>Chamado</th>
                                    <th>Em Atendimento</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.queue_by_doctor.map(row => (
                                    <tr key={row.doctor_id}>
                                        <td><strong>{row.doctor_name}</strong></td>
                                        <td>
                                            {row.waiting > 0 ? (
                                                <span className={styles.badgeWaiting}>{row.waiting}</span>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            {row.called > 0 ? (
                                                <span className={styles.badgeCalled}>{row.called}</span>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            {row.in_service > 0 ? (
                                                <span className={styles.badgeInService}>{row.in_service}</span>
                                            ) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
