import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. TV Protection (Existing Logic)
    if (pathname.startsWith('/tv')) {
        const tvPin = process.env.TV_PIN;
        if (!tvPin) {
            console.warn('TV_PIN is not set. Blocking access via middleware.');
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }

        const authCookie = request.cookies.get('tv_pin_ok');
        if (authCookie && authCookie.value === '1') {
            return NextResponse.next();
        }

        const url = request.nextUrl.clone();
        const pin = url.searchParams.get('pin');
        if (pin === tvPin) {
            const response = NextResponse.redirect(new URL('/tv', request.url));
            response.cookies.set('tv_pin_ok', '1', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 12
            });
            return response;
        }
        return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // 2. Auth Session Refresh (Supabase)
    // We must run this for typical protected routes to keep session alive.
    // AND to allow Server Components to read the session safely.
    // If we are in Stub mode, we skip this overhead.
    const authMode = process.env.AUTH_MODE || 'stub';

    let supabaseResponse = NextResponse.next({
        request,
    });

    if (authMode === 'supabase') {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                        supabaseResponse = NextResponse.next({
                            request,
                        });
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        // Refresh session
        const { data: { user } } = await supabase.auth.getUser();

        // 3. Protected Routes
        // Since we are migrating, let's keep it simple: 
        // If visiting /admin, /secretary, /doctor and NOT logged in -> Redirect to /login
        const protectedPrefixes = ['/admin', '/secretary', '/doctor'];
        const isProtected = protectedPrefixes.some(prefix => pathname.startsWith(prefix));

        if (isProtected && !user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    } else {
        // Stub Pattern (Legacy) check
        // Check for 'mock_role' cookie basically?
        // Or leave it to the Layouts?
        // Original middleware didn't check Stub Auth. Layouts or page logic handled it?
        // Let's stick thereto to replicate previous behavior unless requested.
        // Prompt said: "Middleware deve apenas bloquear rotas protegidas quando não autenticado"
        // Let's implement that for stub too lightly.

        const isProtected = ['/admin', '/secretary', '/doctor'].some(prefix => pathname.startsWith(prefix));
        if (isProtected) {
            const mockRole = request.cookies.get('mock_role');
            if (!mockRole) {
                return NextResponse.redirect(new URL('/login', request.url));
            }
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|login|unauthorized|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
