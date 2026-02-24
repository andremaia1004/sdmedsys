import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Testing Queue...');
    const { data: q } = await supabase.from('queue_items').select('*').in('status', ['WAITING', 'CALLED', 'IN_SERVICE']);
    console.log('Active Queue Items:', q);

    const { data: d, error: errD } = await supabase.from('doctors').select('*');
    if (errD) console.error('Doctors Error:', errD);

    const { data: { users }, error: errU } = await supabase.auth.admin.listUsers();
    if (errU) console.error('Admin Users Error:', errU);

    const fs = require('fs');
    fs.writeFileSync('debug.json', JSON.stringify({
        queue: q,
        doctors: d,
        users: users
    }, null, 2));
    console.log('Saved to debug.json');
}

main().catch(console.error);
