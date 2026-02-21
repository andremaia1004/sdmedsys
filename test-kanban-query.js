const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// We need to simulate the query since we don't have Next.js env here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'; // from env
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'; // from env

// Read env file
const envFile = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function testQuery() {
    const startOfDay = `2026-02-21T00:00:00Z`;
    const endOfDay = `2026-02-21T23:59:59Z`;
    const clinicId = '550e8400-e29b-41d4-a716-446655440000';

    const { data, error } = await supabase
        .from('appointments')
        .select(`
            id,
            patient_id,
            patient_name,
            doctor_id,
            start_time,
            status,
            queue_items (
                id,
                ticket_code,
                status
            )
        `)
        .eq('clinic_id', clinicId)
        .order('start_time', { ascending: true });

    if (error) {
        console.error('ERROR:', error);
    } else {
        console.log('DATA:', JSON.stringify(data, null, 2));
    }
}

testQuery();
