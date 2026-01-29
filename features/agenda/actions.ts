'use server';

import { AppointmentService } from './service';
import { AppointmentInput, Appointment, AppointmentStatus } from './types';
import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/session';

export type ActionState = {
    error?: string;
    success?: boolean;
    appointment?: Appointment;
};

export async function createAppointmentAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        // Enforce RBAC
        await requireRole(['ADMIN', 'SECRETARY']);

        const date = formData.get('date') as string;
        const time = formData.get('time') as string;
        const doctorId = formData.get('doctorId') as string;
        const patientId = formData.get('patientId') as string;
        const patientName = formData.get('patientName') as string;
        const notes = formData.get('notes') as string;

        if (!date || !time || !doctorId || !patientId) {
            return { error: 'Missing required fields', success: false };
        }

        const startTime = `${date}T${time}:00`;
        // Default 30 min duration for MVP
        const endDate = new Date(new Date(startTime).getTime() + 30 * 60000);
        const endTime = endDate.toISOString().slice(0, 19); // Simple ISO without ms causing issues

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
        revalidatePath('/doctor/agenda');
        revalidatePath('/secretary/agenda');
        return { success: true, appointment };
    } catch (err: any) {
        console.error('Create Appointment Error:', err);
        return { error: err.message || 'Failed to create appointment', success: false };
    }
}

export async function updateAppointmentStatusAction(id: string, status: AppointmentStatus): Promise<Appointment | null> {
    try {
        const appointment = await AppointmentService.updateStatus(id, status);
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

export async function fetchAppointmentsAction(doctorId?: string, startRange?: string, endRange?: string): Promise<Appointment[]> {
    return AppointmentService.list(doctorId, startRange, endRange);
}
