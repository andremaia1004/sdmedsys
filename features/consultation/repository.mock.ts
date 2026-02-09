import { Consultation, ConsultationInput } from './types';
import { IConsultationRepository } from './repository.types';

const MOCK_CONSULTATIONS: Consultation[] = [];

export class MockConsultationRepository implements IConsultationRepository {
    async start(input: ConsultationInput): Promise<Consultation> {
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
        return newConsultation;
    }

    async getActiveByDoctor(doctorId: string): Promise<Consultation | undefined> {
        return MOCK_CONSULTATIONS.find(c => c.doctorId === doctorId && !c.finishedAt);
    }

    async findById(id: string): Promise<Consultation | undefined> {
        return MOCK_CONSULTATIONS.find(c => c.id === id);
    }

    async updateNotes(id: string, notes: string): Promise<void> {
        const index = MOCK_CONSULTATIONS.findIndex(c => c.id === id);
        if (index !== -1) {
            MOCK_CONSULTATIONS[index].clinicalNotes = notes;
            MOCK_CONSULTATIONS[index].updatedAt = new Date().toISOString();
        }
    }

    async finish(id: string): Promise<void> {
        const index = MOCK_CONSULTATIONS.findIndex(c => c.id === id);
        if (index !== -1) {
            MOCK_CONSULTATIONS[index].finishedAt = new Date().toISOString();
            MOCK_CONSULTATIONS[index].updatedAt = new Date().toISOString();
        }
    }
}
