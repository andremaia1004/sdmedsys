export type TimelineEventType = 'CONSULTATION' | 'ENTRY'; // Stage 03B will add: 'APPOINTMENT' | 'QUEUE' | 'DOCUMENT'

export interface TimelineEvent {
    id: string;
    eventType: TimelineEventType;
    occurredAt: string; // ISO Timestamp
    doctorUserId?: string; // Optional, for filtering
    title: string;
    summary?: string; // Short description
    link?: string; // e.g. /consultations/[id]
    metadata?: Record<string, unknown>; // Flexible metadata
}

export interface TimelineFilters {
    doctorId?: string;
    startDate?: string; // ISO Date YYYY-MM-DD
    endDate?: string;   // ISO Date YYYY-MM-DD
}

export interface TimelineResponse {
    data: TimelineEvent[];
    total: number;
    hasMore: boolean;
}
