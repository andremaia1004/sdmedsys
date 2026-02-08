import { logAudit } from '@/lib/audit';
import { User, Role } from './types';

// Mock database
const MOCK_USERS: Record<string, User> = {
    'admin': { id: 'u1', name: 'Admin User', email: 'admin@sdmed.sys', role: 'ADMIN' },
    'sec': { id: 'u2', name: 'Secretary User', email: 'secretary@sdmed.sys', role: 'SECRETARY' },
    'doc': { id: 'u3', name: 'Doctor User', email: 'doctor@sdmed.sys', role: 'DOCTOR' },
};

export class AuthService {
    // TODO: Audit Log - Inject logger here

    static async login(username: string): Promise<{ user: User; token: string } | null> {
        // Simulate DB delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const user = MOCK_USERS[username];
        if (!user) {
            await logAudit('LOGIN', 'AUTH', undefined, { username, success: false });
            return null;
        }

        // In a real app, this would be a JWT signed by the server
        // For stub, we'll just base64 encode the role for simple middleware decoding
        const token = btoa(JSON.stringify({ id: user.id, role: user.role }));

        await logAudit('LOGIN', 'AUTH', user.id, { username, success: true });

        return { user, token };
    }

    static async getUser(token: string): Promise<User | null> {
        try {
            const payload = JSON.parse(atob(token));
            await logAudit('VERIFY_SESSION', 'AUTH', payload.id, { tokenValid: true });

            // In real app, verify DB validity
            return {
                id: payload.id,
                name: 'Mock User',
                email: 'mock@test.com',
                role: payload.role as Role
            };
        } catch {
            await logAudit('VERIFY_SESSION', 'AUTH', undefined, { tokenValid: false });
            return null;
        }
    }

    static async logout(): Promise<void> {
        await logAudit('LOGOUT', 'AUTH');
        await new Promise(resolve => setTimeout(resolve, 200));
    }
}
