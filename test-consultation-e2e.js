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
    const doctorUid = authData.user.id;

    console.log('1. Starting consultation...');
    const { data: consultation, error: startErr } = await supabase
        .from('consultations')
        .insert([{
            patient_id: patientId,
            doctor_id: doctorUid,
            clinical_notes: '',
            started_at: new Date().toISOString(),
            clinic_id: clinicId
        }])
        .select()
        .single();

    if (startErr) {
        console.error('Error starting:', startErr);
        return;
    }
    console.log('Consultation UUID:', consultation.id);

    console.log('2. Saving Draft (is_final = false)...');
    const { error: ceErr } = await supabase
        .from('clinical_entries')
        .insert([{
            consultation_id: consultation.id,
            patient_id: patientId,
            doctor_user_id: doctorUid,
            clinic_id: clinicId,
            chief_complaint: 'Paciente com tosse forte',
            diagnosis: 'Gripe Comum',
            conduct: 'Repouso e ingestão de líquidos',
            is_final: false
        }]);

    if (ceErr) {
        console.error('Error saving draft:', ceErr);
        return;
    }

    console.log('Draft saved successfully.');

    console.log('3. Finishing consultation (is_final = true)...');

    // Update consultation
    await supabase.from('consultations')
        .update({ finished_at: new Date().toISOString() })
        .eq('id', consultation.id);

    // Update clinical entry
    await supabase.from('clinical_entries')
        .update({ is_final: true })
        .eq('consultation_id', consultation.id);

    console.log('Flow completed! Validations should now return true.');
}

run();
