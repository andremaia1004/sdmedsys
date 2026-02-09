import { ClinicSettings } from './types';
import { ISettingsRepository } from './repository.types';

export class MockSettingsRepository implements ISettingsRepository {
    private settings: ClinicSettings = {
        id: 'mock-settings',
        clinicId: '550e8400-e29b-41d4-a716-446655440000',
        clinicName: 'SDMED SYS (Mock)',
        workingHours: {},
        appointmentDurationMinutes: 30,
        queuePrefix: 'M',
        tvRefreshSeconds: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    async get(): Promise<ClinicSettings | null> {
        return this.settings;
    }

    async update(settings: Partial<ClinicSettings>): Promise<ClinicSettings> {
        this.settings = { ...this.settings, ...settings, updatedAt: new Date().toISOString() };
        return this.settings;
    }
}
