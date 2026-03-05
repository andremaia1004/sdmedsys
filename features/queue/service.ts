import { QueueItem, QueueStatus, QueueItemWithPatient } from './types';
import { IQueueRepository } from './repository.types';
import { SupabaseQueueRepository } from './repository.supabase';
import { PatientService } from '../patients/service';
import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-server';

const getRepository = async (): Promise<IQueueRepository> => {
    const user = await getCurrentUser();
    const defaultClinicId = '550e8400-e29b-41d4-a716-446655440000';
    const clinicId = user?.clinicId || defaultClinicId;

    // Use service role client to bypass SSR client hangs in server actions
    return new SupabaseQueueRepository(supabaseServer, clinicId);
};

export class QueueService {
    static async list(doctorId?: string): Promise<QueueItemWithPatient[]> {
        const repo = await getRepository();
        const items = await repo.list(doctorId);

        const enriched: QueueItemWithPatient[] = [];
        for (const item of items) {
            const patient = await PatientService.findById(item.patient_id);
            enriched.push({
                ...item,
                patient_name: patient ? patient.name : 'Unknown',
                doctor_name: null, // Basic list doesn't join doctors yet, but we satisfy the type
                doctor_specialty: null,
                start_time: null
            });
        }
        return enriched;
    }

    static async getTVList(doctorId?: string): Promise<Partial<QueueItemWithPatient>[]> {
        const repo = await getRepository();
        return repo.getTVList(doctorId);
    }

    static async add(item: Omit<QueueItem, 'id' | 'created_at' | 'updated_at' | 'ticket_code'>, actorRole: string, prefixArg?: string): Promise<QueueItem> {
        const repo = await getRepository();

        let prefix = prefixArg || 'A';
        try {
            const { SettingsService } = await import('../admin/settings/service');
            const settings = await SettingsService.get();
            prefix = settings.queuePrefix;
        } catch {
            console.warn('QueueService: Using default prefix A due to settings error');
        }

        return repo.add(item, actorRole, prefix);
    }

    static async changeStatus(id: string, newStatus: QueueStatus, actorRole: string, actorId?: string): Promise<QueueItem> {
        const repo = await getRepository();

        // 1. Fetch current item for validation
        const currentItem = await repo.findById(id);
        if (!currentItem) throw new Error('Paciente não encontrado na fila.');

        // 2. State Machine Validation
        const transitions: Record<QueueStatus, QueueStatus[]> = {
            'WAITING': ['CALLED', 'CANCELED', 'NO_SHOW'],
            'CALLED': ['IN_SERVICE', 'NO_SHOW', 'WAITING'],
            'IN_SERVICE': ['DONE', 'NO_SHOW', 'CANCELED'],
            'DONE': [],
            'NO_SHOW': ['WAITING'],
            'CANCELED': ['WAITING']
        };

        if (!transitions[currentItem.status]?.includes(newStatus)) {
            throw new Error(`Transição inválida: ${currentItem.status} -> ${newStatus}`);
        }

        // 3. Role/Assignment Validation (Doctor starting consultation)
        if (newStatus === 'IN_SERVICE') {
            const user = await getCurrentUser();
            if (currentItem.doctor_id && user?.role !== 'ADMIN') {
                let isDesignatedDoctor = false;
                if (user?.role === 'DOCTOR') {
                    const { SupabaseDoctorsRepository } = await import('@/features/doctors/repository.supabase');
                    const { supabaseServer } = await import('@/lib/supabase-server');
                    const doctorsRepo = new SupabaseDoctorsRepository(supabaseServer, user.clinicId || '550e8400-e29b-41d4-a716-446655440000');
                    const doctor = await doctorsRepo.findByProfileId(user.id);
                    if (doctor && doctor.id === currentItem.doctor_id) {
                        isDesignatedDoctor = true;
                    }
                }

                if (!isDesignatedDoctor) {
                    throw new Error('Apenas o médico designado pode iniciar este atendimento.');
                }
            }
        }

        // 4. Perform Transition
        const item = await repo.changeStatus(id, newStatus, actorRole);

        // 5. Audit the transition
        const { logAudit } = await import('@/lib/audit');
        await logAudit(
            'STATUS_CHANGE',
            'QUEUE_ITEM',
            id,
            {
                from: currentItem.status,
                to: newStatus,
                patientId: item.patient_id,
                doctorId: item.doctor_id,
                actorRole
            },
            actorId ? { id: actorId, role: actorRole as any, name: 'System', email: '' } : undefined
        );

        return item;
    }

    static async getOperationalQueue(doctorId?: string): Promise<QueueItemWithPatient[]> {
        const repo = await getRepository();
        const items = await repo.list(doctorId);

        // Filter only WAITING, CALLED, and IN_SERVICE for the operational view
        // AND ensure it's from today (to match dashboard)
        const todayStr = new Date().toISOString().split('T')[0];
        const filtered = items.filter(i =>
            (i.status === 'WAITING' || i.status === 'CALLED' || i.status === 'IN_SERVICE') &&
            (i.created_at || '').startsWith(todayStr)
        );

        if (filtered.length === 0) return [];

        // Use supabaseServer instead of createClient to avoid SSR hangs
        const supabase = supabaseServer;

        // 1. Fetch all patients in one query
        const patientIds = Array.from(new Set(filtered.map(i => i.patient_id)));
        const { data: patientsData } = await supabase
            .from('patients')
            .select('id, name')
            .in('id', patientIds);

        const patientMap = new Map(patientsData?.map(p => [p.id, p.name]) || []);

        // 2. Fetch all appointments in one query
        const appIds = filtered.map(i => i.appointment_id).filter(Boolean) as string[];
        const { data: appsData } = await supabase
            .from('appointments')
            .select('id, start_time')
            .in('id', appIds);

        const appMap = new Map(appsData?.map(a => [a.id, a.start_time]) || []);

        // 3. Assemble enriched items
        const enriched: QueueItemWithPatient[] = filtered.map(item => ({
            ...item,
            patient_name: patientMap.get(item.patient_id) || 'Unknown',
            doctor_name: null, // Add if needed later, but satisfies type for now
            doctor_specialty: null,
            start_time: item.appointment_id ? (appMap.get(item.appointment_id) || null) : null
        }));

        const now = new Date();

        // Smart Sorting
        return enriched.sort((a, b) => {
            // 1. CALLED status always first
            if (a.status === 'CALLED' && b.status !== 'CALLED') return -1;
            if (a.status !== 'CALLED' && b.status === 'CALLED') return 1;

            // 2. Priority tickets (PR)
            if (a.priority === 'PRIORITY' && b.priority !== 'PRIORITY') return -1;
            if (a.priority !== 'PRIORITY' && b.priority === 'PRIORITY') return 1;

            // 3. Late Scheduled (status is WAITING at this point)
            const aIsLate = !!a.appointment_id && a.start_time && new Date(a.start_time) < now;
            const bIsLate = !!b.appointment_id && b.start_time && new Date(b.start_time) < now;

            if (aIsLate && !bIsLate) return -1;
            if (!aIsLate && bIsLate) return 1;

            // 3. Regular Scheduled
            if (a.appointment_id && !b.appointment_id) return -1;
            if (!a.appointment_id && b.appointment_id) return 1;

            // 4. Tie-breaker: createdAt ASC
            if (!a.created_at || !b.created_at) return 0;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
    }
}
