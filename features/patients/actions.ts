'use server';

import { PatientService } from './service';
import { PatientInput, Patient } from './types';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';

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
        email: formData.get('email') as string || undefined,
        address: formData.get('address') as string || undefined,
        guardian_name: formData.get('guardian_name') as string || undefined,
        insurance: formData.get('insurance') as string || undefined,
        main_complaint: formData.get('main_complaint') as string || undefined,
        emergency_contact: formData.get('emergency_contact') as string || undefined,
        birthDate: formData.get('birthDate') as string || '',
    };

    // Server-side validation
    if (!rawInput.name || !rawInput.document || !rawInput.phone || !rawInput.birthDate) {
        console.error('Create Patient Error: Missing required fields', rawInput);
        return { error: 'Campos obrigatórios faltando (Nome, Documento, Telefone, Nascimento).', success: false };
    }

    try {
        const patient = await PatientService.create(rawInput);

        await logAudit('CREATE', 'PATIENT', patient.id, { name: patient.name });

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

    if (patient) {
        await logAudit('UPDATE', 'PATIENT', id, { name: patient.name });
    }

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
