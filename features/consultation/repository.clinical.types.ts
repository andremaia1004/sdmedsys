import { ClinicalEntry, ClinicalEntryInput } from './types';

export interface IClinicalEntryRepository {
    listByPatient(patientId: string, options?: { limit?: number; offset?: number; startDate?: string; endDate?: string; doctorId?: string; }): Promise<{ data: ClinicalEntry[]; total: number; hasMore: boolean }>;
    findById(id: string): Promise<ClinicalEntry | null>;
    findByConsultation(consultationId: string): Promise<ClinicalEntry | null>;
    upsert(input: ClinicalEntryInput & { id?: string, clinicId: string }): Promise<ClinicalEntry>;
}
