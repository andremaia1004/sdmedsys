import React from 'react';
import { requireRole } from '@/lib/session';
import { fetchCrmBoardAction } from '@/features/crm/actions';
import { CrmKanbanBoard } from '@/features/crm/components/CrmKanbanBoard';
import { AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SecretaryCrmPage() {
    await requireRole(['SECRETARY', 'ADMIN']);

    const res = await fetchCrmBoardAction();

    if (!res.success) {
        return (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#dc2626' }}>
                <AlertTriangle size={48} />
                <h2 style={{ margin: 0 }}>Erro ao carregar CRM</h2>
                <p>{res.error}</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0', letterSpacing: '-0.025em' }}>
                        CRM Comercial
                    </h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
                        Acompanhe leads, pacientes em tratamento e retornos pendentes.
                    </p>
                </div>
            </div>

            <div style={{ flex: 1 }}>
                <CrmKanbanBoard initialCards={res.data || []} />
            </div>
        </div>
    );
}
