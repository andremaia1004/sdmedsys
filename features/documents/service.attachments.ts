import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { logAudit } from '@/lib/audit';

export type AttachmentCategory = 'ADMIN' | 'CLINICAL';

export interface PatientAttachment {
    id: string;
    clinicId: string;
    patientId: string;
    category: AttachmentCategory;
    fileName: string;
    filePath: string;
    fileType: string;
    uploadedBy: string;
    createdAt: string;
}

export class PatientAttachmentService {
    static async listByPatient(patientId: string): Promise<PatientAttachment[]> {
        const user = await getCurrentUser();
        if (!user || !user.clinicId) return [];

        const supabase = await createClient();

        let query = supabase
            .from('patient_attachments')
            .select('*')
            .eq('patient_id', patientId)
            .eq('clinic_id', user.clinicId);

        // SECRETARY: Category filtering (also enforced by RLS)
        if (user.role === 'SECRETARY') {
            query = query.eq('category', 'ADMIN');
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('AttachmentService: Failed to list', error);
            return [];
        }

        return (data || []).map(row => ({
            id: row.id,
            clinicId: row.clinic_id,
            patientId: row.patient_id,
            category: row.category,
            fileName: row.file_name,
            filePath: row.file_path,
            fileType: row.file_type,
            uploadedBy: row.uploaded_by,
            createdAt: row.created_at
        }));
    }

    static async countByPatient(patientId: string): Promise<number> {
        const user = await getCurrentUser();
        if (!user || !user.clinicId) return 0;

        const supabase = await createClient();

        let query = supabase
            .from('patient_attachments')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patientId)
            .eq('clinic_id', user.clinicId);

        // SECRETARY: Category filtering (also enforced by RLS but good to be explicit for count)
        if (user.role === 'SECRETARY') {
            query = query.eq('category', 'ADMIN');
        }

        const { count, error } = await query;

        if (error) {
            console.error('AttachmentService: Failed to count', error);
            return 0;
        }

        return count || 0;
    }

    static async createRecord(patientId: string, category: AttachmentCategory, fileName: string, filePath: string, fileType: string): Promise<PatientAttachment | null> {
        const user = await getCurrentUser();
        if (!user || !user.clinicId) return null;

        // SECRETARY can only upload ADMIN category
        if (user.role === 'SECRETARY' && category !== 'ADMIN') {
            console.error('AttachmentService: Secretary attempted to upload clinical attachment');
            return null;
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('patient_attachments')
            .insert([{
                clinic_id: user.clinicId,
                patient_id: patientId,
                category,
                file_name: fileName,
                file_path: filePath,
                file_type: fileType,
                uploaded_by: user.id
            }])
            .select()
            .single();

        if (error) {
            console.error('AttachmentService: Failed to create record', error);
            return null;
        }

        await logAudit('CREATE', 'PATIENT', data.id, {
            action: 'UPLOAD_ATTACHMENT',
            category,
            patientId
        });

        return data;
    }

    static async deleteRecord(id: string): Promise<boolean> {
        const user = await requireRole(['ADMIN', 'DOCTOR']); // Secretary cannot delete by default requirement
        const supabase = await createClient();

        const { error } = await supabase
            .from('patient_attachments')
            .delete()
            .eq('id', id)
            .eq('clinic_id', user.clinicId);

        if (error) {
            console.error('AttachmentService: Failed to delete', error);
            return false;
        }

        await logAudit('DELETE', 'PATIENT', id, { action: 'DELETE_ATTACHMENT' });

        return true;
    }
}

async function requireRole(roles: string[]) {
    const user = await getCurrentUser();
    if (!user || !roles.includes(user.role)) {
        throw new Error('Unauthorized');
    }
    return user;
}
