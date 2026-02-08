import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isPathAuthorized, getAuthorizedHome, RBAC_RULES } from '@/lib/rbac-rules';
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
        const rawRole = request.cookies.get('mock_role')?.value;
        const validRoles = RBAC_RULES.flatMap(rule => rule.allowedRoles);
        const isValidRole = validRoles.includes(rawRole as Role);
        userRole = isValidRole ? rawRole : undefined;

        if (!userRole && process.env.NODE_ENV === 'production') {
            userId = undefined;
        } else {
            userId = 'stub-id';
            if (!userRole) {
                userRole = 'SECRETARY';
            }
        }
    }

    // 3. Legacy Patient Redirects & Forwarding
    if (pathname.includes('/patients')) {
        // Handle legacy role-prefixed patient paths
        if (pathname.startsWith('/admin/patients') ||
            pathname.startsWith('/doctor/patients') ||
            pathname.startsWith('/secretary/patients')) {

            // Extract potential ID: /role/patients/[id]...
            const pathParts = pathname.split('/');
            const patientId = pathParts[3]; // e.g., "", "uuid", etc.

            const targetUrl = patientId ? `/patients/${patientId}` : '/patients';
            return NextResponse.redirect(new URL(targetUrl, request.url));
        }
    }

    // 4. Routing Protection (Primary Gate)
    const protectedPaths = RBAC_RULES.map(rule => rule.pathPrefix);
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
