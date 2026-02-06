'use server';

import { PatientInput, Patient } from './types';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';
import { supabaseServer } from '@/lib/supabase-server';
import { requireRole } from '@/lib/session';
import { SupabasePatientsRepository } from './repository.supabase';

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
        console.log('[createPatientAction] Starting creation for:', rawInput.name);
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
        console.log('[createPatientAction] User:', user.id, 'Clinic:', clinicId);

        const repo = new SupabasePatientsRepository(supabaseServer, clinicId);

        const patient = await repo.create(rawInput);
        console.log('[createPatientAction] Success:', patient.id);

        await logAudit('CREATE', 'PATIENT', patient.id, { name: patient.name });

        revalidatePath('/secretary/patients');
        revalidatePath('/admin/patients');
        return { success: true, patient };
    } catch (err: any) {
        console.error('Create Patient Error (Full):', err);
        return { error: `Falha ao criar paciente: ${err.message}`, success: false };
    }
}

export async function updatePatientAction(id: string, input: PatientInput): Promise<Patient | null> {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
        const repo = new SupabasePatientsRepository(supabaseServer, clinicId);

        const patient = await repo.update(id, input);

        if (patient) {
            await logAudit('UPDATE', 'PATIENT', id, { name: patient.name });
        }

        revalidatePath('/secretary/patients');
        revalidatePath('/admin/patients');
        return patient;
    } catch (err) {
        console.error('Update Patient Error:', err);
        return null;
    }
}

export async function searchPatientsAction(query: string): Promise<Patient[]> {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
        const repo = new SupabasePatientsRepository(supabaseServer, clinicId);
        return await repo.list(query);
    } catch (err) {
        console.error('Search Patient Error:', err);
        return [];
    }
}

export async function fetchPatientsAction(): Promise<Patient[]> {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
        const repo = new SupabasePatientsRepository(supabaseServer, clinicId);
        return await repo.list();
    } catch (err) {
        console.error('Fetch Patient Error:', err);
        return [];
    }
}
