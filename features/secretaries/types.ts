export interface Secretary {
    id: string;
    profileId?: string;
    clinicId: string;
    name: string;
    phone?: string;
    email?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SecretaryInput {
    name: string;
    phone?: string;
    email?: string;
    profileId?: string;
    active?: boolean;
}
