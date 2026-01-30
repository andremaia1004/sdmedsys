import { createClient } from '@supabase/supabase-js';

// Server-Side Supabase Client (bypasses RLS)
// This file should ONLY be imported in server-side files (Actions, Repositories).

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing on Vercel!');
}

// Create client with Service Role Key
// No strict throwing here, let operations fail gracefully or via catch blocks
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});
bitumen
