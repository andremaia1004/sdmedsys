'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';
import { Role } from '@/lib/session';
import { navItemsByRole } from '@/lib/nav';
import {
    CalendarDays,
    Users,
    FileText,
    Contact,
    Stethoscope,
    Settings,
    ShieldCheck,
    Tv,
    LayoutDashboard,
    ClipboardList,
    DollarSign,
    Wallet,
    Tag,
    KanbanSquare,
    ChevronDown,
    Activity,
    FolderOpen,
    Banknote,
    Wrench,
    HeartPulse,
    Monitor
} from 'lucide-react';

// Item icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
    'Minha Fila': Users,
    'Consultas': FileText,
    'Pacientes': Contact,
    'Médicos': Stethoscope,
    'Funcionários': Users,
    'Painel TV': Tv,
    'Configurações': Settings,
    'Auditoria': ShieldCheck,
    'Agenda': CalendarDays,
    'Painel do Dia': LayoutDashboard,
    'Painel Administrativo': LayoutDashboard,
    'Meu Painel': LayoutDashboard,
    'Operação de Fila': Users,
    'CRM Comercial': KanbanSquare,
    'Dashboard Financeiro': DollarSign,
    'Caixa do Dia': Wallet,
    'Catálogo de Serviços': Tag,
};

// Group header icon mapping
const GROUP_ICON_MAP: Record<string, React.ElementType> = {
    'Painel': Monitor,
    'Operação': Activity,
    'Cadastros': FolderOpen,
    'Financeiro': Banknote,
    'Sistema': Wrench,
    'Atendimento': HeartPulse,
    'Agenda': CalendarDays,
};

export default function SidebarNav({ role }: { role: Role }) {
    const pathname = usePathname();
    const navGroups = navItemsByRole[role] || [];

    const isRouteActive = (itemHref: string) => {
        if (pathname === itemHref) return true;
        if (itemHref === '/patients' && pathname.startsWith('/patients')) return true;
        return false;
    };

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
        const expanded = new Set<string>();
        navGroups.forEach(group => {
            if (group.items.some(item => isRouteActive(item.href))) {
                expanded.add(group.title);
            }
        });
        if (expanded.size === 0 && navGroups.length > 0) {
            expanded.add(navGroups[0].title);
        }
        return expanded;
    });

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(title)) {
                next.delete(title);
            } else {
                next.add(title);
            }
            return next;
        });
    };

    return (
        <div className={styles.navContent}>
            {navGroups.map((group) => {
                const isExpanded = expandedGroups.has(group.title);
                const GroupIcon = GROUP_ICON_MAP[group.title] || ClipboardList;
                const hasActiveItem = group.items.some(item => isRouteActive(item.href));

                // Single-item group: render as direct link, no accordion
                if (group.items.length === 1) {
                    const item = group.items[0];
                    if (!item.rolesAllowed.includes(role)) return null;
                    const IconComponent = ICON_MAP[item.label] || ClipboardList;
                    const isActive = isRouteActive(item.href);
                    return (
                        <nav key={group.title} className={styles.navSection}>
                            <Link
                                href={item.href}
                                target={item.label === 'Painel TV' ? '_blank' : undefined}
                                className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                            >
                                <IconComponent size={18} className={styles.navIcon} />
                                <span>{item.label}</span>
                            </Link>
                        </nav>
                    );
                }

                return (
                    <nav key={group.title} className={styles.navSection}>
                        <button
                            className={`${styles.groupHeader} ${hasActiveItem ? styles.groupHeaderActive : ''}`}
                            onClick={() => toggleGroup(group.title)}
                        >
                            <GroupIcon size={18} className={styles.groupHeaderIcon} />
                            <span className={styles.groupHeaderLabel}>{group.title}</span>
                            <ChevronDown
                                size={14}
                                className={`${styles.groupChevron} ${isExpanded ? styles.groupChevronOpen : ''}`}
                            />
                        </button>
                        {isExpanded && (
                            <div className={styles.navGroup}>
                                {group.items.map((item) => {
                                    const IconComponent = ICON_MAP[item.label] || ClipboardList;
                                    const isActive = isRouteActive(item.href);

                                    if (!item.rolesAllowed.includes(role)) return null;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            target={item.label === 'Painel TV' ? '_blank' : undefined}
                                            className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                                        >
                                            <IconComponent size={16} className={styles.navIcon} />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </nav>
                );
            })}
        </div>
    );
}
