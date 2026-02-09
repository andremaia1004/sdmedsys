'use server';

import { AppointmentService } from './service';
import { QueueService } from '../queue/service';
import { AppointmentInput, Appointment, AppointmentStatus } from './types';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export type ActionState = {
    error?: string;
    success?: boolean;
    appointment?: Appointment;
};

export async function createAppointmentAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        // Enforce RBAC
        await requireRole(['ADMIN', 'SECRETARY']);

        // Fetch duration from settings
        let duration = 30;
        try {
            const { fetchSettingsAction } = await import('@/app/actions/admin');
            const settings = await fetchSettingsAction();
            duration = settings.appointmentDurationMinutes;
        } catch {
            console.warn('createAppointmentAction: Using default duration 30 due to settings error');
        }

        const date = formData.get('date') as string;
        const time = formData.get('time') as string;
        const doctorId = formData.get('doctorId') as string;
        const patientId = formData.get('patientId') as string;
        const patientName = formData.get('patientName') as string;
        const notes = formData.get('notes') as string;

        if (!date || !time || !doctorId || !patientId) {
            return { error: 'Missing required fields', success: false };
        }

        // Explicitly set as BRT (-03:00) to ensure database stores the intended local time
        const startTime = `${date}T${time}:00-03:00`;
        const startDate = new Date(startTime);
        const endDate = new Date(startDate.getTime() + duration * 60000);

        // Convert to ISO-like format but keeping it relative to database precision
        // Use toISOString() which adds Z, or manually format to avoid shifts if needed.
        // Actually, toISOString() is fine if we include the offset in the input.
        const endTime = endDate.toISOString();

        const input: AppointmentInput = {
            patientId,
            patientName,
            doctorId,
            startTime,
            endTime,
            status: 'SCHEDULED',
            notes: notes || undefined,
        };

        const appointment = await AppointmentService.create(input);

        await logAudit('CREATE', 'APPOINTMENT', appointment.id, {
            patientName: appointment.patientName,
            doctorId: appointment.doctorId,
            startTime: appointment.startTime
        });

        revalidatePath('/doctor/agenda');
        revalidatePath('/secretary/agenda');

        // Logic to auto-add to queue if appointment is today
        try {
            // Get today's date in Brazil time for accurate auto-queue logic
            const todayLocal = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

            console.log('[createAppointmentAction] Comparing date:', date, 'with todayLocal:', todayLocal);

            if (date === todayLocal) {
                console.log('[createAppointmentAction] Auto-adding to queue for today...');
                const user = await import('@/lib/session').then(m => m.getCurrentUser());
                const role = user?.role || 'SECRETARY';

                await QueueService.add({
                    patientId: appointment.patientId,
                    doctorId: appointment.doctorId,
                    appointmentId: appointment.id,
                    status: 'WAITING'
                }, role);

                revalidatePath('/queue');
                revalidatePath('/tv');
                revalidatePath('/secretary/queue');
                revalidatePath('/doctor/queue');
            }
        } catch (queueErr) {
            console.error('Failed to auto-add to queue:', queueErr);
        }

        return { success: true, appointment };
    } catch (err: unknown) {
        console.error('Create Appointment Error:', err);
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return { error: msg, success: false };
    }
}

export async function updateAppointmentStatusAction(id: string, status: AppointmentStatus): Promise<Appointment | null> {
    try {
        const appointment = await AppointmentService.updateStatus(id, status);

        if (appointment) {
            await logAudit('STATUS_CHANGE', 'APPOINTMENT', id, { status });
        }

        revalidatePath('/doctor/agenda');
        revalidatePath('/secretary/agenda');
        return appointment;
    } catch (err) {
        console.error('Update Status Error:', err);
        return null;
    }
}

export async function checkConflictAction(doctorId: string, startTime: string, endTime: string): Promise<boolean> {
    return AppointmentService.checkConflict(doctorId, startTime, endTime);
}

import { SupabaseAppointmentsRepository } from './repository.supabase';
import { supabaseServer } from '@/lib/supabase-server';

export async function fetchAppointmentsAction(doctorId?: string, startRange?: string, endRange?: string): Promise<Appointment[]> {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
        const repo = new SupabaseAppointmentsRepository(supabaseServer, clinicId);
        return await repo.list(doctorId, startRange, endRange);
    } catch (e) {
        console.error('fetchAppointmentsAction: Failed to fetch appointments', e);
        return [];
    }
}
