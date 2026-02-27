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
            email: (formData.get('email') as string) || null,
            address: (formData.get('address') as string) || null,
            insurance: (formData.get('insurance') as string) || null,
            guardian_name: (formData.get('guardian_name') as string) || null,
            main_complaint: (formData.get('main_complaint') as string) || null,
            emergency_contact: (formData.get('emergency_contact') as string) || null,
            birth_date: formData.get('birthDate') as string,
            doctor_id: (formData.get('doctor_id') as string) || null,
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
