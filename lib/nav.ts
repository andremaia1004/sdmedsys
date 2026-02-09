import { Role } from './session';

export type NavItem = {
    label: string;
    href: string;
    icon?: string; // Optional icon name (to be handled by Sidebar)
    rolesAllowed: Role[];
    isLegacyRedirect?: boolean;
    legacyFrom?: string[];
};

export type NavGroup = {
    title: string;
    items: NavItem[];
};

export const navItemsByRole: Record<Role, NavGroup[]> = {
    ADMIN: [
        {
            title: 'Operação (Atalhos)',
            items: [
                {
                    label: 'Painel do dia',
                    href: '/secretary/dashboard',
                    rolesAllowed: ['ADMIN', 'SECRETARY'],
                },
                {
                    label: 'Agenda (Doc)',
                    href: '/doctor/agenda',
                    rolesAllowed: ['ADMIN', 'DOCTOR'],
                },
                {
                    label: 'Minha fila (Doc)',
                    href: '/doctor/queue',
                    rolesAllowed: ['ADMIN', 'DOCTOR'],
                },
            ]
        },
        {
            title: 'Cadastros',
            items: [
                {
                    label: 'Pacientes',
                    href: '/patients',
                    rolesAllowed: ['ADMIN', 'SECRETARY', 'DOCTOR'],
                    isLegacyRedirect: true,
                    legacyFrom: ['/admin/patients', '/doctor/patients', '/secretary/patients']
                },
                {
                    label: 'Médicos',
                    href: '/admin/doctors',
                    rolesAllowed: ['ADMIN'],
                },
            ]
        },
        {
            title: 'Sistema',
            items: [
                {
                    label: 'Painel TV',
                    href: '/tv',
                    rolesAllowed: ['ADMIN', 'SECRETARY'], // Usually PIN protected, but listed for navigation
                },
                {
                    label: 'Configurações',
                    href: '/admin/settings',
                    rolesAllowed: ['ADMIN'],
                },
                {
                    label: 'Auditoria',
                    href: '/admin/audit',
                    rolesAllowed: ['ADMIN'],
                },
            ]
        }
    ],

    SECRETARY: [
        {
            title: 'Operação',
            items: [
                {
                    label: 'Painel do dia',
                    href: '/secretary/dashboard',
                    rolesAllowed: ['ADMIN', 'SECRETARY'],
                },
                {
                    label: 'Painel TV',
                    href: '/tv',
                    rolesAllowed: ['ADMIN', 'SECRETARY'],
                },
            ]
        },
        {
            title: 'Cadastros',
            items: [
                {
                    label: 'Pacientes',
                    href: '/patients',
                    rolesAllowed: ['ADMIN', 'SECRETARY', 'DOCTOR'],
                    isLegacyRedirect: true,
                    legacyFrom: ['/secretary/patients']
                },
            ]
        }
    ],

    DOCTOR: [
        {
            title: 'Atendimento',
            items: [
                {
                    label: 'Minha Fila',
                    href: '/doctor/queue',
                    rolesAllowed: ['ADMIN', 'DOCTOR'],
                },
                // Note: 'Consultation' is usually dynamic (/doctor/consultation/[id]), 
                // so it might not be a direct Sidebar link unless it points to a "Worklist" or "Active Consultation".
                // Assuming it links to the queue or a specific landing for consultations if changed.
                // For now, mapping as requested, but logic implies this is started from Queue.
            ]
        },
        {
            title: 'Agenda',
            items: [
                {
                    label: 'Agenda',
                    href: '/doctor/agenda',
                    rolesAllowed: ['ADMIN', 'DOCTOR'],
                },
            ]
        },
        {
            title: 'Cadastros',
            items: [
                {
                    label: 'Pacientes',
                    href: '/patients',
                    rolesAllowed: ['ADMIN', 'SECRETARY', 'DOCTOR'],
                    isLegacyRedirect: true,
                    legacyFrom: ['/doctor/patients']
                },
            ]
        }
    ]
};
