import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { SupabaseDoctorsRepository } from './features/doctors/repository.supabase';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

async function run() {
    console.log('Testing repository...');
    try {
        const clinicId = '550e8400-e29b-41d4-a716-446655440000';
        const repo = new SupabaseDoctorsRepository(supabaseServer, clinicId);
        const docs = await repo.list(true);
        console.log('Doctors found:', docs);
    } catch (e) {
        console.error('Error:', e);
    }
}

run();
