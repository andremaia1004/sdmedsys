import { SupabaseClient } from '@supabase/supabase-js';
import { QueueItem, QueueItemWithPatient, QueueStatus } from './types';
import { IQueueRepository } from './repository.types';

export class SupabaseQueueRepository implements IQueueRepository {
    constructor(
        private supabase: SupabaseClient,
        private clinicId: string
    ) { }

    async list(doctorId?: string): Promise<QueueItem[]> {
        let query = this.supabase
            .from('queue_items')
            .select('*')
            .eq('clinic_id', this.clinicId)
            .not('status', 'eq', 'DONE')
            .not('status', 'eq', 'CANCELED')
            .order('created_at', { ascending: true });
        if (doctorId) {
            query = query.eq('doctor_id', doctorId);
        }

        const { data, error } = await query;

        console.log(`DEBUG: QueueRepository.list - clinicId: ${this.clinicId}, doctorId: ${doctorId}, results: ${data?.length || 0}`);

        if (error) {
            console.error('Supabase Error (list queue):', error);
            throw new Error('Failed to list queue items');
        }

        return data.map(this.mapToQueueItem);
    }

    async getTVList(doctorId?: string): Promise<QueueItemWithPatient[]> {
        // First Query: Get Queue Items + Patients
        let query = this.supabase
            .from('queue_items')
            .select(`
                id, 
                ticket_code, 
                status, 
                doctor_id, 
                patient_id, 
                created_at, 
                updated_at, 
                priority,
                appointment_id,
                patients(name)
            `)
            .eq('clinic_id', this.clinicId)
            .in('status', ['WAITING', 'CALLED', 'IN_SERVICE'])
            .gte('created_at', new Date().toISOString().split('T')[0]); // Today only

        if (doctorId) {
            query = query.eq('doctor_id', doctorId);
        }

        const { data, error } = await query
            .order('priority', { ascending: false })
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Supabase Error (TV list):', error);
            return [];
        }

        if (!data || data.length === 0) return [];

        // Second Query: Manually fetch doctor names based on the doctor_ids from the first query
        const doctorIds = Array.from(new Set(data.map(item => item.doctor_id).filter(Boolean)));
        let doctorMap = new Map<string, { name: string, specialty: string | null }>();

        if (doctorIds.length > 0) {
            const { data: doctorsData, error: doctorsError } = await this.supabase
                .from('doctors')
                .select('id, name, specialty')
                .in('id', doctorIds);

            if (!doctorsError && doctorsData) {
                doctorMap = new Map(doctorsData.map(doc => [doc.id, { name: doc.name, specialty: doc.specialty }]));
            } else {
                console.error('Supabase Error (fetching doctors for TV list):', doctorsError);
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = data.map((row: any) => {
            const doctorInfo = row.doctor_id ? doctorMap.get(row.doctor_id) : null;
            return {
                id: row.id,
                clinic_id: row.clinic_id || this.clinicId,
                ticket_code: row.ticket_code,
                status: row.status,
                doctor_id: row.doctor_id,
                patient_id: row.patient_id,
                appointment_id: row.appointment_id || null,
                patient_name: row.patients?.name || '---',
                doctor_name: doctorInfo?.name || null,
                doctor_specialty: doctorInfo?.specialty || null,
                priority: row.priority || 'NORMAL',
                start_time: null,
                created_at: row.created_at,
                updated_at: row.updated_at
            };
        });

        return items;
    }

    async add(item: Omit<QueueItem, 'id' | 'created_at' | 'updated_at' | 'ticket_code'>, actorRole: string, prefix: string = 'A'): Promise<QueueItem> {
        const { data: newId, error: rpcError } = await this.supabase.rpc('generate_queue_ticket', {
            p_clinic_id: this.clinicId,
            p_patient_id: item.patient_id,
            p_doctor_id: item.doctor_id,
            p_appointment_id: item.appointment_id,
            p_status: item.status,
            p_prefix: prefix,
            p_priority: item.priority || 'NORMAL'
        });

        if (rpcError) {
            console.error('Supabase RPC Error (add queue):', rpcError);
            throw new Error('Failed to add queue item: ' + rpcError.message);
        }

        // Fetch the newly created record to return the full QueueItem
        const { data, error } = await this.supabase
            .from('queue_items')
            .select('*')
            .eq('id', newId)
            .single();

        if (error) {
            console.error('Supabase Error (fetch new queue item):', error);
            throw new Error('Failed to retrieve newly created queue item');
        }

        return this.mapToQueueItem(data);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async changeStatus(id: string, newStatus: QueueStatus, _actorRole: string): Promise<QueueItem> {
        const { data, error } = await this.supabase
            .from('queue_items')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('clinic_id', this.clinicId)
            .select()
            .single();

        if (error) {
            console.error('Supabase Error (changeStatus):', error);
            throw new Error('Failed to update queue status');
        }

        return this.mapToQueueItem(data);
    }

    async findById(id: string): Promise<QueueItem | null> {
        const { data, error } = await this.supabase
            .from('queue_items')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error('Queue item not found');
        }

        return this.mapToQueueItem(data);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapToQueueItem(row: any): QueueItem {
        return {
            id: row.id,
            clinic_id: row.clinic_id || 'unknown',
            ticket_code: row.ticket_code,
            appointment_id: row.appointment_id,
            patient_id: row.patient_id,
            doctor_id: row.doctor_id,
            status: row.status,
            priority: row.priority || 'NORMAL',
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
}
