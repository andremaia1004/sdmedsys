'use server';

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
    try {
        return await DoctorService.list(activeOnly);
    } catch (e) {
        console.error('listDoctorsAction: Failed to list doctors', e);
        return [];
    }
}
