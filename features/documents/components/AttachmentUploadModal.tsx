'use client';

import React, { useState } from 'react';
import { AttachmentCategory } from '@/features/documents/service.attachments';
import { createAttachmentRecordAction } from '@/features/documents/attachment_actions';
import styles from './PatientAttachments.module.css';

interface Props {
    patientId: string;
    role: string;
    onSuccess: () => void;
    onClose: () => void;
}

export const AttachmentUploadModal: React.FC<Props> = ({ patientId, role, onSuccess, onClose }) => {
    const [fileName, setFileName] = useState('');
    const [category, setCategory] = useState<AttachmentCategory>('ADMIN');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSecretary = role === 'SECRETARY';

    // Secretary is forced to ADMIN
    const finalCategory = isSecretary ? 'ADMIN' : category;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileName.trim()) return;

        setIsUploading(true);
        setError(null);

        try {
            // Simulate Storage Upload
            const simulatedPath = `https://storage.sdmed.com/attachments/${patientId}/${Date.now()}_${fileName}`;
            const simulatedType = fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

            const result = await createAttachmentRecordAction(
                patientId,
                finalCategory,
                fileName,
                simulatedPath,
                simulatedType
            );

            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.error || 'Erro ao salvar anexo');
            }
        } catch (err) {
            setError('Erro inesperado durante o upload');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3>Novo Anexo</h3>
                    <button onClick={onClose} className={styles.closeBtn}>×</button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formField}>
                        <label>Nome do Arquivo / Descrição</label>
                        <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder="Ex: Identidade Frontal, Exame de Sangue..."
                            required
                        />
                    </div>

                    <div className={styles.formField}>
                        <label>Categoria</label>
                        <select
                            value={finalCategory}
                            onChange={(e) => setCategory(e.target.value as AttachmentCategory)}
                            disabled={isSecretary}
                        >
                            <option value="ADMIN">📂 Administrativo (RG, CPF, Convênio)</option>
                            {!isSecretary && <option value="CLINICAL">🏥 Clínico (Laudos, Exames, Receitas Externas)</option>}
                        </select>
                        {isSecretary && <p className={styles.fieldHint}>Secretários podem apenas adicionar anexos administrativos.</p>}
                    </div>

                    {error && <div className={styles.errorMsg}>{error}</div>}

                    <div className={styles.formActions}>
                        <button type="button" onClick={onClose} disabled={isUploading} className={styles.cancelBtn}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={isUploading || !fileName.trim()} className={styles.submitBtn}>
                            {isUploading ? 'Salvando...' : 'Confirmar Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
