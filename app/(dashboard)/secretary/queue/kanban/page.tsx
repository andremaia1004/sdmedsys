import KanbanBoard from '@/features/secretary/components/KanbanBoard';
import { fetchDailyDashboardAction } from '@/features/secretary/actions';

export const dynamic = 'force-dynamic';

export default async function KanbanPage() {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetchDailyDashboardAction(today);
    const items = res.data || [];

    return (
        <div className="page-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">Gestão de Fila (Kanban)</h1>
                    <p className="page-subtitle">Arraste ou use as ações para gerenciar o fluxo</p>
                </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <KanbanBoard items={items} />
            </div>
        </div>
    );
}
