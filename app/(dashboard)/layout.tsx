import { logoutAction } from '@/app/actions/auth';
import { getCurrentUser } from '@/lib/session';
import styles from './layout.module.css';
import { LogOut } from 'lucide-react';
import { SettingsService } from '@/features/admin/settings/service';

import SidebarNav from './SidebarNav';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();
    const settings = await SettingsService.get();
    const role = user?.role || 'SECRETARY';

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
                    {settings.logoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={settings.logoUrl} alt={settings.clinicName} className={styles.clinicLogo} />
                    ) : (
                        <span className={styles.logoText}>SDMED<span className={styles.logoAccent}>SYS</span></span>
                    )}
                </div>

                <SidebarNav role={role} />

                <div className={styles.logoutContainer}>
                    <form action={logoutAction}>
                        <button type="submit" className={styles.logoutButton}>
                            <LogOut size={18} />
                            <span>Sair do Sistema</span>
                        </button>
                    </form>
                </div>
            </aside>

            <div className={styles.mainArea}>
                <header className={styles.topbar}>
                    <div className={styles.userInfo}>
                        <div className={styles.userData}>
                            <div className={styles.userName}>{user?.name || 'Usuário'}</div>
                            <div className={styles.userRoleBadge}>{roleMap[role] || role}</div>
                        </div>
                        <div className={styles.userAvatar}>
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
