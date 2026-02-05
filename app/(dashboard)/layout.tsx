export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import { getCurrentUser, Role } from '@/lib/session';
import styles from './layout.module.css';
import { Button } from '@/components/ui/Button';
import { LogOut } from 'lucide-react';

import SidebarNav from './SidebarNav';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();
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
                    <span className={styles.logoText}>SDMED<span className={styles.logoAccent}>SYS</span></span>
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
