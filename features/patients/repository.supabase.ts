import { supabase } from '@/lib/supabase';
import { Patient, PatientInput } from './types';
import { IPatientsRepository } from './repository.types';

export class SupabasePatientsRepository implements IPatientsRepository {
    async list(query?: string): Promise<Patient[]> {
        let builder = supabase
            .from('patients')
            .select('*')
            .order('name', { ascending: true });

        if (query) {
            // Simple search: check name (ilike) OR document/phone (exact/like)
            // Supabase 'or' syntax: "name.ilike.%query%,document.eq.query,phone.eq.query"
            // For MVP, stick to name ilike for simplicity or a broad "or" filter
            const q = query.trim();
            builder = builder.or(`name.ilike.%${q}%,document.ilike.%${q}%,phone.ilike.%${q}%`);
        }

        const { data, error } = await builder;

        if (error) {
            console.error('Supabase Error (list):', error);
            throw new Error('Failed to list patients');
        }

        return data.map(this.mapToPatient);
    }

    async findById(id: string): Promise<Patient | undefined> {
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            // PGRST116 is "JSON object requested, multiple (or no) rows returned"
            if (error.code === 'PGRST116') return undefined;
            console.error('Supabase Error (findById):', error);
            throw new Error('Failed to find patient');
        }

        return this.mapToPatient(data);
    }

    async create(input: PatientInput): Promise<Patient> {
        const { data, error } = await supabase
            .from('patients')
            .insert([{
                name: input.name,
                document: input.document,
                phone: input.phone,
                birth_date: input.birthDate, // Map birthDate (TS) to birth_date (SQL)
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase Error (create):', error);
            throw new Error('Failed to create patient');
        }

        return this.mapToPatient(data);
    }

    async update(id: string, input: PatientInput): Promise<Patient | null> {
        const { data, error } = await supabase
            .from('patients')
            .update({
                name: input.name,
                document: input.document,
                phone: input.phone,
                birth_date: input.birthDate,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase Error (update):', error);
            throw new Error('Failed to update patient');
        }

        return this.mapToPatient(data);
    }

    // Mapper to convert snake_case (DB) to camelCase (App)
    private mapToPatient(row: any): Patient {
        return {
            id: row.id,
            name: row.name,
            document: row.document,
            phone: row.phone,
            birthDate: row.birth_date, // Map back
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
