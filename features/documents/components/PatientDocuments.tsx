'use client';

import React, { useEffect, useState } from 'react';
import { fetchPatientDocumentsAction } from '../actions';
import { ClinicalDocument } from '../types';
import styles from './PatientDocuments.module.css';

interface Props {
    patientId: string;
}

export const PatientDocuments: React.FC<Props> = ({ patientId }) => {
    const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchPatientDocumentsAction(patientId);
                setDocuments(data);
            } catch (error) {
                console.error('Failed to load documents:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [patientId]);

    if (loading) return <div className={styles.loading}>Carregando histórico...</div>;
    if (documents.length === 0) return <div className={styles.empty}>Nenhum documento emitido para este paciente.</div>;

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Histórico de Documentos</h3>
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
                                {doc.type === 'prescription' ? '💊 Receita' : '📜 Atestado'}
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
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
