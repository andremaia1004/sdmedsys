-- Add Kind to Appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS kind TEXT CHECK (kind IN ('SCHEDULED', 'WALK_IN')) DEFAULT 'SCHEDULED';
ALTER TABLE public.appointments ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE public.appointments ALTER COLUMN end_time DROP NOT NULL;

-- Add Source Type and Priority to Queue Items
ALTER TABLE public.queue_items ADD COLUMN IF NOT EXISTS source_type TEXT CHECK (source_type IN ('SCHEDULED', 'WALK_IN'));
ALTER TABLE public.queue_items ADD COLUMN IF NOT EXISTS triage_priority INTEGER DEFAULT 0;

-- Audit Log for migration
INSERT INTO public.audit_logs (action, actor_role, details)
VALUES ('DATABASE_MIGRATION', 'SYSTEM', 'Updated appointments and queue_items for HYBRID MODO (kind, source_type)');
