import { Doctor, DoctorInput } from './types';

export interface IDoctorsRepository {
    list(activeOnly?: boolean): Promise<Doctor[]>;
    findById(id: string): Promise<Doctor | undefined>;
    create(input: DoctorInput): Promise<Doctor>;
    update(id: string, input: Partial<Doctor>): Promise<Doctor | null>;
}
