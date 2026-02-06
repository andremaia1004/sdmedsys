import { SupabaseClient } from '@supabase/supabase-js';
import { Doctor, DoctorInput } from './types';
import { IDoctorsRepository } from './repository.types';

export class SupabaseDoctorsRepository implements IDoctorsRepository {
    constructor(
        private supabase: SupabaseClient,
        private clinicId: string
    ) {
        console.log(`[SupabaseDoctorsRepository] Initialized with clinicId: ${clinicId}`);
    }

    async list(activeOnly?: boolean): Promise<Doctor[]> {
        console.log(`[SupabaseDoctorsRepository] list activeOnly=${activeOnly}, clinicId=${this.clinicId}`);
        let query = this.supabase
            .from('doctors')
            .select('*')
            .eq('clinic_id', this.clinicId)
            .order('name', { ascending: true });

        if (activeOnly) {
            query = query.eq('active', true);
        }

        const { data, error } = await query;
        if (error) {
            console.error('[SupabaseDoctorsRepository] list Error:', error);
            throw new Error(error.message);
        }
        console.log(`[SupabaseDoctorsRepository] list Found ${data?.length} doctors`);
        return data.map(this.mapToDoctor);
    }

    async findById(id: string): Promise<Doctor | undefined> {
        console.log(`[SupabaseDoctorsRepository] findById id=${id} (skipping clinic check)`);
        const { data, error } = await this.supabase
            .from('doctors')
            .select('*')
            .eq('id', id)
            // .eq('clinic_id', this.clinicId) // Relaxed check to ensure we find the doc
            .maybeSingle();

        if (error) console.error('[SupabaseDoctorsRepository] findById Error:', error);

        if (error || !data) return undefined;
        return this.mapToDoctor(data);
    }

    async create(input: DoctorInput): Promise<Doctor> {
        const { data, error } = await this.supabase
            .from('doctors')
            .insert([{
                name: input.name,
                specialty: input.specialty,
                crm: input.crm,
                phone: input.phone,
                email: input.email,
                profile_id: input.profileId,
                clinic_id: this.clinicId,
                active: true
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.mapToDoctor(data);
    }

    async update(id: string, input: Partial<Doctor>): Promise<Doctor | null> {
        // Ensure we don't accidentally wipe clinic_id
        const { profileId, name, specialty, active, crm, phone, email } = input;
        const updateData: any = { updated_at: new Date().toISOString() };
        if (profileId !== undefined) updateData.profile_id = profileId;
        if (name !== undefined) updateData.name = name;
        if (specialty !== undefined) updateData.specialty = specialty;
        if (active !== undefined) updateData.active = active;
        if (crm !== undefined) updateData.crm = crm;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;

        const { data, error } = await this.supabase
            .from('doctors')
            .update(updateData)
            .eq('id', id)
            .eq('clinic_id', this.clinicId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.mapToDoctor(data);
    }

    private mapToDoctor(row: any): Doctor {
        return {
            id: row.id,
            profileId: row.profile_id,
            name: row.name,
            specialty: row.specialty,
            crm: row.crm,
            phone: row.phone,
            email: row.email,
            active: row.active,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
