import { cookies } from 'next/headers';

export type Role = 'ADMIN' | 'SECRETARY' | 'DOCTOR';

export interface UserSession {
    id: string;
    name: string;
    role: Role;
}

// Mock Session Store - In real app, this verifies JWT/Session Cookie
export async function getCurrentUser(): Promise<UserSession | null> {
    // For MVP Walkthrough, we can simulate different users by simple hardcoding or a debug cookie.
    // Let's assume a default 'SECRETARY' for general actions if not specified, 
    // BUT for specific modules we might want to pretend otherwise.
    // Ideally, the caller or specific test scenarios set this. 
    // To keep it simple and testable without a real auth provider:

    // We will look for a mock cookie 'mock_role'.
    const cookieStore = await cookies();
    const mockRole = cookieStore.get('mock_role')?.value as Role | undefined;

    // Default to SECRETARY for ease of testing Main Flow if no cookie
    const role: Role = mockRole || 'SECRETARY';
    let id = 'u1';
    let name = 'User';

    if (role === 'DOCTOR') {
        id = 'doc'; // Match the hardcoded ID we used in pages
        name = 'Dr. House';
    } else if (role === 'ADMIN') {
        id = 'admin';
        name = 'Admin User';
    }

    return { id, name, role };
}

export async function requireRole(allowedRoles: Role[]) {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Unauthorized: No active session');
    }
    if (!allowedRoles.includes(user.role)) {
        throw new Error(`Forbidden: Role ${user.role} is not allowed. Required: ${allowedRoles.join(', ')}`);
    }
    return user;
}
