-- Update Appointments Statuses
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('SCHEDULED', 'CANCELED', 'COMPLETED', 'ARRIVED', 'NO_SHOW'));

-- Ensure Queue Items has consistent statuses
ALTER TABLE public.queue_items DROP CONSTRAINT IF EXISTS queue_items_status_check;
ALTER TABLE public.queue_items ADD CONSTRAINT queue_items_status_check 
CHECK (status IN ('WAITING', 'CALLED', 'IN_SERVICE', 'DONE', 'NO_SHOW', 'CANCELED'));

-- Audit Log for migration
INSERT INTO public.audit_logs (action, actor_role, details)
VALUES ('DATABASE_MIGRATION', 'SYSTEM', 'Updated appointments and queue_items status constraints for Kanban Dashboard');
