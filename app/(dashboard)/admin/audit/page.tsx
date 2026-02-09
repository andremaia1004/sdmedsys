import { fetchAuditLogsAction } from '@/app/actions/admin';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AuditPage(props: { searchParams: Promise<{ page?: string }> }) {
    const searchParams = await props.searchParams;
    const currentPage = parseInt(searchParams.page || '1');
    const { logs, totalCount, totalPages } = await fetchAuditLogsAction(currentPage);

    const getActionBadgeVariant = (action: string) => {
        switch (action) {
            case 'CREATE': return 'success';
            case 'UPDATE': return 'info'; // warning not supported
            case 'DELETE': return 'danger';
            case 'STATUS_CHANGE': return 'secondary'; // primary not supported
            default: return 'secondary';
        }
    };

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Logs de Auditoria</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Rastreabilidade de ações críticas do sistema</p>
                </div>
                <Link href="/admin">
                    <Button variant="ghost">Voltar ao Dashboard</Button>
                </Link>
            </div>

            <Card padding="none">
                <Table headers={['Data/Hora', 'Usuário', 'Ação', 'Entidade', 'ID Entidade', 'Metadados']}>
                    {logs.map((log) => (
                        <tr key={log.id}>
                            <td style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                                {new Date(log.created_at).toLocaleString('pt-BR')}
                            </td>
                            <td>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{log.role}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.user_id?.substring(0, 8)}...</div>
                            </td>
                            <td>
                                <Badge variant={getActionBadgeVariant(log.action) as "success" | "info" | "danger" | "secondary"}>
                                    {log.action}
                                </Badge>
                            </td>
                            <td>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                    {log.entity}
                                </span>
                            </td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                {log.entity_id || '-'}
                            </td>
                            <td>
                                <div style={{ fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {JSON.stringify(log.metadata)}
                                </div>
                            </td>
                        </tr>
                    ))}
                </Table>

                {logs.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhum log de auditoria encontrado.
                    </div>
                )}

                <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        Total: <strong>{totalCount}</strong> logs
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link href={`/admin/audit?page=${currentPage - 1}`} prefetch={false}>
                            <Button variant="outline" size="sm" disabled={currentPage <= 1}>Anterior</Button>
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.875rem' }}>
                            Página {currentPage} de {totalPages}
                        </div>
                        <Link href={`/admin/audit?page=${currentPage + 1}`} prefetch={false}>
                            <Button variant="outline" size="sm" disabled={currentPage >= totalPages}>Próxima</Button>
                        </Link>
                    </div>
                </div>
            </Card>
        </div >
    );
}
