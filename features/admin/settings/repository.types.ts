import { ClinicSettings } from './types';

export interface ISettingsRepository {
    get(): Promise<ClinicSettings | null>;
    update(input: Partial<ClinicSettings>): Promise<ClinicSettings>;
}
