import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    const todayStr = '2026-03-05';
    const { data: apps } = await supabase
        .from('appointments')
        .select(`*, queue_items(*)`)
        .order('created_at', { ascending: false })
        .limit(10);

    const { data: queue } = await supabase
        .from('queue_items')
        .select(`*, appointments(*)`)
        .order('created_at', { ascending: false })
        .limit(10);

    const { data: clinics } = await supabase.from('profiles').select('clinic_id').limit(5);

    const res = {
        allRecentApps: apps,
        allRecentQueue: queue,
        clinics: clinics
    };

    const fs = await import('fs');
    fs.writeFileSync('scripts/deep_out.json', JSON.stringify(res, null, 2));
}

run();
