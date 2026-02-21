import KanbanBoard from '@/features/secretary/components/KanbanBoard';
import { fetchDailyDashboardAction } from '@/features/secretary/actions';

export const dynamic = 'force-dynamic';

export default async function KanbanPage() {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetchDailyDashboardAction(today);
    const items = res.data || [];

    return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e9ecef', background: '#fff' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Gestão de Fila (Kanban)</h1>
                <p style={{ margin: '0.25rem 0 0', color: '#6c757d', fontSize: '0.9rem' }}>Arraste ou use as ações para gerenciar o fluxo</p>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <KanbanBoard items={items} />
            </div>
        </div>
    );
}
