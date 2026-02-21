import { Consultation, ConsultationInput } from './types';

export interface IConsultationRepository {
    start(input: ConsultationInput): Promise<Consultation>;
    getActiveByDoctor(doctorId: string): Promise<Consultation | undefined>;
    findById(id: string): Promise<Consultation | undefined>;
    listByPatient(patientId: string): Promise<Consultation[]>;
    countByPatient(patientId: string): Promise<number>;
    updateStructuredFields(id: string, fields: Partial<Pick<Consultation, 'chief_complaint' | 'diagnosis' | 'conduct'>>): Promise<void>;
    finish(id: string): Promise<void>;
}
