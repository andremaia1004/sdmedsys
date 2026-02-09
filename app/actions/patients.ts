'use server';

import { PatientService } from '@/features/patients/service';
import { PatientInput } from '@/features/patients/types';
import { revalidatePath } from 'next/cache';
import { ActionState } from '@/lib/types/server-actions';
import { requireRole } from '@/lib/session';

export async function createPatientAction(prevState: ActionState, formData: FormData) {
    try {
        await requireRole(['ADMIN', 'SECRETARY']);

        const input: PatientInput = {
            name: formData.get('name') as string,
            document: formData.get('document') as string,
            phone: formData.get('phone') as string,
            birthDate: formData.get('birthDate') as string,
        };

        // Basic Validation
        if (!input.name || !input.document || !input.phone) {
            return { error: 'Please fill all required fields' };
        }

        await PatientService.create(input);
        revalidatePath('/secretary/patients');
        revalidatePath('/admin/patients');
        return { success: true };
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return { error: errorMessage };
    }
}

export async function searchPatientsAction(query: string) {
    return await PatientService.list(query);
}
