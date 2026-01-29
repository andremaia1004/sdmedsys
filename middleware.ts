import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect /tv route
    if (pathname.startsWith('/tv')) {
        const tvPin = process.env.TV_PIN;

        // If no PIN is configured in environment, allow access (or block? Prompt says "Protect... to avoid undue access". 
        // Usually if env is missing, we might default to safe or fail open. 
        // Prompt says "Criar variável... permitir somente se fornecer PIN". Implies blocking if not validated.
        // If TV_PIN is not set, let's assume it's NOT protected or Blocked. 
        // Best practice for "Secure functionality": Fail closed. But for a migration MVP?
        // Let's assume: If TV_PIN is set, enforce it. If not set, maybe allow (dev) or block (prod).
        // Prompt: "Permitir acesso à /tv somente se o usuário fornecer o PIN correto." -> Implies PIN is required.
        // So if TV_PIN is missing, effectively access is denied implicitly or we should check logic.
        // Let's implement: If TV_PIN is present, enforce. If not present, maybe pass through (or log warning).
        // Safest: Enforce. 

        if (!tvPin) {
            // If no PIN is configured on server, maybe we authorize? Or we block?
            // Let's log and Block to be safe/strict as per "Security" goal.
            console.warn('TV_PIN is not set. Blocking access to /tv');
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }

        // 1. Check Cookie
        const authCookie = request.cookies.get('tv_pin_ok');
        if (authCookie && authCookie.value === '1') {
            return NextResponse.next();
        }

        // 2. Check Query Param
        const url = request.nextUrl.clone();
        const pin = url.searchParams.get('pin');

        if (pin === tvPin) {
            // Valid PIN
            const response = NextResponse.redirect(new URL('/tv', request.url)); // Redirect to clean URL

            // Set Cookie (12h)
            response.cookies.set('tv_pin_ok', '1', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 12 // 12 hours
            });

            return response;
        }

        // 3. Unauthorized
        return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/tv/:path*',
    ],
};
