'use client';

import React, { useEffect, useState } from 'react';
import { fetchPatientAttachmentsAction, deleteAttachmentRecordAction } from '@/features/documents/attachment_actions';
import { PatientAttachment, AttachmentCategory } from '@/features/documents/service.attachments';
import { AttachmentUploadModal } from './AttachmentUploadModal';
import styles from './PatientAttachments.module.css';

interface Props {
    patientId: string;
    role: string;
}

export const PatientAttachments: React.FC<Props> = ({ patientId, role }) => {
    const [attachments, setAttachments] = useState<PatientAttachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    const isFullAccess = role === 'ADMIN' || role === 'DOCTOR';

    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchPatientAttachmentsAction(patientId);
            setAttachments(data);
        } catch (error) {
            console.error('Failed to load attachments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [patientId]);

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este anexo?')) return;
        setDeleting(id);
        try {
            const result = await deleteAttachmentRecordAction(id, patientId);
            if (result.success) {
                setAttachments(prev => prev.filter(a => a.id !== id));
            } else {
                alert('Erro ao excluir: ' + (result.error || 'Desconhecido'));
            }
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            setDeleting(null);
        }
    };

    if (loading) return <div className={styles.loading}>Carregando anexos...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Anexos do Paciente</h3>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className={styles.addBtn}
                >
                    ➕ Novo Anexo
                </button>
            </div>

            {attachments.length === 0 ? (
                <div className={styles.empty}>Nenhum anexo encontrado.</div>
            ) : (
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
                                    {/* Link for testing - in production this would point to Supabase Storage URL */}
                                    <a href={att.filePath} target="_blank" rel="noopener noreferrer" className={styles.viewBtn}>👁️ Ver</a>
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
            )}

            {showUploadModal && (
                <AttachmentUploadModal
                    patientId={patientId}
                    role={role}
                    onSuccess={() => load()}
                    onClose={() => setShowUploadModal(false)}
                />
            )}
        </div>
    );
};
