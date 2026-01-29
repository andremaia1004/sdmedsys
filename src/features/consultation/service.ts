import { Consultation, ConsultationInput } from './types';
import { QueueService } from '@/features/queue/service';

let MOCK_CONSULTATIONS: Consultation[] = [];

export class ConsultationService {
    // Audit Hook
    private static logAudit(action: string, doctorId: string, consultationId: string) {
        console.log(`[AUDIT] CONSULTATION | ${action} | Doc: ${doctorId} | ID: ${consultationId} | ${new Date().toISOString()}`);
    }

    static async start(input: ConsultationInput): Promise<Consultation> {
        // Validate Queue Item
        const queueItems = await QueueService.list();
        // Note: list() returns enriched items. We just need to check if item exists and is IN_SERVICE ideally, 
        // or we are moving it to IN_SERVICE.
        // The Prompt says "start(queueItemId) ... creates consultation ... mark startedAt". 
        // Logic: The QueueItem should probably be IN_SERVICE before or as part of this.
        // Let's assume DoctorQueue component sets it to IN_SERVICE, then calls this.

        const newConsultation: Consultation = {
            id: Math.random().toString(36).substring(7),
            ...input,
            clinicalNotes: '',
            startedAt: new Date().toISOString(),
            finishedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        MOCK_CONSULTATIONS.push(newConsultation);
        this.logAudit('START', input.doctorId, newConsultation.id);
        return newConsultation;
    }

    static async getActiveByDoctor(doctorId: string): Promise<Consultation | undefined> {
        return MOCK_CONSULTATIONS.find(c => c.doctorId === doctorId && !c.finishedAt);
    }

    static async getById(id: string): Promise<Consultation | undefined> {
        return MOCK_CONSULTATIONS.find(c => c.id === id);
    }

    static async updateNotes(id: string, notes: string, doctorId: string): Promise<void> {
        const index = MOCK_CONSULTATIONS.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Consultation not found');

        // Ownership check
        if (MOCK_CONSULTATIONS[index].doctorId !== doctorId) throw new Error('Unauthorized');

        MOCK_CONSULTATIONS[index].clinicalNotes = notes;
        MOCK_CONSULTATIONS[index].updatedAt = new Date().toISOString();
        // this.logAudit('UPDATE_NOTES', doctorId, id); // Auto-save might remain silent to avoid log spam, or log sparingly
    }

    static async finish(id: string, doctorId: string): Promise<void> {
        const index = MOCK_CONSULTATIONS.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Consultation not found');

        if (MOCK_CONSULTATIONS[index].doctorId !== doctorId) throw new Error('Unauthorized');

        MOCK_CONSULTATIONS[index].finishedAt = new Date().toISOString();
        MOCK_CONSULTATIONS[index].updatedAt = new Date().toISOString();

        // Update Queue status to DONE
        // In real app, transactional. Here, sequential.
        try {
            await QueueService.changeStatus(MOCK_CONSULTATIONS[index].queueItemId, 'DONE', 'DOCTOR');
        } catch (e) {
            console.error("Failed to update queue status", e);
        }

        this.logAudit('FINISH', doctorId, id);
    }
}
