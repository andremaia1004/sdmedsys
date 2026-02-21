'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { requireRole } from '@/lib/session';
import { SupabaseDoctorsRepository } from './repository.supabase';
import { DoctorService } from './service';
import { Doctor } from './types';
import { ActionResponse, formatSuccess, formatError } from '@/lib/action-response';

export async function getDoctorAction(id: string): Promise<ActionResponse<Doctor>> {
    try {
        const data = await DoctorService.findById(id);
        return formatSuccess(data ?? undefined);
    } catch (error) {
        return formatError(error);
    }
}

export async function listDoctorsAction(activeOnly: boolean = true): Promise<ActionResponse<Doctor[]>> {
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
        const repo = new SupabaseDoctorsRepository(supabaseServer, clinicId);
        const data = await repo.list(activeOnly);
        return formatSuccess(data);
    } catch (error) {
        return formatError(error);
    }
}
