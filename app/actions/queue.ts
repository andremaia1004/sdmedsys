'use server';

import { QueueService } from '@/features/queue/service';
import { QueueStatus } from '@/features/queue/types';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/session';
import { logAudit } from '@/lib/audit';

// Mock extracting role from session/cookie
// In real app, we would parse the cookie here
// const getMockRole = () => 'SECRETARY'; // Removed as per instruction

export async function addToQueueAction(formData: FormData) {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY']);

        const patientName = formData.get('patientName') as string;
        // const document = formData.get('document') as string; // Optional: use document to find? // Removed as per instruction
        const doctorId = formData.get('doctorId') as string;

        // Simplification for MVP: We need a patient ID. 
        // If we have a name, we should find or create.
        // For now, let's assume the form sends a patient ID directly if we use a selector,
        // OR just pick the first patient that matches the name/doc.
        // Let's use a "Find or Create" stub logic using PatientService? 
        // Or purely for the "Manual Add" panel, just "p1" (John Doe) if input invalid?
        // Proper way: The UI should have a patient selector.
        // Let's defer UI update to next step. Here, we'll try to find by name.

        // Getting Patient Service dynamically to avoid circular deps if any (server action safe)
        const { PatientService } = await import('@/features/patients/service');
        const patients = await PatientService.list(patientName);
        let patientId = patients[0]?.id;

        if (!patientId) {
            // Fallback: Create a temp patient? Or Error?
            // Let's create one for smooth MVP flow
            const newP = await PatientService.create({ name: patientName, document: 'TEMP', phone: '000', birthDate: '' });
            patientId = newP.id;
        }

        const item = await QueueService.add({
            patientId,
            doctorId,
            status: 'WAITING'
        }, user.role);

        await logAudit('CREATE', 'QUEUE', item.id, { patientId, doctorId });

        revalidatePath('/secretary/queue');
        revalidatePath('/doctor/queue');
        revalidatePath('/tv'); // Update TV
    } catch (e) {
        console.error(e);
        // Silent fail or todo: return error state type
    }
}

export async function changeQueueStatusAction(id: string, newStatus: QueueStatus) {
    // Role would come from session
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);

        // Ownership Check could be here, but Service handles business logic valid transitions.
        // Doctor only should touch their own queue? 
        // For MVP, we pass the Actor Role to service to log audit.

        await QueueService.changeStatus(id, newStatus, user.role);

        await logAudit('STATUS_CHANGE', 'QUEUE', id, { newStatus });

        revalidatePath('/secretary/queue');
        revalidatePath('/doctor/queue');
        revalidatePath('/tv');
        return { success: true };
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return { error: errorMessage };
    }
}

import { SupabaseQueueRepository } from '@/features/queue/repository.supabase';
import { supabaseServer } from '@/lib/supabase-server';
import { QueueItem, QueueItemWithPatient } from '@/features/queue/types';

export async function fetchQueueAction(doctorId?: string): Promise<QueueItemWithPatient[]> {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        // const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
        // const repo = new SupabaseQueueRepository(supabaseServer, clinicId);
        return await QueueService.list(doctorId);
    } catch (e) {
        console.error('fetchQueueAction Error:', e);
        return [];
    }
}

export async function fetchTVQueueAction(): Promise<QueueItemWithPatient[]> {
    try {
        // TV is public, use default clinic or extract from config?
        // For now using default clinic
        const clinicId = '550e8400-e29b-41d4-a716-446655440000';
        const repo = new SupabaseQueueRepository(supabaseServer, clinicId);
        return await repo.getTVList();
    } catch (e) {
        console.error('fetchTVQueueAction Error:', e);
        return [];
    }
}
