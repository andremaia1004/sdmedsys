import { Consultation, ConsultationInput } from './types';
import { IConsultationRepository } from './repository.types';

const MOCK_CONSULTATIONS: Consultation[] = [];

export class MockConsultationRepository implements IConsultationRepository {
    async start(input: ConsultationInput): Promise<Consultation> {
        const newConsultation: Consultation = {
            id: Math.random().toString(36).substring(7),
            clinic_id: 'mock-clinic',
            ...input,
            chief_complaint: '',
            diagnosis: '',
            conduct: '',
            started_at: new Date().toISOString(),
            finished_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        MOCK_CONSULTATIONS.push(newConsultation);
        return newConsultation;
    }

    async getActiveByDoctor(doctorId: string): Promise<Consultation | undefined> {
        return MOCK_CONSULTATIONS.find(c => c.doctor_id === doctorId && !c.finished_at);
    }

    async findById(id: string): Promise<Consultation | undefined> {
        return MOCK_CONSULTATIONS.find(c => c.id === id);
    }

    async listByPatient(patientId: string): Promise<Consultation[]> {
        return MOCK_CONSULTATIONS.filter(c => c.patient_id === patientId);
    }

    async countByPatient(patientId: string): Promise<number> {
        return MOCK_CONSULTATIONS.filter(c => c.patient_id === patientId).length;
    }

    async updateStructuredFields(id: string, fields: Partial<Pick<Consultation, 'chief_complaint' | 'diagnosis' | 'conduct'>>): Promise<void> {
        const index = MOCK_CONSULTATIONS.findIndex(c => c.id === id);
        if (index !== -1) {
            MOCK_CONSULTATIONS[index] = {
                ...MOCK_CONSULTATIONS[index],
                ...fields,
                updated_at: new Date().toISOString()
            };
        }
    }

    async finish(id: string): Promise<void> {
        const index = MOCK_CONSULTATIONS.findIndex(c => c.id === id);
        if (index !== -1) {
            MOCK_CONSULTATIONS[index].finished_at = new Date().toISOString();
            MOCK_CONSULTATIONS[index].updated_at = new Date().toISOString();
        }
    }
}
