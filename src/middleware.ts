import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const path = request.nextUrl.pathname;

    // 1. Redirect to login if accessing protected routes without token
    const isProtectedRoute = path.startsWith('/admin') || path.startsWith('/secretary') || path.startsWith('/doctor');

    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. If token exists, parse role and enforce RBAC
    if (token) {
        try {
            // Decode stub token (In real app: verify JWT)
            const payload = JSON.parse(atob(token));
            const role = payload.role;

            if (path.startsWith('/admin') && role !== 'ADMIN') {
                return NextResponse.redirect(new URL('/unauthorized', request.url));
            }
            if (path.startsWith('/secretary') && role !== 'SECRETARY' && role !== 'ADMIN') {
                return NextResponse.redirect(new URL('/unauthorized', request.url));
            }
            if (path.startsWith('/doctor') && role !== 'DOCTOR') {
                return NextResponse.redirect(new URL('/unauthorized', request.url));
            }

            // Prevent authenticated users from visiting login
            if (path === '/login') {
                if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
                if (role === 'SECRETARY') return NextResponse.redirect(new URL('/secretary', request.url));
                if (role === 'DOCTOR') return NextResponse.redirect(new URL('/doctor', request.url));
            }

        } catch (e) {
            // Invalid token, force logout/redirect
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('auth_token');
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
