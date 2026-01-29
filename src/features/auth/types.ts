export type Role = 'ADMIN' | 'SECRETARY' | 'DOCTOR';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
}

export const PERMISSIONS = {
    ADMIN: {
        canManageUsers: true,
        canManageSettings: true,
        canAccessAllData: true,
    },
    SECRETARY: {
        canManagePatients: true,
        canManageAgenda: true,
        canControlQueue: true,
        canViewClinicalData: false,
    },
    DOCTOR: {
        canViewOwnAgenda: true,
        canViewDailyQueue: true,
        canManageOwnConsultations: true,
        canViewGlobalPatients: false,
    }
} as const;
