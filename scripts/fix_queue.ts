import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Fixing Queue Items...');
    // The ID for "Dr. Test Automation"
    const targetDoctorId = '74817a06-4d74-4534-b5f6-75f6a3b9c709';

    const { data: q, error: errQ } = await supabase
        .from('queue_items')
        .update({ doctor_id: targetDoctorId })
        .in('status', ['WAITING', 'CALLED', 'IN_SERVICE'])
        .select('*');

    if (errQ) {
        console.error('Update Error:', errQ);
        return;
    }

    console.log('Fixed Items:', q);
    fs.writeFileSync('debug_fix.json', JSON.stringify({ fixed_items: q }, null, 2));
}

main().catch(console.error);
