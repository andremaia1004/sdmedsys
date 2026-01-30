export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import { getCurrentUser, Role } from '@/lib/session';
import styles from './layout.module.css';
import { Button } from '@/components/ui/Button';

interface NavItem {
    label: string;
    href: string;
    roles: Role[];
    icon?: string;
    target?: string;
}

const navItems: NavItem[] = [
    // Secretary specific
    { label: 'Agenda (Séc)', href: '/secretary/agenda', roles: ['SECRETARY', 'ADMIN'] },
    { label: 'Controle de Fila', href: '/secretary/queue', roles: ['SECRETARY', 'ADMIN'] },

    // Doctor specific
    { label: 'Agenda (Doc)', href: '/doctor/agenda', roles: ['DOCTOR', 'ADMIN'] },
    { label: 'Minha Fila', href: '/doctor/queue', roles: ['DOCTOR', 'ADMIN'] },
    { label: 'Consultas', href: '/doctor/consultation', roles: ['DOCTOR', 'ADMIN'] },

    // Shared / Admin
    { label: 'Pacientes', href: '/admin/patients', roles: ['ADMIN', 'SECRETARY', 'DOCTOR'] },
    { label: 'Médicos', href: '/admin/doctors', roles: ['ADMIN'] },
    { label: 'Configurações', href: '/admin/settings', roles: ['ADMIN'] },
    { label: 'Auditoria', href: '/admin/audit', roles: ['ADMIN'] },

    // Utility
    { label: 'Painel TV', href: '/tv', roles: ['ADMIN', 'SECRETARY'], target: '_blank' },
];

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();
    const role = user?.role || 'SECRETARY';

    // Filter nav items based on user role
    const filteredNav = navItems.filter(item => item.roles.includes(role));

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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {filteredNav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                target={item.target}
                                className={styles.navLink}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
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
                            <div className={styles.userRole}>{roleMap[role] || role}</div>
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
