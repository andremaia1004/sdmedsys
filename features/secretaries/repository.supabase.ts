import { SupabaseClient } from '@supabase/supabase-js';
import { Secretary, SecretaryInput } from './types';

export class SupabaseSecretariesRepository {
    constructor(
        private supabase: SupabaseClient,
        private clinicId: string
    ) { }

    async list(activeOnly?: boolean): Promise<Secretary[]> {
        let query = this.supabase
            .from('secretaries')
            .select('*')
            .eq('clinic_id', this.clinicId)
            .order('name', { ascending: true });

        if (activeOnly) {
            query = query.eq('active', true);
        }

        const { data, error } = await query;
        if (error) {
            console.error('[SupabaseSecretariesRepository] list Error:', error);
            throw new Error(error.message);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((d: any) => this.mapToSecretary(d));
    }

    async findById(id: string): Promise<Secretary | undefined> {
        const { data, error } = await this.supabase
            .from('secretaries')
            .select('*')
            .eq('id', id)
            .eq('clinic_id', this.clinicId)
            .maybeSingle();

        if (error) console.error('[SupabaseSecretariesRepository] findById Error:', error);

        if (error || !data) return undefined;
        return this.mapToSecretary(data);
    }

    async create(input: SecretaryInput): Promise<Secretary> {
        const { data, error } = await this.supabase
            .from('secretaries')
            .insert([{
                name: input.name,
                phone: input.phone,
                email: input.email,
                profile_id: input.profileId,
                clinic_id: this.clinicId,
                active: true
            }])
            .select()
            .single();

        if (error) {
            console.error('[SupabaseSecretariesRepository] create Error:', error);
            throw new Error(error.message);
        }
        return this.mapToSecretary(data);
    }

    async update(id: string, input: Partial<Secretary>): Promise<Secretary | null> {
        const { profileId, name, active, phone, email } = input;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = { updated_at: new Date().toISOString() };
        if (profileId !== undefined) updateData.profile_id = profileId;
        if (name !== undefined) updateData.name = name;
        if (active !== undefined) updateData.active = active;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;

        const { data, error } = await this.supabase
            .from('secretaries')
            .update(updateData)
            .eq('id', id)
            .eq('clinic_id', this.clinicId)
            .select()
            .single();

        if (error) {
            console.error('[SupabaseSecretariesRepository] update Error:', error);
            throw new Error(error.message);
        }
        return this.mapToSecretary(data);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapToSecretary(row: any): Secretary {
        return {
            id: row.id,
            profileId: row.profile_id,
            clinicId: row.clinic_id,
            name: row.name,
            phone: row.phone,
            email: row.email,
            active: row.active,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
