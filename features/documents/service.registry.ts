import { createClient } from '@/lib/supabase-auth';
import { getCurrentUser } from '@/lib/session';
import { ClinicalDocument, CreateClinicalDocumentInput } from './types';
import { logAudit } from '@/lib/audit';

export class ClinicalDocumentsRegistryService {
    static async createRecord(input: CreateClinicalDocumentInput): Promise<ClinicalDocument | null> {
        const user = await getCurrentUser();
        if (!user || user.role === 'SECRETARY') {
            console.error('ClinicalDocumentsRegistryService: Access Denied for createRecord');
            return null;
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('clinical_documents')
            .insert([{
                clinic_id: input.clinicId,
                patient_id: input.patientId,
                consultation_id: input.consultationId,
                doctor_id: input.doctorId,
                type: input.type,
                issued_at: input.issuedAt,
                meta: input.meta,
                created_by: input.createdBy
            }])
            .select()
            .single();

        if (error) {
            console.error('ClinicalDocumentsRegistryService: Failed to create record', error);
            return null;
        }

        await logAudit('CREATE_DOCUMENT_RECORD', 'CLINICAL_ENTRY', data.id, {
            type: input.type,
            patientId: input.patientId
        });

        return this.mapToDocument(data);
    }

    static async listByPatient(patientId: string): Promise<ClinicalDocument[]> {
        const user = await getCurrentUser();
        // Explicit Security Block for SECRETARY
        if (!user || user.role === 'SECRETARY') {
            return [];
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('clinical_documents')
            .select('*, doctors(name)')
            .eq('patient_id', patientId)
            .eq('clinic_id', user.clinicId) // Enforce clinic tenant
            .order('issued_at', { ascending: false });

        if (error) {
            console.error('ClinicalDocumentsRegistryService: Failed to list documents', error);
            return [];
        }

        return (data || []).map(this.mapToDocument);
    }

    static async countByPatient(patientId: string): Promise<number> {
        const user = await getCurrentUser();
        // Explicit Security Block for SECRETARY
        if (!user || user.role === 'SECRETARY') {
            return 0;
        }

        const supabase = await createClient();

        const { count, error } = await supabase
            .from('clinical_documents')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patientId)
            .eq('clinic_id', user.clinicId); // Enforce clinic tenant

        if (error) {
            console.error('ClinicalDocumentsRegistryService: Failed to count documents', error);
            return 0;
        }

        return count || 0;
    }

    static async findById(id: string): Promise<ClinicalDocument | null> {
        const user = await getCurrentUser();
        if (!user) return null;

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('clinical_documents')
            .select('*, doctors(name)')
            .eq('id', id)
            .eq('clinic_id', user.clinicId)
            .single();

        if (error || !data) {
            return null;
        }

        return this.mapToDocument(data);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static mapToDocument(row: any): ClinicalDocument {
        return {
            id: row.id,
            clinicId: row.clinic_id,
            patientId: row.patient_id,
            consultationId: row.consultation_id,
            doctorId: row.doctor_id,
            doctorName: row.doctors?.name || 'Médico não identificado',
            type: row.type,
            issuedAt: row.issued_at,
            meta: row.meta,
            createdBy: row.created_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
