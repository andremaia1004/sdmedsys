import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server Client for Auth (handles Cookies)
export async function createClient() {
    // Defensive check for Environment Variables to prevent crashing during SSR if missing
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        if (process.env.NODE_ENV === 'production') {
            console.error('CRITICAL: Supabase environment variables are missing!');
        }
    }

    const cookieStore = await cookies();

    return createServerClient(
        url || 'https://missing-url.supabase.co',
        key || 'missing-key',
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // Safe to ignore in Server Components
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // Safe to ignore in Server Components
                    }
                },
            },
        }
    );
}
