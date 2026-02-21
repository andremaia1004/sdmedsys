'use server';

import { createClient } from '@/lib/supabase-auth';
import { getCurrentUser } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase-server';

export interface DashboardStats {
    consultations_today: { status: string; count: number }[];
    queue_by_doctor: { doctor_name: string; doctor_id: string; waiting: number; called: number; in_service: number }[];
    active_doctors: { id: string; name: string; specialty: string }[];
    totals: {
        patients_total: number;
        appointments_today: number;
        queue_active: number;
    };
}

async function getClient() {
    const user = await getCurrentUser();
    const authMode = process.env.AUTH_MODE || 'stub';
    if (authMode === 'supabase' && user) {
        return createClient();
    }
    return supabaseServer;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
    const client = await getClient();
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    // 1. Consultations today by status
    const { data: consultations } = await client
        .from('consultations')
        .select('id, finished_at')
        .gte('started_at', startOfDay)
        .lt('started_at', endOfDay);

    const consultationCounts: Record<string, number> = { em_andamento: 0, finalizadas: 0 };
    (consultations || []).forEach(c => {
        if (c.finished_at) {
            consultationCounts.finalizadas++;
        } else {
            consultationCounts.em_andamento++;
        }
    });

    const consultations_today = Object.entries(consultationCounts).map(([status, count]) => ({
        status,
        count
    }));

    // 2. Queue by doctor (active items)
    const { data: queueItems } = await client
        .from('queue_items')
        .select('id, doctor_id, status')
        .in('status', ['WAITING', 'CALLED', 'IN_SERVICE'])
        .gte('created_at', startOfDay);

    const { data: doctors } = await client
        .from('doctors')
        .select('id, name, specialty')
        .eq('active', true);

    const doctorMap = new Map<string, { name: string; waiting: number; called: number; in_service: number }>();
    (doctors || []).forEach(d => {
        doctorMap.set(d.id, { name: d.name, waiting: 0, called: 0, in_service: 0 });
    });

    (queueItems || []).forEach(item => {
        const doc = doctorMap.get(item.doctor_id);
        if (doc) {
            if (item.status === 'WAITING') doc.waiting++;
            else if (item.status === 'CALLED') doc.called++;
            else if (item.status === 'IN_SERVICE') doc.in_service++;
        }
    });

    const queue_by_doctor = Array.from(doctorMap.entries())
        .filter(([, v]) => v.waiting > 0 || v.called > 0 || v.in_service > 0)
        .map(([id, v]) => ({
            doctor_id: id,
            doctor_name: v.name,
            waiting: v.waiting,
            called: v.called,
            in_service: v.in_service
        }));

    // 3. Active doctors (those with queue items or consultations today)
    const activeDoctorIds = new Set<string>();
    (queueItems || []).forEach(q => activeDoctorIds.add(q.doctor_id));
    (consultations || []).forEach((c: Record<string, string>) => {
        if (c.doctor_id) activeDoctorIds.add(c.doctor_id);
    });

    const active_doctors = (doctors || [])
        .filter(d => activeDoctorIds.has(d.id))
        .map(d => ({ id: d.id, name: d.name, specialty: d.specialty || 'Geral' }));

    // 4. Totals
    const { count: patientsTotal } = await client
        .from('patients')
        .select('id', { count: 'exact', head: true });

    const { count: appointmentsToday } = await client
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('start_time', startOfDay)
        .lt('start_time', endOfDay);

    return {
        consultations_today,
        queue_by_doctor,
        active_doctors,
        totals: {
            patients_total: patientsTotal || 0,
            appointments_today: appointmentsToday || 0,
            queue_active: (queueItems || []).length,
        }
    };
}
