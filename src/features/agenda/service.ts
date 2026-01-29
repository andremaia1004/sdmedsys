import { Appointment, AppointmentInput } from './types';

// Mock Data
let MOCK_APPOINTMENTS: Appointment[] = [];

export class AppointmentService {
    // Overlap Logic: (StartA < EndB) && (EndA > StartB)
    static async checkConflict(doctorId: string, startTime: string, endTime: string): Promise<boolean> {
        await new Promise(resolve => setTimeout(resolve, 100));

        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();

        return MOCK_APPOINTMENTS.some(appt => {
            if (appt.doctorId !== doctorId) return false;
            if (appt.status === 'CANCELED') return false;

            const apptStart = new Date(appt.startTime).getTime();
            const apptEnd = new Date(appt.endTime).getTime();

            return (start < apptEnd) && (end > apptStart);
        });
    }

    static async create(input: AppointmentInput): Promise<Appointment> {
        // Conflict check should be done by caller or here. Let's enforce here.
        const hasConflict = await this.checkConflict(input.doctorId, input.startTime, input.endTime);
        if (hasConflict) {
            throw new Error('Conflict detected: Time slot is not available.');
        }

        const newAppt: Appointment = {
            ...input,
            id: Math.random().toString(36).substring(7),
        };

        MOCK_APPOINTMENTS.push(newAppt);
        return newAppt;
    }

    static async list(doctorId?: string, startRange?: string, endRange?: string): Promise<Appointment[]> {
        await new Promise(resolve => setTimeout(resolve, 300));

        let filtered = MOCK_APPOINTMENTS.filter(a => a.status !== 'CANCELED');

        if (doctorId) {
            filtered = filtered.filter(a => a.doctorId === doctorId);
        }

        if (startRange && endRange) {
            const s = new Date(startRange).getTime();
            const e = new Date(endRange).getTime();
            filtered = filtered.filter(a => {
                const as = new Date(a.startTime).getTime();
                return as >= s && as <= e;
            });
        }

        return filtered;
    }
}
