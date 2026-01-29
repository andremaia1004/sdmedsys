export interface ClinicSettings {
    id: string;
    clinicId: string;
    clinicName: string;
    workingHours: Record<string, { start: string, end: string } | null>;
    appointmentDurationMinutes: number;
    queuePrefix: string;
    tvRefreshSeconds: number;
    createdAt: string;
    updatedAt: string;
}
