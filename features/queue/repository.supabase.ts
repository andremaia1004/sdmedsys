import { supabase } from '@/lib/supabase';
import { QueueItem, QueueItemWithPatient, QueueStatus } from './types';
import { IQueueRepository } from './repository.types';

export class SupabaseQueueRepository implements IQueueRepository {
    async list(doctorId?: string): Promise<QueueItem[]> {
        let query = supabase
            .from('queue_items')
            .select('*') // No JOIN
            .not('status', 'in', '("DONE","CANCELED")')
            .order('created_at', { ascending: true });

        if (doctorId) {
            query = query.or(`doctor_id.eq.${doctorId},doctor_id.is.null`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase Error (list queue):', error);
            throw new Error('Failed to list queue items');
        }

        return data.map(this.mapToQueueItem);
    }

    async getTVList(): Promise<Partial<QueueItemWithPatient>[]> {
        // TV shows WAITING, CALLED, IN_SERVICE
        const { data, error } = await supabase
            .from('queue_items')
            .select('ticket_code, status, doctor_id')
            .in('status', ['WAITING', 'CALLED', 'IN_SERVICE'])
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Supabase Error (TV list):', error);
            return [];
        }

        return data.map((row: any) => ({
            ticketCode: row.ticket_code,
            status: row.status as QueueStatus,
            doctorId: row.doctor_id,
        }));
    }

    async add(item: Omit<QueueItem, 'id' | 'createdAt' | 'updatedAt' | 'ticketCode'>, actorRole: string): Promise<QueueItem> {
        // Generate Ticket Code: A + Sequence reset daily
        const today = new Date().toISOString().split('T')[0];
        const startOfDay = `${today}T00:00:00.000Z`;
        const endOfDay = `${today}T23:59:59.999Z`;

        // Count items created TODAY
        const { count, error: countError } = await supabase
            .from('queue_items')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay);

        if (countError) {
            console.error('Supabase Error (count queue):', countError);
            throw new Error('Failed to generate ticket code');
        }

        // MVP: Simple Increment. 
        // Note: unique constraint on ticket_code + day would be better in DB schema, but we handle logic here.
        const nextNum = (count || 0) + 1;
        const code = `A${nextNum.toString().padStart(3, '0')}`;

        const { data, error } = await supabase
            .from('queue_items')
            .insert([{
                patient_id: item.patientId,
                doctor_id: item.doctorId,
                appointment_id: item.appointmentId,
                status: item.status,
                ticket_code: code,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase Error (add queue):', error);
            throw new Error('Failed to add queue item');
        }

        return this.mapToQueueItem(data);
    }

    async changeStatus(id: string, newStatus: QueueStatus, actorRole: string): Promise<QueueItem> {
        const { data, error } = await supabase
            .from('queue_items')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase Error (changeStatus):', error);
            throw new Error('Failed to update queue status');
        }

        return this.mapToQueueItem(data);
    }

    private mapToQueueItem(row: any): QueueItem {
        return {
            id: row.id,
            ticketCode: row.ticket_code,
            appointmentId: row.appointment_id,
            patientId: row.patient_id,
            doctorId: row.doctor_id,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
