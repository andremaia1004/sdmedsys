export interface Patient {
    id: string;
    clinic_id: string;
    name: string;
    document: string; // CPF or RG
    phone: string | null;
    email: string | null;
    address: string | null;
    guardian_name: string | null;
    insurance: string | null;
    main_complaint: string | null;
    emergency_contact: string | null;
    birth_date: string | null; // ISO Date YYYY-MM-DD
    created_at: string | null;
    updated_at: string | null;
}

export type PatientInput = Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'clinic_id'>;
