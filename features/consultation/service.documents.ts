import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { PrescriptionData, CertificateData } from '@/lib/pdf/templates';
import { logAudit } from '@/lib/audit';

export class ClinicalDocumentService {
    static async getDocumentData(consultationId: string): Promise<PrescriptionData | null> {
        const user = await getCurrentUser();
        if (!user || user.role === 'SECRETARY' || !user.clinicId) {
            return null;
        }

        const supabase = await createClient();

        // 1. Fetch Consultation and related data
        const { data: consultation, error: consultationError } = await supabase
            .from('consultations')
            .select(`
                *,
                clinical_entries!inner (*),
                patients!inner (*),
                clinic_settings:clinic_id (*)
            `)
            .eq('id', consultationId)
            .eq('clinic_id', user.clinicId)
            .single();

        if (consultationError || !consultation) {
            console.error('DocumentService: Consultation not found or access denied', consultationError);
            return null;
        }

        // 2. RBAC check for DOCTOR
        if (user.role === 'DOCTOR' && consultation.doctor_user_id !== user.id) {
            console.warn('DocumentService: Doctor attempted to access another doctors consultation');
            return null;
        }

        const clinicalEntry = consultation.clinical_entries?.[0]; // Usually 1:1 with consultation
        const patient = consultation.patients;
        const clinic = consultation.clinic_settings;

        if (!clinicalEntry || !patient) {
            return null;
        }

        // 3. Fetch Doctor details (Name + CRM)
        // We try to find the doctor in the 'doctors' table using the doctor_user_id (which is a profile_id)
        // or if it's a legacy ID. The consultation.doctor_user_id is usually the auth user id (profile).
        let doctorName = user.name;
        let doctorCrm = '';

        const { data: doctorRecord } = await supabase
            .from('doctors')
            .select('name, crm')
            .eq('profile_id', consultation.doctor_user_id)
            .single();

        if (doctorRecord) {
            doctorName = doctorRecord.name;
            doctorCrm = doctorRecord.crm || '';
        } else if (user.role === 'ADMIN' && consultation.doctor_user_id !== user.id) {
            // Fallback if not found in doctors table (rare), try profiles
            const { data: docProfile } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', consultation.doctor_user_id)
                .single();
            doctorName = docProfile?.email || 'Médico Responsável';
        }

        // 4. Audit Log
        await logAudit(
            'GENERATE_PRESCRIPTION_PDF',
            'CONSULTATION',
            consultationId,
            {
                patientId: consultation.patient_id,
                doctorId: consultation.doctor_user_id,
                documentType: 'prescription'
            }
        );

        return {
            header: {
                clinicName: clinic?.clinic_name || 'SDMED Clinic',
                clinicAddress: 'Endereço da Unidade', // TODO: Add to clinic_settings
                clinicPhone: 'Fone: (00) 0000-0000'
            },
            patient: {
                name: patient.name,
                document: patient.document,
                birthDate: patient.birth_date
            },
            doctor: {
                name: doctorName,
                crm: doctorCrm
            },
            content: clinicalEntry.conduct || 'Nenhuma conduta registrada',
            observations: clinicalEntry.observations || '',
            date: new Date().toLocaleDateString('pt-BR')
        };
    }

    static async getCertificateData(consultationId: string, days: number = 0, cid?: string): Promise<CertificateData | null> {
        // Reuse most logic from getDocumentData
        const base = await this.getDocumentData(consultationId);
        if (!base) return null;

        // Audit Log specifically for certificate
        const user = await getCurrentUser();
        if (user && user.clinicId) {
            await logAudit(
                'GENERATE_CERTIFICATE_PDF',
                'CONSULTATION',
                consultationId,
                {
                    patientId: base.patient.name, // Just for log tracking
                    documentType: 'certificate'
                }
            );
        }

        return {
            ...base,
            days,
            cid,
            startTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
    }
}
