'use server';

import { AppointmentService } from './service';
import { QueueService } from '../queue/service';
import { AppointmentInput, Appointment, AppointmentStatus } from './types';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { ActionResponse, formatSuccess, formatError } from '@/lib/action-response';

export async function createAppointmentAction(prevState: ActionResponse<Appointment>, formData: FormData): Promise<ActionResponse<Appointment>> {
    try {
        await requireRole(['ADMIN', 'SECRETARY']);

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
            return { success: false, error: 'Campos obrigatórios faltando.' };
        }

        const startTime = `${date}T${time}:00-03:00`;
        const startDate = new Date(startTime);
        const endDate = new Date(startDate.getTime() + duration * 60000);
        const endTime = endDate.toISOString();

        const input: AppointmentInput = {
            patient_id: patientId,
            patient_name: patientName,
            doctor_id: doctorId,
            start_time: startTime,
            end_time: endTime,
            status: 'SCHEDULED',
            notes: notes || null,
        };

        const appointment = await AppointmentService.create(input);

        await logAudit('CREATE', 'APPOINTMENT', appointment.id, {
            patientName: appointment.patient_name,
            doctorId: appointment.doctor_id,
            startTime: appointment.start_time
        });

        revalidatePath('/doctor/agenda');
        revalidatePath('/secretary/agenda');

        // Auto-add to queue if appointment is today
        try {
            const todayLocal = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
            if (date === todayLocal) {
                const user = await import('@/lib/session').then(m => m.getCurrentUser());
                const role = user?.role || 'SECRETARY';

                await QueueService.add({
                    patient_id: appointment.patient_id,
                    doctor_id: appointment.doctor_id,
                    appointment_id: appointment.id,
                    status: 'WAITING',
                    clinic_id: user?.clinicId || '550e8400-e29b-41d4-a716-446655440000'
                }, role);

                revalidatePath('/queue');
                revalidatePath('/tv');
                revalidatePath('/secretary/queue');
                revalidatePath('/doctor/queue');
            }
        } catch (queueErr) {
            console.error('Failed to auto-add to queue:', queueErr);
        }

        return formatSuccess(appointment);
    } catch (err) {
        return formatError(err);
    }
}

export async function updateAppointmentStatusAction(id: string, status: AppointmentStatus): Promise<ActionResponse<Appointment>> {
    try {
        const appointment = await AppointmentService.updateStatus(id, status);

        if (appointment) {
            await logAudit('STATUS_CHANGE', 'APPOINTMENT', id, { status });
        }

        revalidatePath('/doctor/agenda');
        revalidatePath('/secretary/agenda');
        return formatSuccess(appointment ?? undefined);
    } catch (err) {
        return formatError(err);
    }
}

export async function checkConflictAction(doctorId: string, startTime: string, endTime: string): Promise<ActionResponse<boolean>> {
    try {
        const result = await AppointmentService.checkConflict(doctorId, startTime, endTime);
        return formatSuccess(result);
    } catch (err) {
        return formatError(err);
    }
}

import { SupabaseAppointmentsRepository } from './repository.supabase';
import { supabaseServer } from '@/lib/supabase-server';

export async function fetchAppointmentsAction(doctorId?: string, startRange?: string, endRange?: string): Promise<ActionResponse<Appointment[]>> {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
        const repo = new SupabaseAppointmentsRepository(supabaseServer, clinicId);
        const data = await repo.list(doctorId, startRange, endRange);
        return formatSuccess(data);
    } catch (err) {
        return formatError(err);
    }
}
