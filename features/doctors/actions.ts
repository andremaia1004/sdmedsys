'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { requireRole } from '@/lib/session';
import { SupabaseDoctorsRepository } from './repository.supabase';
import { DoctorService } from './service';
import { Doctor } from './types';

export async function getDoctorAction(id: string): Promise<Doctor | undefined> {
    try {
        return await DoctorService.findById(id);
    } catch (e) {
        console.error('getDoctorAction: Failed to fetch doctor', e);
        return undefined;
    }
}

export async function listDoctorsAction(activeOnly: boolean = true): Promise<Doctor[]> {
    console.log('[listDoctorsAction] Started fetching activeOnly:', activeOnly);
    try {
        const user = await requireRole(['ADMIN', 'SECRETARY', 'DOCTOR']);
        console.log('[listDoctorsAction] User role resolved:', user.role, 'clinicId:', user.clinicId);

        // Use Service Role to ensure we can read all doctors for the clinic, avoiding partial RLS visibility
        // Same pattern as fetchDoctorsAction in admin.ts
        const clinicId = user.clinicId || '550e8400-e29b-41d4-a716-446655440000';
        const repo = new SupabaseDoctorsRepository(supabaseServer, clinicId);

        const docs = await repo.list(activeOnly);
        console.log('[listDoctorsAction] Doctors retrieved count:', docs?.length);
        return docs;
    } catch (e) {
        console.error('listDoctorsAction: Failed to list doctors', e);
        return [];
    }
}
