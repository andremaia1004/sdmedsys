import { ClinicalEntry, ClinicalEntryInput } from './types';

export interface IClinicalEntryRepository {
    listByPatient(patientId: string): Promise<ClinicalEntry[]>;
    findById(id: string): Promise<ClinicalEntry | null>;
    findByConsultation(consultationId: string): Promise<ClinicalEntry | null>;
    upsert(input: ClinicalEntryInput & { id?: string, clinicId: string }): Promise<ClinicalEntry>;
}
