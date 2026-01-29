import { Patient, PatientInput } from './types';

export interface IPatientsRepository {
    list(query?: string): Promise<Patient[]>;
    findById(id: string): Promise<Patient | undefined>;
    create(input: PatientInput): Promise<Patient>;
    update(id: string, input: PatientInput): Promise<Patient | null>;
}
