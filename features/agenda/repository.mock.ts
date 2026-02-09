import { Appointment, AppointmentInput, AppointmentStatus } from './types';
import { IAppointmentsRepository } from './repository.types';

const MOCK_APPOINTMENTS: Appointment[] = [];

export class MockAppointmentsRepository implements IAppointmentsRepository {
    async checkConflict(doctorId: string, startTime: string, endTime: string): Promise<boolean> {
        await new Promise(resolve => setTimeout(resolve, 100));

        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();

        return MOCK_APPOINTMENTS.some(appt => {
            if (appt.doctorId !== doctorId) return false;
            if (appt.status === 'CANCELED') return false;
            if (!appt.startTime || !appt.endTime) return false;

            const apptStart = new Date(appt.startTime).getTime();
            const apptEnd = new Date(appt.endTime).getTime();

            return (start < apptEnd) && (end > apptStart);
        });
    }

    async create(input: AppointmentInput): Promise<Appointment> {
        // Validation logic is cleaner in service, but checkConflict is reused
        const newAppt: Appointment = {
            ...input,
            kind: input.kind || 'SCHEDULED',
            id: Math.random().toString(36).substring(7),
        };

        MOCK_APPOINTMENTS.push(newAppt);
        return newAppt;
    }

    async list(doctorId?: string, startRange?: string, endRange?: string): Promise<Appointment[]> {
        await new Promise(resolve => setTimeout(resolve, 300));

        let filtered = MOCK_APPOINTMENTS.filter(a => a.status !== 'CANCELED');

        if (doctorId) {
            filtered = filtered.filter(a => a.doctorId === doctorId);
        }

        if (startRange && endRange) {
            const s = new Date(startRange).getTime();
            const e = new Date(endRange).getTime();
            filtered = filtered.filter(a => {
                if (!a.startTime) return false;
                const as = new Date(a.startTime).getTime();
                return as >= s && as <= e;
            });
        }

        return filtered;
    }

    async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment | null> {
        await new Promise(resolve => setTimeout(resolve, 200));
        const index = MOCK_APPOINTMENTS.findIndex(a => a.id === id);
        if (index === -1) return null;

        MOCK_APPOINTMENTS[index].status = status;
        return MOCK_APPOINTMENTS[index];
    }
}
