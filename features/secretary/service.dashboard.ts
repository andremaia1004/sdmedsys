import { createClient } from '@/lib/supabase-auth';
import { Appointment, AppointmentStatus } from '@/features/agenda/types';
import { logAudit } from '@/lib/audit';
import { getCurrentUser } from '@/lib/session';

export interface DashboardItem {
    id: string; // appointment_id
    patient_id: string;
    patient_name: string;
    doctor_id: string;
    doctor_name: string;
    start_time: string | null;
    appointment_status: AppointmentStatus;
    queue_item_id: string | null;
    ticket_code: string | null;
    queue_status: 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'DONE' | 'NO_SHOW' | 'CANCELED' | null;
    doctor_specialty: string | null;
}

export class SecretaryDashboardService {
    static async getDailyDashboard(clinicId: string, date: string): Promise<DashboardItem[]> {
        const supabase = await createClient();
        const startOfDay = `${date}T00:00:00Z`;
        const endOfDay = `${date}T23:59:59Z`;

        const { data, error } = await supabase
            .from('appointments')
            .select(`
                id,
                patient_id,
                patient_name,
                doctor_id,
                doctors ( name, specialty ),
                start_time,
                status,
                queue_items (
                    id,
                    ticket_code,
                    status
                )
            `)
            .eq('clinic_id', clinicId)
            .gte('start_time', startOfDay)
            .lte('start_time', endOfDay)
            .order('start_time', { ascending: true });

        if (error) {
            console.error('DashboardService: Failed to fetch', error);
            return [];
        }

        return (data || []).map(row => ({
            id: row.id,
            patient_id: row.patient_id,
            patient_name: row.patient_name || 'Desconhecido',
            doctor_id: row.doctor_id,
            doctor_name: (row.doctors as any)?.name || 'Médico',
            start_time: row.start_time,
            appointment_status: row.status as AppointmentStatus,
            queue_item_id: row.queue_items?.[0]?.id || null,
            ticket_code: row.queue_items?.[0]?.ticket_code || null,
            queue_status: row.queue_items?.[0]?.status || null,
            doctor_specialty: (row.doctors as any)?.specialty || null,
        }));
    }

    static async markArrived(appointmentId: string, priority: 'NORMAL' | 'PRIORITY' = 'NORMAL'): Promise<boolean> {
        const user = await getCurrentUser();
        if (!user || !user.clinicId) return false;

        const supabase = await createClient();

        // 1. Fetch appointment details
        const { data: appointment, error: fetchError } = await supabase
            .from('appointments')
            .select('patient_id, patient_name, doctor_id')
            .eq('id', appointmentId)
            .single();

        if (fetchError || !appointment) return false;

        const { error: updateError } = await supabase
            .from('appointments')
            .update({ status: 'ARRIVED' })
            .eq('id', appointmentId);

        if (updateError) return false;

        // Use standard QueueService to generate ticket correctly
        const prefix = priority === 'PRIORITY' ? 'P' : 'A';
        const { QueueService } = await import('@/features/queue/service');

        await QueueService.add({
            clinic_id: user.clinicId,
            appointment_id: appointmentId,
            patient_id: appointment.patient_id,
            doctor_id: appointment.doctor_id,
            status: 'WAITING',
            priority: priority
        }, user.role, prefix);

        await logAudit('CHECK_IN', 'APPOINTMENT', appointmentId, { kind: 'APPOINTMENT', patientId: appointment.patient_id });

        return true;
    }

    static async updateQueueStatus(appointmentId: string, queueItemId: string, newStatus: string): Promise<boolean> {
        const supabase = await createClient();

        // Update queue item
        const { error: qError } = await supabase
            .from('queue_items')
            .update({ status: newStatus })
            .eq('id', queueItemId);

        if (qError) return false;

        // If DONE or NO_SHOW, update appointment as well
        if (newStatus === 'DONE') {
            await supabase.from('appointments').update({ status: 'COMPLETED' }).eq('id', appointmentId);
        } else if (newStatus === 'NO_SHOW') {
            await supabase.from('appointments').update({ status: 'NO_SHOW' }).eq('id', appointmentId);
        }

        await logAudit('STATUS_CHANGE', 'QUEUE_ITEM', queueItemId, { newStatus });

        return true;
    }

    static async markNoShow(appointmentId: string): Promise<boolean> {
        const supabase = await createClient();
        const { error } = await supabase
            .from('appointments')
            .update({ status: 'NO_SHOW' })
            .eq('id', appointmentId);

        await logAudit('NO_SHOW', 'APPOINTMENT', appointmentId, {});
        return !error;
    }

    static async createWalkIn(patientId: string, doctorId: string, priority: 'NORMAL' | 'PRIORITY' = 'NORMAL', notes?: string): Promise<boolean> {
        const user = await getCurrentUser();
        console.log('DEBUG: createWalkIn - user:', user?.id, 'role:', user?.role, 'clinicId:', user?.clinicId);
        if (!user || !user.clinicId) {
            console.error('CreateWalkIn failed: No user or clinicId');
            throw new Error('Usuário não autenticado ou sem clínica associada.');
        }

        const supabase = await createClient();

        // 1.5 Fetch Patient Name
        const { data: patientData } = await supabase
            .from('patients')
            .select('name')
            .eq('id', patientId)
            .single();
        const patientName = patientData?.name || 'Desconhecido';

        // 2. Create WALK_IN Appointment
        const now = new Date();
        const endTime = new Date(now.getTime() + 30 * 60000); // 30 minutes later

        const { data: appointment, error: appError } = await supabase
            .from('appointments')
            .insert([{
                clinic_id: user.clinicId,
                patient_id: patientId,
                patient_name: patientName,
                doctor_id: doctorId,
                start_time: now.toISOString(),
                end_time: endTime.toISOString(),
                status: 'ARRIVED',
                notes: notes
            }])
            .select()
            .single();

        if (appError) {
            console.error('DashboardService: Create WALK_IN error', appError);
            throw new Error(`Erro ao criar agendamento: ${appError.message}`);
        }

        // Use standard QueueService to generate ticket correctly
        const prefix = priority === 'PRIORITY' ? 'P' : 'A';
        const { QueueService } = await import('@/features/queue/service');

        await QueueService.add({
            clinic_id: user.clinicId,
            appointment_id: appointment.id,
            patient_id: patientId,
            doctor_id: doctorId,
            status: 'WAITING',
            priority: priority
        }, user.role, prefix);

        await logAudit('CHECK_IN', 'APPOINTMENT', appointment.id, { kind: 'WALK_IN' });
        return true;
    }
}
