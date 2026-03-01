'use client';

import React, { useEffect, useState } from 'react';
import { fetchPatientAttachmentsAction, deleteAttachmentRecordAction, getAttachmentSignedUrlAction } from '@/features/documents/attachment_actions';
import { PatientAttachment } from '@/features/documents/service.attachments';
import { AttachmentUploadModal } from './AttachmentUploadModal';
import { LoadingState, EmptyState } from '@/features/patients/components/TabStates';
import styles from './PatientAttachments.module.css';
import { useToast } from '@/components/ui/Toast';

interface Props {
    patientId: string;
    role: string;
}

export const PatientAttachments: React.FC<Props> = ({ patientId, role }) => {
    const [attachments, setAttachments] = useState<PatientAttachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const { showToast } = useToast();

    const isFullAccess = role === 'ADMIN' || role === 'DOCTOR';

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchPatientAttachmentsAction(patientId);
            setAttachments(res.data || []);
        } catch (error) {
            console.error('Failed to load attachments:', error);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        load();
    }, [load]);

    const handleView = async (filePath: string) => {
        const result = await getAttachmentSignedUrlAction(filePath);
        if (result.success && result.data) {
            window.open(result.data, '_blank', 'noopener,noreferrer');
        } else {
            showToast('error', 'Erro ao abrir arquivo.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este anexo?')) return;
        setDeleting(id);
        try {
            const result = await deleteAttachmentRecordAction(id, patientId);
            if (result.success) {
                setAttachments(prev => prev.filter(a => a.id !== id));
            } else {
                showToast('error', result.error || 'Erro ao excluir');
            }
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            setDeleting(null);
        }
    };

    const NewAttachmentButton = () => (
        <button
            onClick={() => setShowUploadModal(true)}
            className={styles.addBtn}
        >
            ➕ Novo Anexo
        </button>
    );

    if (loading) return <LoadingState message="Carregando anexos..." />;

    if (attachments.length === 0) return (
        <>
            <EmptyState
                message="Nenhum anexo encontrado."
                action={<NewAttachmentButton />}
            />
            {showUploadModal && (
                <AttachmentUploadModal
                    patientId={patientId}
                    role={role}
                    onSuccess={() => {
                        load();
                        setShowUploadModal(false);
                    }}
                    onClose={() => setShowUploadModal(false)}
                />
            )}
        </>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Anexos do Paciente</h3>
                <NewAttachmentButton />
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Arquivo</th>
                        <th>Categoria</th>
                        <th>Tipo</th>
                        <th>Data</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {attachments.map((att) => (
                        <tr key={att.id}>
                            <td className={styles.fileName}>{att.fileName}</td>
                            <td>
                                <span className={`${styles.category} ${att.category === 'CLINICAL' ? styles.clinical : styles.admin}`}>
                                    {att.category === 'CLINICAL' ? '🏥 Clínica' : '📂 Adm'}
                                </span>
                            </td>
                            <td>{att.fileType.split('/')[1]?.toUpperCase() || att.fileType}</td>
                            <td>{new Date(att.createdAt).toLocaleDateString('pt-BR')}</td>
                            <td className={styles.actions}>
                                <button onClick={() => handleView(att.filePath)} className={styles.viewBtn}>👁️ Ver</button>
                                {isFullAccess && (
                                    <button
                                        onClick={() => handleDelete(att.id)}
                                        disabled={deleting === att.id}
                                        className={styles.deleteBtn}
                                    >
                                        {deleting === att.id ? '...' : '🗑️'}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showUploadModal && (
                <AttachmentUploadModal
                    patientId={patientId}
                    role={role}
                    onSuccess={() => {
                        load();
                        setShowUploadModal(false);
                    }}
                    onClose={() => setShowUploadModal(false)}
                />
            )}
        </div>
    );
};
