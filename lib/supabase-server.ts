import { createClient } from '@supabase/supabase-js';

// Server-Side Supabase Client (bypasses RLS)
// This file should ONLY be imported in server-side files (Actions, Repositories running on server).
// Do NOT import this in Client Components.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    if (process.env.NODE_ENV === 'production' && process.env.USE_SUPABASE === 'true') {
        console.warn('CRITICAL: Supabase Service Role Key is missing. RLS bypass will fail.');
    }
}

// Create client with Service Role Key
// The 'auth.persistSession: false' is important for server-side usage to avoid sharing session state.
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey || 'placeholder-service-key', {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});
