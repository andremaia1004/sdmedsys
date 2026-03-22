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
            title: 'Painel',
            items: [
                {
                    label: 'Painel Administrativo',
                    href: '/admin',
                    rolesAllowed: ['ADMIN'],
                },
            ]
        },
        {
            title: 'Operação',
            items: [
                {
                    label: 'Painel do Dia',
                    href: '/secretary/dashboard',
                    rolesAllowed: ['ADMIN', 'SECRETARY'],
                },
                {
                    label: 'Operação de Fila',
                    href: '/secretary/queue/ops',
                    rolesAllowed: ['ADMIN', 'SECRETARY'],
                },
                {
                    label: 'Agenda',
                    href: '/doctor/agenda',
                    rolesAllowed: ['ADMIN', 'DOCTOR'],
                },
                {
                    label: 'CRM Comercial',
                    href: '/secretary/crm',
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
                    legacyFrom: ['/admin/patients', '/doctor/patients', '/secretary/patients']
                },
                {
                    label: 'Médicos',
                    href: '/admin/doctors',
                    rolesAllowed: ['ADMIN'],
                },
                {
                    label: 'Funcionários',
                    href: '/admin/secretaries',
                    rolesAllowed: ['ADMIN'],
                },
            ]
        },
        {
            title: 'Financeiro',
            items: [
                {
                    label: 'Dashboard Financeiro',
                    href: '/admin/financial',
                    rolesAllowed: ['ADMIN'],
                },
                {
                    label: 'Caixa do Dia',
                    href: '/secretary/financial',
                    rolesAllowed: ['ADMIN'],
                },
                {
                    label: 'Catálogo de Serviços',
                    href: '/admin/financial/services',
                    rolesAllowed: ['ADMIN'],
                },
            ]
        },
        {
            title: 'Sistema',
            items: [
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
                    label: 'Painel do Dia',
                    href: '/secretary/dashboard',
                    rolesAllowed: ['ADMIN', 'SECRETARY'],
                },
                {
                    label: 'Agenda',
                    href: '/secretary/agenda',
                    rolesAllowed: ['SECRETARY'],
                },
                {
                    label: 'Operação de Fila',
                    href: '/secretary/queue/ops',
                    rolesAllowed: ['ADMIN', 'SECRETARY'],
                },
                {
                    label: 'CRM Comercial',
                    href: '/secretary/crm',
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
            title: 'Financeiro',
            items: [
                {
                    label: 'Caixa do Dia',
                    href: '/secretary/financial',
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
                    label: 'Meu Painel',
                    href: '/doctor',
                    rolesAllowed: ['ADMIN', 'DOCTOR'],
                },
                {
                    label: 'Minha Fila',
                    href: '/doctor/queue',
                    rolesAllowed: ['ADMIN', 'DOCTOR'],
                },
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
