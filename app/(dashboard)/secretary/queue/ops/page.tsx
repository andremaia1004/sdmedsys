import OperationalQueue from '@/features/queue/components/OperationalQueue';

export const dynamic = 'force-dynamic';

export default function OperationalQueuePage() {
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e9ecef', background: '#fff' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>Operação de Fila</h1>
                <p style={{ margin: '0.25rem 0 0', color: '#6c757d', fontSize: '0.9rem' }}>Fila em tempo real e chamadas rápidas</p>
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
                <OperationalQueue />
            </div>
        </div>
    );
}
