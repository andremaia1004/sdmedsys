import { Patient, PatientInput } from './types';
import { IPatientsRepository } from './repository.types';

// Mock Data Storage (Variable at module level to persist in memory during dev session)
const MOCK_PATIENTS: Patient[] = [
    {
        id: 'p1',
        name: 'John Doe',
        document: '12345678900',
        phone: '5511999999999',
        birthDate: '1980-01-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'p2',
        name: 'Jane Smith',
        document: '98765432100',
        phone: '5511888888888',
        birthDate: '1990-05-15',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

export class MockPatientsRepository implements IPatientsRepository {
    async list(query?: string): Promise<Patient[]> {
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate latency

        if (!query) return MOCK_PATIENTS;

        const lowerQuery = query.toLowerCase();
        return MOCK_PATIENTS.filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.document.includes(lowerQuery) ||
            p.phone.includes(lowerQuery)
        );
    }

    async findById(id: string): Promise<Patient | undefined> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return MOCK_PATIENTS.find(p => p.id === id);
    }

    async create(input: PatientInput): Promise<Patient> {
        await new Promise(resolve => setTimeout(resolve, 400));

        const newPatient: Patient = {
            ...input,
            id: Math.random().toString(36).substring(7),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        MOCK_PATIENTS.push(newPatient);
        return newPatient;
    }

    async update(id: string, input: PatientInput): Promise<Patient | null> {
        await new Promise(resolve => setTimeout(resolve, 400));

        const index = MOCK_PATIENTS.findIndex(p => p.id === id);
        if (index === -1) return null;

        MOCK_PATIENTS[index] = {
            ...MOCK_PATIENTS[index],
            ...input,
            updatedAt: new Date().toISOString(),
        };

        return MOCK_PATIENTS[index];
    }
}
