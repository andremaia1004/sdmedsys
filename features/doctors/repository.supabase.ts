import { SupabaseClient } from '@supabase/supabase-js';
import { Doctor, DoctorInput } from './types';
import { IDoctorsRepository } from './repository.types';

export class SupabaseDoctorsRepository implements IDoctorsRepository {
    constructor(
        private supabase: SupabaseClient,
        private clinicId: string
    ) { }

    async list(activeOnly?: boolean): Promise<Doctor[]> {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((d: any) => this.mapToDoctor(d));
    }

    async findById(id: string): Promise<Doctor | undefined> {
        const { data, error } = await this.supabase
            .from('doctors')
            .select('*')
            .eq('id', id)
            .eq('clinic_id', this.clinicId)
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

        if (error) {
            console.error('[SupabaseDoctorsRepository] create Error:', error);
            throw new Error(error.message);
        }
        return this.mapToDoctor(data);
    }

    async update(id: string, input: Partial<Doctor>): Promise<Doctor | null> {
        const { profileId, name, specialty, active, crm, phone, email } = input;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        if (error) {
            console.error('[SupabaseDoctorsRepository] update Error:', error);
            throw new Error(error.message);
        }
        return this.mapToDoctor(data);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
