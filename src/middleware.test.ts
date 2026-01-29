import { describe, it, expect, vi } from 'vitest';
import { middleware } from './middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mock NextResponse
vi.mock('next/server', async () => {
    const actual = await vi.importActual('next/server');
    return {
        ...actual,
        NextResponse: {
            redirect: vi.fn(),
            next: vi.fn(),
        },
    };
});

describe('Middleware RBAC', () => {
    const createReq = (path: string, token?: string) => {
        const req = {
            nextUrl: { pathname: path },
            url: 'http://localhost' + path,
            cookies: {
                get: (name: string) => (name === 'auth_token' && token ? { value: token } : undefined),
            },
        } as any as NextRequest;
        return req;
    };

    const createToken = (role: string) => btoa(JSON.stringify({ id: '1', role }));

    it('redirects unauthenticated user to login', () => {
        const req = createReq('/admin');
        middleware(req);
        expect(NextResponse.redirect).toHaveBeenCalledWith(expect.objectContaining({ href: 'http://localhost/login' }));
    });

    it('allows admin to access admin', () => {
        const token = createToken('ADMIN');
        const req = createReq('/admin', token);
        middleware(req);
        expect(NextResponse.next).toHaveBeenCalled();
    });

    it('redirects secretary trying to access admin', () => {
        const token = createToken('SECRETARY');
        const req = createReq('/admin', token);
        middleware(req);
        expect(NextResponse.redirect).toHaveBeenCalledWith(expect.objectContaining({ href: 'http://localhost/unauthorized' }));
    });

    it('allows secretary to access secretary dashboard', () => {
        const token = createToken('SECRETARY');
        const req = createReq('/secretary', token);
        middleware(req);
        expect(NextResponse.next).toHaveBeenCalled();
    });
});
