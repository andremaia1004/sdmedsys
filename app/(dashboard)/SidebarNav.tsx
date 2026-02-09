'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';
import { Role } from '@/lib/session';
import { navItemsByRole } from '@/lib/nav';
import {
    Calendar,
    Users,
    FileText,
    Contact,
    Stethoscope,
    Settings,
    ShieldCheck,
    Tv,
    LayoutDashboard,
    ClipboardList
} from 'lucide-react';

// Icon Mapping
const ICON_MAP: Record<string, React.ElementType> = {
    'Agenda (Sec)': Calendar,
    'Controle de fila (Sec)': Users,
    'Agenda (Doc)': Calendar,
    'Minha fila (Doc)': Users,
    'Minha Fila': Users,
    'Consultas': FileText,
    'Pacientes': Contact,
    'Médicos': Stethoscope,
    'Painel TV': Tv,
    'Configurações': Settings,
    'Auditoria': ShieldCheck,
    'Agenda': Calendar,
    'Painel do dia': LayoutDashboard,
    'Operação de Fila': Users,
    'Gestão Kanban': LayoutDashboard,
    'Controle de fila': Users,
};

export default function SidebarNav({ role }: { role: Role }) {
    const pathname = usePathname();
    const navGroups = navItemsByRole[role] || [];

    const isRouteActive = (itemHref: string) => {
        if (pathname === itemHref) return true;
        // Special case for accessing sub-routes of patients
        if (itemHref === '/patients' && pathname.startsWith('/patients')) return true;
        return false;
    };

    return (
        <div className={styles.navContent}>
            {navGroups.map((group) => (
                <nav key={group.title} className={styles.navSection}>
                    <h3 className={styles.navTitle}>{group.title}</h3>
                    <div className={styles.navGroup}>
                        {group.items.map((item) => {
                            const IconComponent = ICON_MAP[item.label] || ClipboardList;
                            const isActive = isRouteActive(item.href);

                            // Check if the item is properly configured for the current role
                            // This is a safety check validation, though navItemsByRole should already be correct
                            if (!item.rolesAllowed.includes(role)) return null;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    target={item.label === 'Painel TV' ? '_blank' : undefined}
                                    className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                                >
                                    <IconComponent size={18} className={styles.navIcon} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            ))}
        </div>
    );
}
