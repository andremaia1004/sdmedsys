import { QueueItem, QueueStatus, QueueItemWithPatient } from './types';
import { IQueueRepository } from './repository.types';
import { MockQueueRepository } from './repository.mock';
import { SupabaseQueueRepository } from './repository.supabase';
import { PatientService } from '../patients/service';
import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-server';

const getRepository = async (): Promise<IQueueRepository> => {
    const useSupabase = process.env.USE_SUPABASE === 'true';

    if (useSupabase) {
        const user = await getCurrentUser();
        const authMode = process.env.AUTH_MODE || 'stub';
        const defaultClinicId = '550e8400-e29b-41d4-a716-446655440000';
        const clinicId = user?.clinicId || defaultClinicId;

        // Special case for TV: If accessing from TV, we might NOT have a session if it's public.
        // But TV usually uses a PIN and the middleware handles session?
        // Let's assume for now that if they are authenticated or have a PIN cookie, we can use the appropriate client.
        // Actually, TV usually wants Service Role because it's a "display" with limited input.
        // However, RLS Phase 2 policy allows Reading TV list for Anon? 
        // No, requirements say: "Garantir que /tv continue público apenas via middleware PIN e que o endpoint de TV use um caminho server-side que não vaze nomes."

        if (authMode === 'supabase' && user) {
            const client = await createClient();
            return new SupabaseQueueRepository(client, clinicId);
        }

        return new SupabaseQueueRepository(supabaseServer, clinicId);
    }

    return new MockQueueRepository();
};

export class QueueService {
    static async list(doctorId?: string): Promise<QueueItemWithPatient[]> {
        const repo = await getRepository();
        const items = await repo.list(doctorId);

        const enriched: QueueItemWithPatient[] = [];
        for (const item of items) {
            const patient = await PatientService.findById(item.patientId);
            enriched.push({
                ...item,
                patientName: patient ? patient.name : 'Unknown'
            });
        }
        return enriched;
    }

    static async getTVList(): Promise<Partial<QueueItemWithPatient>[]> {
        const repo = await getRepository();
        return repo.getTVList();
    }

    static async add(item: Omit<QueueItem, 'id' | 'createdAt' | 'updatedAt' | 'ticketCode'>, actorRole: string): Promise<QueueItem> {
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
            if (currentItem.doctorId && currentItem.doctorId !== user?.id && user?.role !== 'ADMIN') {
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
            patientId: item.patientId,
            doctorId: item.doctorId,
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
            const patient = await PatientService.findById(item.patientId);

            // Enrich with startTime from appointments if available
            let startTime: string | undefined;
            if (item.appointmentId) {
                const { data: app } = await supabase
                    .from('appointments')
                    .select('start_time')
                    .eq('id', item.appointmentId)
                    .single();
                startTime = app?.start_time;
            }

            enriched.push({
                ...item,
                patientName: patient ? patient.name : 'Unknown',
                startTime
            });
        }

        const now = new Date();

        // Smart Sorting
        return enriched.sort((a, b) => {
            // 1. CALLED status always first
            if (a.status === 'CALLED' && b.status !== 'CALLED') return -1;
            if (a.status !== 'CALLED' && b.status === 'CALLED') return 1;

            // 2. Late Scheduled (status is WAITING at this point)
            const aIsLate = a.sourceType === 'SCHEDULED' && a.startTime && new Date(a.startTime) < now;
            const bIsLate = b.sourceType === 'SCHEDULED' && b.startTime && new Date(b.startTime) < now;

            if (aIsLate && !bIsLate) return -1;
            if (!aIsLate && bIsLate) return 1;

            // 3. Regular Scheduled
            if (a.sourceType === 'SCHEDULED' && b.sourceType !== 'SCHEDULED') return -1;
            if (a.sourceType !== 'SCHEDULED' && b.sourceType === 'SCHEDULED') return 1;

            // 4. Tie-breaker: createdAt ASC
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
    }
}
