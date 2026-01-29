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

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.logoContainer}>
                    <span className={styles.logoText}>SDMED<span className={styles.logoAccent}>SYS</span></span>
                </div>

                <nav className={styles.navSection}>
                    <h3 className={styles.navTitle}>Modules</h3>
                    <Link href="/secretary/agenda" className={styles.navLink}>
                        Agenda
                    </Link>
                    <Link href="/secretary/queue" className={styles.navLink}>
                        Queue Control
                    </Link>
                    <Link href="/admin/patients" className={styles.navLink}>
                        Patients
                    </Link>
                    <Link href="/tv" target="_blank" className={styles.navLink} style={{ color: '#fff', backgroundColor: 'rgba(59, 130, 246, 0.2)', marginTop: '1rem' }}>
                        Live TV Board
                    </Link>
                </nav>

                <div className={styles.logoutContainer}>
                    <form action={logoutAction}>
                        <Button variant="accent" fullWidth type="submit">
                            Logout
                        </Button>
                    </form>
                </div>
            </aside>

            <div className={styles.mainArea}>
                <header className={styles.topbar}>
                    <div className={styles.userInfo}>
                        <div style={{ textAlign: 'right' }}>
                            <div className={styles.userName}>{user?.name || 'User'}</div>
                            <div className={styles.userRole}>{user?.role || 'Role'}</div>
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
