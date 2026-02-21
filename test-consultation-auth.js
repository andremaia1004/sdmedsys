const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
    const patientId = '84e0d1f5-f1b7-4642-8ae1-7452af6ce1e4'; // Paciente P id
    const clinicId = '550e8400-e29b-41d4-a716-446655440000';

    console.log('Logging in as doctor...');
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'doctor@sdmed.com',
        password: 'password123'
    });

    if (authErr) {
        console.error('Failed to login:', authErr);
        return;
    }

    console.log('Logged in! Auth ID:', authData.user.id);

    // Setup queue item if none exists
    let queueItemId = null;
    const { data: qData } = await supabase.from('queue_items').select('id').eq('patient_id', patientId).limit(1);
    if (qData && qData.length > 0) {
        queueItemId = qData[0].id;
    }

    console.log('Inserting consultation...');
    // We use the authenticated supabase client now
    const { data, error } = await supabase
        .from('consultations')
        .insert([{
            patient_id: patientId,
            doctor_id: authData.user.id, // Auth UID
            queue_item_id: queueItemId,
            clinical_notes: '',
            started_at: new Date().toISOString(),
            clinic_id: clinicId
        }])
        .select()
        .single();

    console.log(error ? 'Error inserting:' : 'Success inserting consultation:', error || data);
}

run();
