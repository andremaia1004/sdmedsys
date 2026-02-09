-- Check clinic_id consistency
SELECT id, email, role, clinic_id FROM profiles;

-- Check created appointments and their clinic_id
SELECT id, start_time, doctor_id, clinic_id, status FROM appointments ORDER BY created_at DESC LIMIT 5;

-- Check doctors and their clinic_id
SELECT id, name, profile_id, clinic_id FROM doctors;
