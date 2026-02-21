import { getCurrentUser } from '@/lib/session';
import { createClient } from '@/lib/supabase-auth';
import { PrescriptionData, CertificateData, ReportData } from '@/lib/pdf/templates';
import { logAudit } from '@/lib/audit';
import { ClinicalDocumentsRegistryService } from '@/features/documents/service.registry';

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
        let doctorName = user.name;
        let doctorCrm = '';

        const { data: doctorRecord } = await supabase
            .from('doctors')
            .select('id, name, crm')
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

        const data: PrescriptionData = {
            header: {
                clinicName: clinic?.clinic_name || 'SDMED Clinic',
                clinicAddress: clinic?.address || 'Endereço da Unidade',
                clinicPhone: clinic?.phone || 'Fone: (00) 0000-0000'
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
            date: new Date().toLocaleDateString('pt-BR'),
            metadata: {
                consultationId: consultation.id,
                patientId: consultation.patient_id,
                doctorId: consultation.doctor_user_id,
                clinicId: consultation.clinic_id
            }
        };

        // 5. Persist in Registry
        if (doctorRecord?.id) {
            await this.saveDocumentRecord(data, 'prescription', doctorRecord.id);
        }

        return data;
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

        const result: CertificateData = {
            ...base,
            days,
            cid,
            startTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            metadata: base.metadata
        };

        // Persist in Registry
        const supabase = await createClient();
        const { data: doctorRecord } = await supabase
            .from('doctors')
            .select('id')
            .eq('profile_id', base.metadata?.doctorId)
            .single();

        if (doctorRecord?.id) {
            await this.saveDocumentRecord(result, 'certificate', doctorRecord.id);
        }

        return result;
    }

    static async getReportData(consultationId: string): Promise<ReportData | null> {
        const user = await getCurrentUser();
        if (!user || user.role === 'SECRETARY' || !user.clinicId) {
            return null;
        }

        const supabase = await createClient();

        // 1. Fetch Consultation with FINAL clinical entry
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
            .eq('clinical_entries.is_final', true)
            .single();

        if (consultationError || !consultation || !consultation.clinical_entries?.[0]) {
            console.error('DocumentService: Finalized entry not found for report', consultationError);
            return null;
        }

        const clinicalEntry = consultation.clinical_entries[0];
        const patient = consultation.patients;
        const clinic = consultation.clinic_settings;

        const { data: doctorRecord } = await supabase
            .from('doctors')
            .select('id, name, crm')
            .eq('profile_id', consultation.doctor_user_id)
            .single();

        const doctorName = doctorRecord?.name || user.name;
        const doctorCrm = doctorRecord?.crm || '';

        await logAudit(
            'GENERATE_DOCUMENT',
            'CONSULTATION',
            consultationId,
            {
                patientId: consultation.patient_id,
                documentType: 'report'
            }
        );

        const data: ReportData = {
            header: {
                clinicName: clinic?.clinic_name || 'SDMED Clinic',
                clinicAddress: clinic?.address || 'Endereço da Unidade',
                clinicPhone: clinic?.phone || 'Fone: (00) 0000-0000'
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
            content: `DIAGNÓSTICO: ${clinicalEntry.diagnosis || 'Não informado'}\n\nCONDUTA: ${clinicalEntry.conduct || 'Não informado'}\n\nNOTAS: ${clinicalEntry.free_notes || ''}`,
            date: new Date().toLocaleDateString('pt-BR'),
            metadata: {
                consultationId: consultation.id,
                patientId: consultation.patient_id,
                doctorId: consultation.doctor_user_id,
                clinicId: consultation.clinic_id
            }
        };

        if (doctorRecord?.id) {
            await this.saveDocumentRecord(data, 'report', doctorRecord.id);
        }

        return data;
    }

    private static async saveDocumentRecord(
        data: PrescriptionData | CertificateData | ReportData,
        type: 'prescription' | 'certificate' | 'report',
        doctorId: string
    ) {
        const user = await getCurrentUser();
        if (!user || !data.metadata) return;

        await ClinicalDocumentsRegistryService.createRecord({
            clinicId: data.metadata.clinicId,
            patientId: data.metadata.patientId,
            consultationId: data.metadata.consultationId,
            doctorId: doctorId,
            type,
            issuedAt: new Date().toISOString(),
            meta: {
                ...('days' in data ? { days: data.days, cid: data.cid } : {}),
                ...('observations' in data ? { observations: (data as PrescriptionData).observations } : {}),
            },
            createdBy: user.id
        });
    }
}
