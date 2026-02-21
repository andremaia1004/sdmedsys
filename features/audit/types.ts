export interface AuditLog {
    timestamp: string;
    action: string;
    actor_role: string; // 'SECRETARY' | 'DOCTOR'
    item_id: string;
    details?: string;
}
