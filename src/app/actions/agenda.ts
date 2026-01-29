'use server';

import { AppointmentService } from '@/features/agenda/service';
import { AppointmentInput } from '@/features/agenda/types';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/session';

export async function createAppointmentAction(prevState: any, formData: FormData) {
    try {
        // Secretary manages agenda. Doctor can't create in this MVP (only view).
        await requireRole(['ADMIN', 'SECRETARY']);

        const doctorId = formData.get('doctorId') as string;
        const patientId = formData.get('patientId') as string;
        const patientName = formData.get('patientName') as string;
        const date = formData.get('date') as string;
        const time = formData.get('time') as string;

        if (!doctorId || !patientId || !date || !time) {
            return { error: 'Missing required fields' };
        }

        const startTime = `${date}T${time}:00`;
        // Assuming 30 min duration for MVP
        const endDate = new Date(new Date(startTime).getTime() + 30 * 60000);
        const endTime = endDate.toISOString().slice(0, 19); // Simple ISO

        const input: AppointmentInput = {
            patientId,
            patientName,
            doctorId,
            startTime,
            endTime,
            status: 'SCHEDULED',
            notes: ''
        };

        await AppointmentService.create(input);
        revalidatePath('/secretary/agenda');
        revalidatePath('/doctor/agenda');
        return { success: true };
    } catch (e: any) {
        return { error: e.message || 'Failed to create appointment' };
    }
}

export async function fetchAppointmentsAction(doctorId: string) {
    // Return all for now, filter logic in service
    return await AppointmentService.list(doctorId);
}
