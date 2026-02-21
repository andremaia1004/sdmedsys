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

    if (user) {
        const client = await createClient();
        return new SupabaseQueueRepository(client, clinicId);
    }

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
                start_time: null // will be enriched if necessary or accessed from appointments directly
            });
        }
        return enriched;
    }

    static async getTVList(): Promise<Partial<QueueItemWithPatient>[]> {
        const repo = await getRepository();
        return repo.getTVList();
    }

    static async add(item: Omit<QueueItem, 'id' | 'created_at' | 'updated_at' | 'ticket_code'>, actorRole: string): Promise<QueueItem> {
        const repo = await getRepository();

        let prefix = 'A';
        try {
            const { SettingsService } = await import('../admin/settings/service');
            const settings = await SettingsService.get();
            prefix = settings.queuePrefix;
        } catch {
            console.warn('QueueService: Using default prefix A due to settings error');
        }

        return repo.add(item, actorRole, prefix);
    }

    static async changeStatus(id: string, newStatus: QueueStatus, actorRole: string): Promise<QueueItem> {
        const repo = await getRepository();

        // 1. Fetch current item for validation
        const currentItem = await repo.findById(id);
        if (!currentItem) throw new Error('Paciente não encontrado na fila.');

        // 2. State Machine Validation
        const transitions: Record<QueueStatus, QueueStatus[]> = {
            'WAITING': ['CALLED', 'CANCELED', 'NO_SHOW'],
            'CALLED': ['IN_SERVICE', 'NO_SHOW', 'WAITING'],
            'IN_SERVICE': ['DONE'],
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
            if (currentItem.doctor_id && currentItem.doctor_id !== user?.id && user?.role !== 'ADMIN') {
                throw new Error('Apenas o médico designado pode iniciar este atendimento.');
            }
        }

        // 4. Perform Transition
        const item = await repo.changeStatus(id, newStatus, actorRole);

        // 5. Audit the transition
        const { logAudit } = await import('@/lib/audit');
        await logAudit('STATUS_CHANGE', 'QUEUE_ITEM', id, {
            from: currentItem.status,
            to: newStatus,
            patientId: item.patient_id,
            doctorId: item.doctor_id,
            actorRole
        });

        return item;
    }

    static async getOperationalQueue(doctorId?: string): Promise<QueueItemWithPatient[]> {
        const repo = await getRepository();
        const items = await repo.list(doctorId);

        // Filter only WAITING and CALLED for the operational view
        const filtered = items.filter(i => i.status === 'WAITING' || i.status === 'CALLED');

        const enriched: QueueItemWithPatient[] = [];
        const supabase = await createClient();

        for (const item of filtered) {
            const patient = await PatientService.findById(item.patient_id);

            // Enrich with startTime from appointments if available
            let startTime: string | undefined;
            if (item.appointment_id) {
                const { data: app } = await supabase
                    .from('appointments')
                    .select('start_time')
                    .eq('id', item.appointment_id)
                    .single();
                startTime = app?.start_time;
            }

            enriched.push({
                ...item,
                patient_name: patient ? patient.name : 'Unknown',
                start_time: startTime || null
            });
        }

        const now = new Date();

        // Smart Sorting
        return enriched.sort((a, b) => {
            // 1. CALLED status always first
            if (a.status === 'CALLED' && b.status !== 'CALLED') return -1;
            if (a.status !== 'CALLED' && b.status === 'CALLED') return 1;

            // 2. Late Scheduled (status is WAITING at this point)
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
