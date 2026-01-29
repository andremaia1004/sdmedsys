import { Consultation, ConsultationInput } from './types';

export interface IConsultationRepository {
    start(input: ConsultationInput): Promise<Consultation>;
    getActiveByDoctor(doctorId: string): Promise<Consultation | undefined>;
    findById(id: string): Promise<Consultation | undefined>;
    updateNotes(id: string, notes: string): Promise<void>;
    finish(id: string): Promise<void>;
}
