export type Role = 'ADMIN' | 'SECRETARY' | 'DOCTOR';

export interface UserSession {
    id: string;
    name: string;
    role: Role;
    clinicId?: string;
    email?: string;
}
