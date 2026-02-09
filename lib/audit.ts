import { supabaseServer } from './supabase-server';
import { getCurrentUser } from './session';

export type AuditAction =
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'STATUS_CHANGE'
    | 'LOGIN'
    | 'LOGIN_FAILURE'
    | 'LOGOUT'
    | 'ACCESS_DENIED'
    | 'FINALIZE'
    | 'GENERATE_DOCUMENT'
    | 'GENERATE_CERTIFICATE_PDF'
    | 'GENERATE_PRESCRIPTION_PDF'
    | 'CREATE_DOCUMENT_RECORD'
    | 'CHECK_IN'
    | 'CREATE_WALKIN'
    | 'CALL_NEXT'
    | 'START_SERVICE'
    | 'NO_SHOW'
    | 'CANCEL_APPOINTMENT'
    | 'OTHER';
export type AuditEntity = 'PATIENT' | 'APPOINTMENT' | 'QUEUE' | 'QUEUE_ITEM' | 'CONSULTATION' | 'AUTH' | 'DOCTOR' | 'SETTINGS' | 'CLINICAL_ENTRY';

/**
 * Records a critical action to the audit logs.
 * Sensitive data should be excluded from metadata.
 */
export async function logAudit(
    action: AuditAction,
    entity: AuditEntity,
    entityId?: string,
    metadata: Record<string, unknown> = {}
) {
    try {
        const user = await getCurrentUser();

        // Fallback or system default clinic
        const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000';

        const { error } = await supabaseServer
            .from('audit_logs')
            .insert([{
                user_id: user?.id || null,
                role: user?.role || 'SYSTEM',
                action,
                entity,
                entity_id: entityId,
                clinic_id: clinicId,
                metadata,
                created_at: new Date().toISOString()
            }]);

        if (error) {
            console.error('Audit Logging Failed:', error);
        }
    } catch (err) {
        console.error('Error in logAudit helper:', err);
    }
}
