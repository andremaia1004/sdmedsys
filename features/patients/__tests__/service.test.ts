import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PatientService } from '../service';

describe('PatientService', () => {

    it('should list all initial mock patients', async () => {
        const patients = await PatientService.list();
        expect(patients.length).toBeGreaterThan(0);
    });

    it('should search patients by name', async () => {
        const results = await PatientService.list('John');
        expect(results).toHaveLength(1);
        expect(results[0].name).toContain('John');
    });

    it('should create a new patient', async () => {
        const input = {
            name: 'Test Patient',
            document: '00000000000',
            phone: '11999999999',
            birth_date: '2000-01-01',
            email: null,
            address: null,
            guardian_name: null,
            insurance: null,
            main_complaint: null,
            emergency_contact: null
        };
        const newPatient = await PatientService.create(input);
        expect(newPatient.id).toBeDefined();
        expect(newPatient.name).toBe(input.name);

        // Verify it is in the list
        const list = await PatientService.list();
        expect(list).toContainEqual(newPatient);
    });
});
