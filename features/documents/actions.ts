'use server';

import { requireRole } from '@/lib/session';
import { ClinicalDocumentsRegistryService } from './service.registry';
import { ClinicalDocument } from './types';

export async function fetchPatientDocumentsAction(patientId: string): Promise<ClinicalDocument[]> {
    try {
        await requireRole(['ADMIN', 'DOCTOR']);
        return await ClinicalDocumentsRegistryService.listByPatient(patientId);
    } catch (error) {
        console.error('fetchPatientDocumentsAction Error:', error);
        return [];
    }
}
