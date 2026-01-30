import { Role } from './session';

export interface RBACRule {
    pathPrefix: string;
    allowedRoles: Role[];
    redirectOnDeny?: string;
}

export const RBAC_RULES: RBACRule[] = [
    {
        pathPrefix: '/admin',
        allowedRoles: ['ADMIN'],
    },
    {
        pathPrefix: '/doctor',
        allowedRoles: ['ADMIN', 'DOCTOR'],
    },
    {
        pathPrefix: '/secretary',
        allowedRoles: ['ADMIN', 'SECRETARY'],
    },
];

export const ROLE_HOMES: Record<Role, string> = {
    'ADMIN': '/admin/patients',
    'DOCTOR': '/doctor/agenda',
    'SECRETARY': '/secretary/agenda',
};

export function isPathAuthorized(pathname: string, userRole: Role): boolean {
    const rule = RBAC_RULES.find(r => pathname.startsWith(r.pathPrefix));
    if (!rule) return true; // Public or unlisted paths
    return rule.allowedRoles.includes(userRole);
}

export function getAuthorizedHome(userRole: Role): string {
    return ROLE_HOMES[userRole] || '/unauthorized';
}
