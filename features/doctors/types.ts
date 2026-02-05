export interface Doctor {
    id: string;
    profileId?: string;
    name: string;
    specialty?: string;
    crm?: string;
    phone?: string;
    email?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export type DoctorInput = Omit<Doctor, 'id' | 'createdAt' | 'updatedAt' | 'active'>;
