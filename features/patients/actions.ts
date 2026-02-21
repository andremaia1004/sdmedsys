'use server';

import { PatientInput, Patient } from './types';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';
import { supabaseServer } from '@/lib/supabase-server';
import { requireRole } from '@/lib/session';
import { SupabasePatientsRepository } from './repository.supabase';
import { ActionResponse, formatSuccess, formatError } from '@/lib/action-response';

export async function createPatientAction(prevState: ActionResponse<Patient>, formData: FormData): Promise<ActionResponse<Patient>> {
    const rawInput: PatientInput = {
        name: formData.get('name') as string,
        document: formData.get('document') as string,
        phone: formData.get('phone') as string || null,
        email: formData.get('email') as string || null,
        address: formData.get('address') as string || null,
        guardian_name: formData.get('guardian_name') as string || null,
        insurance: formData.get('insurance') as string || null,
        main_complaint: formData.get('main_complaint') as string || null,
        emergency_contact: formData.get('emergency_contact') as string || null,
        birth_date: formData.get('birth_date') as string || null,
    };

    if (!rawInput.name || !rawInput.document || !rawInput.birth_date) {
        return { success: false, error: 'Campos obrigatórios faltando (Nome, Documento, Nascimento).' };
    }

    try {
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';

        const repo = new SupabasePatientsRepository(supabaseServer, clinicId);
        const patient = await repo.create(rawInput);

        await logAudit('CREATE', 'PATIENT', patient.id, { name: patient.name });

        revalidatePath('/patients');
        revalidatePath('/secretary/patients');
        revalidatePath('/admin/patients');
        return formatSuccess(patient);
    } catch (err) {
        return formatError(err);
    }
}

export async function updatePatientAction(id: string, input: PatientInput): Promise<ActionResponse<Patient>> {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
        const repo = new SupabasePatientsRepository(supabaseServer, clinicId);

        const patient = await repo.update(id, input);

        if (patient) {
            await logAudit('UPDATE', 'PATIENT', id, { name: patient.name });
        }

        revalidatePath('/patients');
        revalidatePath('/secretary/patients');
        revalidatePath('/admin/patients');
        return formatSuccess(patient ?? undefined);
    } catch (err) {
        return formatError(err);
    }
}

export async function searchPatientsAction(query: string): Promise<ActionResponse<Patient[]>> {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
        const repo = new SupabasePatientsRepository(supabaseServer, clinicId);
        const data = await repo.list(query);
        return formatSuccess(data);
    } catch (err) {
        return formatError(err);
    }
}

export async function fetchPatientsAction(): Promise<ActionResponse<Patient[]>> {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
        const repo = new SupabasePatientsRepository(supabaseServer, clinicId);
        const data = await repo.list();
        return formatSuccess(data);
    } catch (err) {
        return formatError(err);
    }
}
