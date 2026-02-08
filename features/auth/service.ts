import { User, Role } from './types';
import { logAudit } from '@/lib/audit';

// Mock database
const MOCK_USERS: Record<string, User> = {
    'admin': { id: 'u1', name: 'Admin User', email: 'admin@sdmed.sys', role: 'ADMIN' },
    'sec': { id: 'u2', name: 'Secretary User', email: 'secretary@sdmed.sys', role: 'SECRETARY' },
    'doc': { id: 'u3', name: 'Doctor User', email: 'doctor@sdmed.sys', role: 'DOCTOR' },
};

export class AuthService {
    static async login(username: string): Promise<{ user: User; token: string } | null> {
        // Simulate DB delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const user = MOCK_USERS[username];
        if (!user) {
            await logAudit('LOGIN_FAILURE', 'AUTH', username, { reason: 'User not found' });
            return null;
        }

        // In a real app, this would be a JWT signed by the server
        const token = btoa(JSON.stringify({ id: user.id, role: user.role }));

        await logAudit('LOGIN', 'AUTH', user.id, { email: user.email, role: user.role });

        return { user, token };
    }

    static async getUser(token: string): Promise<User | null> {
        try {
            const payload = JSON.parse(atob(token));

            // In real app, verify DB validity
            return {
                id: payload.id,
                name: 'Mock User',
                email: 'mock@test.com',
                role: payload.role as Role
            };
        } catch (err) {
            return null;
        }
    }

    static async logout(): Promise<void> {
        // Since we don't have the user ID here easily in this mock, 
        // a real implementation would extract it from the token first.
        await logAudit('LOGOUT', 'AUTH', 'current-session');
        await new Promise(resolve => setTimeout(resolve, 200));
    }
}
