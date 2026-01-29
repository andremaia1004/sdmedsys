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
            const q = query.trim();
            // Normalize query for phone search (remove non-digits)
            const phoneQuery = q.replace(/\D/g, '');

            // Build OR clause: 
            // 1. Name matches (case-insensitive)
            // 2. Document matches (case-insensitive)
            // 3. Phone matches (if query contains digits)
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
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return undefined; // No rows
            console.error('Supabase Error (findById):', error);
            throw new Error('Failed to find patient');
        }

        return this.mapToPatient(data);
    }

    async create(input: PatientInput): Promise<Patient> {
        // Normalize phone: maintain only digits
        const normalizedPhone = input.phone.replace(/\D/g, '');

        const { data, error } = await supabase
            .from('patients')
            .insert([{
                name: input.name,
                document: input.document.replace(/\D/g, ''), // Normalize document too
                phone: normalizedPhone,
                birth_date: input.birthDate,
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
        const normalizedPhone = input.phone.replace(/\D/g, '');

        const { data, error } = await supabase
            .from('patients')
            .update({
                name: input.name,
                document: input.document.replace(/\D/g, ''),
                phone: normalizedPhone,
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
