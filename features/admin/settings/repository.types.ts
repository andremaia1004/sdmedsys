import { ClinicSettings } from './types';

export interface ISettingsRepository {
    get(): Promise<ClinicSettings>;
    update(input: Partial<ClinicSettings>): Promise<ClinicSettings>;
}
