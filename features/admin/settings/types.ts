export interface ClinicSettings {
    id: string;
    clinicId: string;
    clinicName: string;
    workingHours: Record<string, { start: string, end: string } | null>;
    appointmentDurationMinutes: number;
    queuePrefix: string;
    tvRefreshSeconds: number;
    logoUrl?: string;
    address?: string;
    phone?: string;
    website?: string;
    createdAt: string;
    updatedAt: string;
}

export type ClinicSettingsInput = Omit<ClinicSettings, 'id' | 'clinicId' | 'createdAt' | 'updatedAt'>;
