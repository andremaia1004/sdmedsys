export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import { getCurrentUser, Role } from '@/lib/session';
import styles from './layout.module.css';
import { Button } from '@/components/ui/Button';
import {
    Calendar,
    Users,
    FileText,
    Contact,
    Stethoscope,
    Settings,
    ShieldCheck,
    Tv,
    LogOut,
    LayoutDashboard
} from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    roles: Role[];
    icon: React.ElementType;
    target?: string;
}

interface NavCategory {
    title: string;
    items: NavItem[];
}

const navCategories: NavCategory[] = [
    {
        title: 'Atendimento',
        items: [
            { label: 'Agenda (Séc)', href: '/secretary/agenda', roles: ['SECRETARY', 'ADMIN'], icon: Calendar },
            { label: 'Controle de Fila', href: '/secretary/queue', roles: ['SECRETARY', 'ADMIN'], icon: Users },
            { label: 'Agenda (Doc)', href: '/doctor/agenda', roles: ['DOCTOR', 'ADMIN'], icon: Calendar },
            { label: 'Minha Fila', href: '/doctor/queue', roles: ['DOCTOR', 'ADMIN'], icon: Users },
            { label: 'Consultas', href: '/doctor/consultation', roles: ['DOCTOR', 'ADMIN'], icon: FileText },
        ]
    },
    {
        title: 'Cadastros',
        items: [
            { label: 'Pacientes', href: '/patients', roles: ['ADMIN', 'SECRETARY', 'DOCTOR'], icon: Contact },
            { label: 'Médicos', href: '/admin/doctors', roles: ['ADMIN'], icon: Stethoscope },
        ]
    },
    {
        title: 'Sistema',
        items: [
            { label: 'Painel TV', href: '/tv', roles: ['ADMIN', 'SECRETARY'], icon: Tv, target: '_blank' },
            { label: 'Configurações', href: '/admin/settings', roles: ['ADMIN'], icon: Settings },
            { label: 'Auditoria', href: '/admin/audit', roles: ['ADMIN'], icon: ShieldCheck },
        ]
    }
];

import SidebarNav from './SidebarNav';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();
    const role = user?.role || 'SECRETARY';

    // Filter categories and items based on user role
    const filteredCategories = navCategories.map(category => ({
        ...category,
        items: category.items.filter(item => item.roles.includes(role))
    })).filter(category => category.items.length > 0);

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

                <SidebarNav categories={filteredCategories} />

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
