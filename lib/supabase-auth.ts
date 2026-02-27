import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server Client for Auth (handles Cookies)
export async function createClient() {
    console.log('DEBUG: lib/supabase-auth.ts:createClient - start');
    // Defensive check for Environment Variables to prevent crashing during SSR if missing
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        if (process.env.NODE_ENV === 'production') {
            console.error('CRITICAL: Supabase environment variables are missing!');
        }
    }

    console.log('DEBUG: lib/supabase-auth.ts:createClient - awaiting cookies()');
    const cookieStore = await cookies();
    console.log('DEBUG: lib/supabase-auth.ts:createClient - cookies() resolved');

    return createServerClient(
        url || 'https://missing-url.supabase.co',
        key || 'missing-key',
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options)
                        })
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
}
