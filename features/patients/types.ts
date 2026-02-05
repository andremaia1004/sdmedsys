export interface Patient {
    id: string;
    name: string;
    document: string; // CPF or RG
    phone: string;
    email?: string;
    address?: string;
    guardian_name?: string;
    insurance?: string;
    main_complaint?: string;
    emergency_contact?: string;
    birthDate: string; // ISO Date YYYY-MM-DD
    createdAt: string;
    updatedAt: string;
}

export type PatientInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;
