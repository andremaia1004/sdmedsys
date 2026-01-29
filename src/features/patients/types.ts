export interface Patient {
    id: string;
    name: string;
    document: string; // CPF or RG
    phone: string;
    birthDate: string; // ISO Date YYYY-MM-DD
    createdAt: string;
    updatedAt: string;
}

export type PatientInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;
