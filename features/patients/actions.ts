'use server';

import { PatientService } from './service';
import { PatientInput, Patient } from './types';
import { revalidatePath } from 'next/cache';

// Server Actions to ensure mutations happen on the server
// This adds an extra layer of security and allows cache revalidation

export type ActionState = {
    error?: string;
    success?: boolean;
    patient?: Patient;
};

export async function createPatientAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const rawInput = {
        name: formData.get('name') as string,
        document: formData.get('document') as string,
        phone: formData.get('phone') as string,
        birthDate: formData.get('birthDate') as string || '',
    };

    try {
        const patient = await PatientService.create(rawInput);
        revalidatePath('/secretary/patients');
        revalidatePath('/admin/patients');
        return { success: true, patient };
    } catch (err) {
        console.error('Create Patient Error:', err);
        return { error: 'Failed to create patient', success: false };
    }
}

export async function updatePatientAction(id: string, input: PatientInput): Promise<Patient | null> {
    const patient = await PatientService.update(id, input);
    revalidatePath('/secretary/patients');
    revalidatePath('/admin/patients');
    return patient;
}

export async function searchPatientsAction(query: string): Promise<Patient[]> {
    return PatientService.list(query);
}

export async function fetchPatientsAction(): Promise<Patient[]> {
    return PatientService.list();
}
