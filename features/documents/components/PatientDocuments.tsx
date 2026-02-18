'use client';

import React, { useEffect, useState } from 'react';
import { fetchPatientDocumentsAction } from '../actions';
import { ClinicalDocument } from '../types';
import { LoadingState, EmptyState } from '@/features/patients/components/TabStates';
import { ClinicalDocumentModal, DocumentType } from './ClinicalDocumentModal';
import styles from './PatientDocuments.module.css';

interface Props {
    patientId: string;
    patientName: string;
    activeConsultationId?: string;
}

export const PatientDocuments: React.FC<Props> = ({ patientId, patientName, activeConsultationId }) => {
    const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<DocumentType>('prescription');

    const load = React.useCallback(async () => {
        try {
            const data = await fetchPatientDocumentsAction(patientId);
            setDocuments(data);
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        load();
    }, [load]);

    const handleOpenModal = (type: DocumentType = 'prescription') => {
        setModalType(type);
        setShowModal(true);
    };

    const NewDocumentButton = () => (
        <div className={styles.ctaContainer}>
            {activeConsultationId ? (
                <a
                    href="#"
                    className={styles.newDocBtn}
                    onClick={(e) => {
                        e.preventDefault();
                        handleOpenModal();
                    }}
                >
                    ➕ Novo Documento
                </a>
            ) : (
                <button
                    className={`${styles.newDocBtn} ${styles.disabled}`}
                    disabled
                    title="Inicie uma consulta para emitir documento"
                >
                    ➕ Novo Documento
                </button>
            )}
        </div>
    );

    if (loading) return <LoadingState message="Carregando histórico..." />;

    // Empty State with Modal Logic
    if (documents.length === 0) return (
        <>
            <EmptyState
                message="Nenhum documento emitido para este paciente."
                action={<NewDocumentButton />}
            />
            {showModal && (
                <ClinicalDocumentModal
                    isOpen={showModal}
                    onClose={() => { setShowModal(false); }}
                    patientId={patientId}
                    consultationId={activeConsultationId || null}
                    patientName={patientName}
                    initialType={modalType}
                    onSuccess={load}
                />
            )}
        </>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Histórico de Documentos</h3>
                <NewDocumentButton />
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Data Emissão</th>
                        <th>Médico</th>
                        <th>Detalhes</th>
                    </tr>
                </thead>
                <tbody>
                    {documents.map((doc) => (
                        <tr key={doc.id}>
                            <td className={styles.type}>
                                {doc.type === 'prescription' ? '💊 Receita' :
                                    doc.type === 'certificate' ? '📜 Atestado' : '📄 Laudo'}
                            </td>
                            <td>{new Date(doc.issuedAt).toLocaleString('pt-BR')}</td>
                            <td>{doc.doctorName}</td>
                            <td>
                                {doc.type === 'certificate' && (doc.meta as { days?: number; cid?: string })?.days && (
                                    <span>{(doc.meta as { days: number }).days} dia(s) {(doc.meta as { cid?: string }).cid ? `- CID: ${(doc.meta as { cid: string }).cid}` : ''}</span>
                                )}
                                {doc.type === 'prescription' && (doc.meta as { observations?: string })?.observations && (
                                    <span className={styles.obs}>{(doc.meta as { observations: string }).observations}</span>
                                )}
                                {doc.type === 'report' && (
                                    <span className={styles.obs}>Laudo Médico Estruturado</span>
                                )}
                            </td>
                            <td>
                                <a
                                    href={`/api/documents/${doc.type}/${doc.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.downloadBtn}
                                >
                                    ⬇️ Baixar
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <ClinicalDocumentModal
                    isOpen={showModal}
                    onClose={() => { setShowModal(false); }}
                    patientId={patientId}
                    consultationId={activeConsultationId || null}
                    patientName={patientName}
                    initialType={modalType}
                    onSuccess={load}
                />
            )}
        </div>
    );
};
