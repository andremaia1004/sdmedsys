const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
    const doctorId = '74817a06-4d74-4534-b5f6-75f6a3b9c709'; // Dr. Test Automation id
    const patientId = '84e0d1f5-f1b7-4642-8ae1-7452af6ce1e4'; // Paciente P id
    const queueItemId = 'febb8aa4-42b7-43cf-aa04-dcc99f1faabb'; // Fake queue ID
    const clinicId = '550e8400-e29b-41d4-a716-446655440000';

    console.log('Inserting consultation...');
    const { data, error } = await supabase
        .from('consultations')
        .insert([{
            patient_id: patientId,
            doctor_id: doctorId,
            queue_item_id: queueItemId,
            clinical_notes: '',
            started_at: new Date().toISOString(),
            clinic_id: clinicId
        }])
        .select()
        .single();

    console.log(error ? 'Error:' : 'Success:', error || data);
}

run();
