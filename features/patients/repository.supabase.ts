import { SupabaseClient } from '@supabase/supabase-js';
import { Patient, PatientInput } from './types';
import { IPatientsRepository } from './repository.types';

export class SupabasePatientsRepository implements IPatientsRepository {
    constructor(
        private supabase: SupabaseClient,
        private clinicId: string
    ) { }

    async list(query?: string): Promise<Patient[]> {
        let builder = this.supabase
            .from('patients')
            .select('*')
            .eq('clinic_id', this.clinicId)
            .order('name', { ascending: true });

        if (query) {
            const q = query.trim();
            const phoneQuery = q.replace(/\D/g, '');
            let orClause = `name.ilike.%${q}%,document.ilike.%${q}%`;

            if (phoneQuery.length > 0) {
                orClause += `,phone.ilike.%${phoneQuery}%`;
            }

            builder = builder.or(orClause);
        }

        const { data, error } = await builder;

        if (error) {
            console.error('Supabase Error (list):', error);
            throw new Error('Failed to list patients');
        }

        return data.map(this.mapToPatient);
    }

    async findById(id: string): Promise<Patient | undefined> {
        const { data, error } = await this.supabase
            .from('patients')
            .select('*')
            .eq('id', id)
            .eq('clinic_id', this.clinicId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return undefined; // No rows
            console.error('Supabase Error (findById):', error);
            throw new Error('Failed to find patient');
        }

        return this.mapToPatient(data);
    }

    async create(input: PatientInput): Promise<Patient> {
        const normalizedPhone = input.phone.replace(/\D/g, '');

        const { data, error } = await this.supabase
            .from('patients')
            .insert([{
                name: input.name,
                document: input.document.replace(/\D/g, ''),
                phone: normalizedPhone,
                email: input.email,
                address: input.address,
                guardian_name: input.guardian_name,
                insurance: input.insurance,
                main_complaint: input.main_complaint,
                emergency_contact: input.emergency_contact,
                birth_date: input.birthDate,
                clinic_id: this.clinicId
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase Error (create):', error);
            throw new Error(`Database Error: ${error.message} (${error.code})`);
        }

        return this.mapToPatient(data);
    }

    async update(id: string, input: PatientInput): Promise<Patient | null> {
        const normalizedPhone = input.phone.replace(/\D/g, '');

        const { data, error } = await this.supabase
            .from('patients')
            .update({
                name: input.name,
                document: input.document.replace(/\D/g, ''),
                phone: normalizedPhone,
                email: input.email,
                address: input.address,
                guardian_name: input.guardian_name,
                insurance: input.insurance,
                main_complaint: input.main_complaint,
                emergency_contact: input.emergency_contact,
                birth_date: input.birthDate,
                updated_at: new Date().toISOString(),
                // clinic_id technically shouldn't change, but we could add it to eq
            })
            .eq('id', id)
            .eq('clinic_id', this.clinicId)
            .select()
            .single();

        if (error) {
            console.error('Supabase Error (update):', error);
            throw new Error('Failed to update patient');
        }

        return this.mapToPatient(data);
    }

    private mapToPatient(row: any): Patient {
        return {
            id: row.id,
            name: row.name,
            document: row.document,
            phone: row.phone,
            email: row.email,
            address: row.address,
            guardian_name: row.guardian_name,
            insurance: row.insurance,
            main_complaint: row.main_complaint,
            emergency_contact: row.emergency_contact,
            birthDate: row.birth_date,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
