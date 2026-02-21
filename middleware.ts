import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isPathAuthorized, getAuthorizedHome } from '@/lib/rbac-rules';
import { Role } from '@/lib/types/auth';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const authMode = process.env.AUTH_MODE || 'stub';

    // 1. TV Protection (Removed for public access)
    // No longer required as per user request

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

    // 3. Legacy Patient Redirects & Forwarding
    // Check for legacy routes: /admin/patients, /doctor/patients, /secretary/patients
    if (pathname.includes('/patients')) {
        const legacyPrefixes = ['/admin/patients', '/doctor/patients', '/secretary/patients'];
        const matchedPrefix = legacyPrefixes.find(prefix => pathname.startsWith(prefix));

        if (matchedPrefix) {
            // Extract the remainder of the path after the prefix
            // e.g., /admin/patients/new -> /patients/new
            // e.g., /doctor/patients/123 -> /patients/123
            const remainder = pathname.replace(matchedPrefix, '');
            const targetUrl = `/patients${remainder}`;
            return NextResponse.redirect(new URL(targetUrl, request.url));
        }
    }

    // 4. TV Route Protection (PIN Auth)
    if (pathname.startsWith('/tv')) {
        const pin = request.nextUrl.searchParams.get('pin');
        const hasAuthCookie = request.cookies.has('sdmed_tv_auth');
        const envPin = process.env.TV_PIN;

        if (!envPin) {
            console.error('TV_PIN environment variable is not configured');
            return NextResponse.redirect(new URL('/unauthorized?error=missing_config', request.url));
        }

        if (hasAuthCookie) {
            // Let it pass
            if (pin) {
                const url = new URL(request.url);
                url.searchParams.delete('pin');
                return NextResponse.redirect(url);
            }
            return supabaseResponse;
        }

        if (pin === envPin) {
            // Valid PIN, set cookie and redirect to clean URL
            const url = new URL(request.url);
            url.searchParams.delete('pin');
            const res = NextResponse.redirect(url);
            res.cookies.set('sdmed_tv_auth', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 43200 // 12 hours
            });
            return res;
        }

        // Invalid or no PIN and no cookie
        return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // 5. Routing Protection (Primary Gate)
    const protectedPaths = ['/admin', '/secretary', '/doctor', '/patients'];
    const currentPathIsProtected = protectedPaths.some(prefix => pathname.startsWith(prefix));

    if (currentPathIsProtected) {
        if (!userId) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        if (!userRole) {
            // If logged in but no role, redirect to unauthorized or login
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }

        // Use RBAC logic helper
        if (!isPathAuthorized(pathname, userRole as Role)) {
            // If denied, redirect to their role's home
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
