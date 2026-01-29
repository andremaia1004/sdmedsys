import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import { getCurrentUser } from '@/lib/session';
import styles from './layout.module.css';
import { Button } from '@/components/ui/Button';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    // Map roles to Portuguese
    const roleMap: Record<string, string> = {
        'ADMIN': 'Administrador',
        'SECRETARY': 'Secretaria',
        'DOCTOR': 'Médico'
    };

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.logoContainer}>
                    <span className={styles.logoText}>SDMED<span className={styles.logoAccent}>SYS</span></span>
                </div>

                <nav className={styles.navSection}>
                    <h3 className={styles.navTitle}>Módulos</h3>
                    <Link href="/secretary/agenda" className={styles.navLink}>
                        Agenda
                    </Link>
                    <Link href="/secretary/queue" className={styles.navLink}>
                        Controle de Fila
                    </Link>
                    <Link href="/admin/patients" className={styles.navLink}>
                        Pacientes
                    </Link>
                    <Link href="/tv" target="_blank" className={styles.navLink} style={{ color: '#fff', backgroundColor: 'rgba(211, 47, 47, 0.4)', marginTop: '1rem' }}>
                        Painel de TV (Live)
                    </Link>
                </nav>

                <div className={styles.logoutContainer}>
                    <form action={logoutAction}>
                        <Button variant="accent" fullWidth type="submit">
                            Sair do Sistema
                        </Button>
                    </form>
                </div>
            </aside>

            <div className={styles.mainArea}>
                <header className={styles.topbar}>
                    <div className={styles.userInfo}>
                        <div style={{ textAlign: 'right' }}>
                            <div className={styles.userName}>{user?.name || 'Usuário'}</div>
                            <div className={styles.userRole}>{roleMap[user?.role || ''] || user?.role || 'Acesso'}</div>
                        </div>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '1.2rem'
                        }}>
                            {(user?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
}
