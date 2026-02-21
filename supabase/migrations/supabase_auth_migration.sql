-- Create Profiles table to manage Roles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT CHECK (role IN ('ADMIN', 'SECRETARY', 'DOCTOR')),
    clinic_id UUID DEFAULT gen_random_uuid(), -- Placeholder for multi-tenant future
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow Service Role (Server Actions) full access (implicit, but good to know)

-- Function to handle new user creation (Optional for self-signup, but we might do manual seed)
-- For MVP, we will manually insert into profiles when creating users.

-- TRIGGER: Auto-update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
