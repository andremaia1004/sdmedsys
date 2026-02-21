-- Enable Row Level Security (RLS) on strict tables
-- This blocks ALL access via the Anon Key by default unless a policy exists.

-- 1. Patients
ALTER TABLE IF EXISTS patients ENABLE ROW LEVEL SECURITY;

-- 2. Appointments
ALTER TABLE IF EXISTS appointments ENABLE ROW LEVEL SECURITY;

-- 3. Queue Items
ALTER TABLE IF EXISTS queue_items ENABLE ROW LEVEL SECURITY;

-- 4. Consultations (Highly Sensitive)
ALTER TABLE IF EXISTS consultations ENABLE ROW LEVEL SECURITY;

-- Policies
-- Since the application now strictly uses Server Actions with the Service Role Key,
-- we do NOT need to open these tables to the 'anon' or 'authenticated' roles yet.
-- The Service Role bypasses RLS automatically.

-- However, as a best practice to avoid "policy not found" confusion or future proofing:
-- We can create a "Deny All" policy explicit check, or just leave it with no policies (which is implicit Deny All).

-- Let's create an explicit "Allow Server Access" comment/policy placeholder if we were using Auth.
-- For now, implicit Deny for 'anon' is sufficient and secure.

-- If in the future we want to allow TV to read queue items via client-side (unlikely), we would add:
-- CREATE POLICY "TV Read Only" ON queue_items FOR SELECT TO anon USING (true);
