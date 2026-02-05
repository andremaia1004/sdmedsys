'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';
import { Role } from '@/lib/session';
import {
    Calendar,
    Users,
    FileText,
    Contact,
    Stethoscope,
    Settings,
    ShieldCheck,
    Tv
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

export default function SidebarNav({ role }: { role: Role }) {
    const pathname = usePathname();

    const filteredCategories = navCategories.map(category => ({
        ...category,
        items: category.items.filter(item => item.roles.includes(role))
    })).filter(category => category.items.length > 0);

    return (
        <div className={styles.navContent}>
            {filteredCategories.map((category) => (
                <nav key={category.title} className={styles.navSection}>
                    <h3 className={styles.navTitle}>{category.title}</h3>
                    <div className={styles.navGroup}>
                        {category.items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    target={item.target}
                                    className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                                >
                                    <item.icon size={18} className={styles.navIcon} />
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
