import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isPathAuthorized, getAuthorizedHome } from '@/lib/rbac-rules';
import { Role } from '@/lib/types/auth';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const authMode = process.env.AUTH_MODE || 'stub';

    // 1. TV Protection (Pin based)
    if (pathname.startsWith('/tv')) {
        const tvPin = process.env.TV_PIN;
        if (!tvPin) return NextResponse.redirect(new URL('/unauthorized', request.url));

        const authCookie = request.cookies.get('tv_pin_ok');
        if (authCookie && authCookie.value === '1') return NextResponse.next();

        const pin = request.nextUrl.searchParams.get('pin');
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

    // 2. Auth Session Refresh & RBAC
    let supabaseResponse = NextResponse.next({ request });
    let userRole: string | undefined;
    let userId: string | undefined;

    if (authMode === 'supabase' && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() { return request.cookies.getAll(); },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                        supabaseResponse = NextResponse.next({ request });
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            userId = user.id;
            // Get role from profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            userRole = profile?.role;
        }
    } else {
        // Stub Mode
        userId = 'stub-id';
        userRole = request.cookies.get('mock_role')?.value;
    }

    // 3. Routing Protection (Primary Gate)
    const protectedPaths = ['/admin', '/secretary', '/doctor'];
    const currentPathIsProtected = protectedPaths.some(prefix => pathname.startsWith(prefix));

    if (currentPathIsProtected) {
        if (!userId) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        if (!userRole) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }

        // Use RBAC logic helper
        if (!isPathAuthorized(pathname, userRole as Role)) {
            const redirectUrl = getAuthorizedHome(userRole as Role);
            return NextResponse.redirect(new URL(redirectUrl, request.url));
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|login|unauthorized|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
