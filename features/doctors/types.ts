export interface Doctor {
    id: string;
    profileId?: string;
    name: string;
    specialty?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export type DoctorInput = Omit<Doctor, 'id' | 'createdAt' | 'updatedAt' | 'active'>;
