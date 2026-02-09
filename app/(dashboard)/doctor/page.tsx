import Link from 'next/link';
import { requireRole } from '@/lib/session';
import styles from './DoctorHome.module.css';

export const dynamic = 'force-dynamic';

export default async function DoctorDashboard() {
    const user = await requireRole(['DOCTOR', 'ADMIN']);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>Bem-vindo(a)</p>
                    <h1 className={styles.title}>Dr(a). {user?.name || 'Médico(a)'}</h1>
                </div>
                <div className={styles.meta}>
                    <span className={styles.badge}>Acesso Médico</span>
                </div>
            </header>

            <section className={styles.grid}>
                <Link className={styles.card} href="/doctor/agenda">
                    <div>
                        <h2>Agenda do Dia</h2>
                        <p>Visualize horários, encaixes e próximos atendimentos.</p>
                    </div>
                    <span className={styles.cta}>Abrir agenda →</span>
                </Link>
                <Link className={styles.card} href="/doctor/queue">
                    <div>
                        <h2>Minha Fila</h2>
                        <p>Chame pacientes, acompanhe status e finalize consultas.</p>
                    </div>
                    <span className={styles.cta}>Acessar fila →</span>
                </Link>
                <div className={styles.cardMuted}>
                    <div>
                        <h2>Consultas em Andamento</h2>
                        <p>Inicie pelo fluxo da fila ou agenda para abrir o workspace.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
