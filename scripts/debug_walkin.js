const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: qData } = await supabase.from('queue_items').select('*').order('created_at', { ascending: false }).limit(2);

    const appIds = qData.map(q => q.appointment_id).filter(Boolean);
    let aData = [];
    if (appIds.length > 0) {
        const { data } = await supabase.from('appointments').select('*').in('id', appIds);
        aData = data;
    }

    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(`${today}T00:00:00-03:00`).toISOString();
    const endOfDay = new Date(`${today}T23:59:59-03:00`).toISOString();

    const { data: aData2 } = await supabase.from('appointments').select('*').order('created_at', { ascending: false }).limit(2);

    fs.writeFileSync('scripts/debug_out.json', JSON.stringify({
        queue_items: qData,
        matched_apps: aData,
        bounds: { startOfDay, endOfDay },
        latest_apps: aData2
    }, null, 2));
}

run();
