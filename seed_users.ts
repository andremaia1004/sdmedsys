import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const defaultUsers = [
    { email: 'admin@sdmed.com', password: 'password123', role: 'ADMIN' },
    { email: 'secretary@sdmed.com', password: 'password123', role: 'SECRETARY' },
    { email: 'doctor@sdmed.com', password: 'password123', role: 'DOCTOR' },
];

async function seed() {
    console.log('🚀 Starting user seed...');

    for (const u of defaultUsers) {
        console.log(`Checking user: ${u.email}...`);

        // 1. Create User in Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true
        });

        if (authError) {
            if (authError.message.includes('already exists')) {
                console.log(`User ${u.email} already exists in Auth.`);
                // If exists, we still need to ensure profile exists
                const { data: existingUser } = await supabase.auth.admin.listUsers();
                const found = existingUser.users.find(user => user.email === u.email);
                if (found) {
                    await updateProfile(found.id, u.email, u.role);
                }
            } else {
                console.error(`Error creating user ${u.email}:`, authError.message);
            }
        } else if (authUser.user) {
            console.log(`User ${u.email} created successfully.`);
            await updateProfile(authUser.user.id, u.email, u.role);
        }
    }

    console.log('✅ Seeding complete!');
}

async function updateProfile(id: string, email: string, role: string) {
    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: id,
            email: email,
            role: role,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error(`Error updating profile for ${email}:`, error.message);
    } else {
        console.log(`Profile for ${email} updated with role ${role}.`);
    }
}

seed();
