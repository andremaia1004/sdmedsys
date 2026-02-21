'use server';

import { requireRole } from '@/lib/session';
import { CrmService } from './service';
import { CrmCard, CrmStage } from './types';
import { revalidatePath } from 'next/cache';
import { ActionResponse, formatSuccess, formatError } from '@/lib/action-response';

export async function fetchCrmBoardAction(): Promise<ActionResponse<CrmCard[]>> {
    try {
        await requireRole(['SECRETARY', 'ADMIN', 'DOCTOR']);
        const data = await CrmService.getBoard();
        return formatSuccess(data);
    } catch (error) {
        return formatError(error);
    }
}

export async function moveCrmCardAction(id: string, stage: CrmStage, position: number): Promise<ActionResponse<void>> {
    try {
        await requireRole(['SECRETARY', 'ADMIN']);
        await CrmService.moveCard(id, stage, position);
        revalidatePath('/secretary/crm');
        return formatSuccess(undefined);
    } catch (error) {
        return formatError(error);
    }
}

export async function updateCrmPositionsAction(updates: { id: string; position: number }[]): Promise<ActionResponse<void>> {
    try {
        await requireRole(['SECRETARY', 'ADMIN']);
        await CrmService.updatePositions(updates);
        revalidatePath('/secretary/crm');
        return formatSuccess(undefined);
    } catch (error) {
        return formatError(error);
    }
}

export async function updateCrmNotesAction(id: string, notes: string): Promise<ActionResponse<void>> {
    try {
        await requireRole(['SECRETARY', 'ADMIN', 'DOCTOR']);
        await CrmService.updateNotes(id, notes);
        revalidatePath('/secretary/crm');
        return formatSuccess(undefined);
    } catch (error) {
        return formatError(error);
    }
}

export async function addPatientToCrmAction(patientId: string, stage: CrmStage, doctorId?: string | null): Promise<ActionResponse<void>> {
    try {
        await requireRole(['SECRETARY', 'ADMIN', 'DOCTOR']);
        await CrmService.upsertPatient(patientId, stage, doctorId);
        revalidatePath('/secretary/crm');
        return formatSuccess(undefined);
    } catch (error) {
        return formatError(error);
    }
}
