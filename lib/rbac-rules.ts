import { Role } from './types/auth';

export const ROLE_HOMES: Record<Role, string> = {
    'ADMIN': '/admin',
    'DOCTOR': '/doctor/agenda',
    'SECRETARY': '/secretary/agenda',
};

export interface RBACRule {
    pathPrefix: string;
    allowedRoles: Role[];
}

export const RBAC_RULES: RBACRule[] = [
    // Strict Admin Only
    { pathPrefix: '/admin', allowedRoles: ['ADMIN'] },

    // Shared Operational Areas
    { pathPrefix: '/secretary', allowedRoles: ['ADMIN', 'SECRETARY'] },
    { pathPrefix: '/doctor', allowedRoles: ['ADMIN', 'DOCTOR'] },

    // Neutral Area
    { pathPrefix: '/patients', allowedRoles: ['ADMIN', 'SECRETARY', 'DOCTOR'] },

    // Public/Shared (TV) - Handled via PIN or specific logic in middleware/page
    { pathPrefix: '/tv', allowedRoles: ['ADMIN', 'SECRETARY'] },
];

export function isPathAuthorized(pathname: string, userRole: Role): boolean {
    // Find the most specific rule matching the start of the path
    // Sort rules by length descending to match /admin/doctors before /admin if needed (though prefixes here are distinct)
    const rule = RBAC_RULES.find(r => pathname.startsWith(r.pathPrefix));

    if (!rule) return true; // Public or unlisted paths are open (or handled by other middleware guards)

    return rule.allowedRoles.includes(userRole);
}

export function getAuthorizedHome(userRole: Role): string {
    return ROLE_HOMES[userRole] || '/login';
}
