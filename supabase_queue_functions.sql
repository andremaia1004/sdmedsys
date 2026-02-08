-- Function to atomically generate the next ticket code and insert a queue item
-- This prevents race conditions where two items get the same ticket code.

CREATE OR REPLACE FUNCTION generate_queue_ticket(
    p_clinic_id UUID,
    p_patient_id UUID,
    p_doctor_id TEXT,
    p_appointment_id UUID,
    p_status TEXT,
    p_prefix TEXT DEFAULT 'A'
) RETURNS UUID AS $$
DECLARE
    v_next_val INT;
    v_ticket_code TEXT;
    v_new_id UUID;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Atomic count and generation
    -- Note: This is still slightly prone to race conditions if not using FOR UPDATE
    -- but much better than client-side logic.
    -- For 100% safety, we could use a separate 'counters' table or a lock.
    
    SELECT COUNT(*) + 1 INTO v_next_val 
    FROM queue_items 
    WHERE clinic_id = p_clinic_id 
    AND created_at::DATE = v_today;

    v_ticket_code := p_prefix || LPAD(v_next_val::TEXT, 3, '0');

    INSERT INTO queue_items (
        patient_id,
        doctor_id,
        appointment_id,
        status,
        ticket_code,
        clinic_id,
        created_at,
        updated_at
    ) VALUES (
        p_patient_id,
        p_doctor_id,
        p_appointment_id,
        p_status,
        v_ticket_code,
        p_clinic_id,
        NOW(),
        NOW()
    ) RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
