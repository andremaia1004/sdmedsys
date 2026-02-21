'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Scroll, Activity, ClipboardList } from 'lucide-react';
import styles from '@/components/ui/Modal.module.css';

import { PrescriptionForm } from './forms/PrescriptionForm';
import { CertificateForm } from './forms/CertificateForm';
import { ExamRequestForm } from './forms/ExamRequestForm';
import { ReportForm } from './forms/ReportForm';
import { ReferralForm } from './forms/ReferralForm';

export type DocumentType = 'prescription' | 'certificate' | 'report' | 'referral' | 'exam_request';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    consultationId: string | null;
    patientName: string;
    items?: DocumentType[];
    initialType?: DocumentType;
    onSuccess?: () => void;
}

export function ClinicalDocumentModal({ isOpen, onClose, patientId, consultationId, patientName, items, initialType = 'prescription', onSuccess }: Props) {
    const [type, setType] = useState<DocumentType>(initialType);

    useEffect(() => {
        if (isOpen && initialType) setType(initialType);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialType]);

    if (!isOpen) return null;

    const handleSuccess = () => {
        if (onSuccess) onSuccess();
        onClose();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} style={{ maxWidth: '700px', width: '100%', display: 'flex', flexDirection: 'column', height: '90vh', maxHeight: '800px' }}>
                <div className={styles.header}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        {type === 'prescription' && <FileText size={20} />}
                        {type === 'certificate' && <Activity size={20} />}
                        {type === 'report' && <Scroll size={20} />}
                        {type === 'referral' && <FileText size={20} />}
                        {type === 'exam_request' && <ClipboardList size={20} />}
                        Novo Documento
                    </h3>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <div className={styles.body} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, overflow: 'hidden', paddingBottom: 0 }}>
                    {/* Type Selector (Tabs) */}
                    <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                        {[
                            { id: 'prescription', label: 'Receita', icon: FileText },
                            { id: 'certificate', label: 'Atestado', icon: Activity },
                            { id: 'report', label: 'Laudo', icon: Scroll },
                            { id: 'referral', label: 'Encaminhamento', icon: FileText },
                            { id: 'exam_request', label: 'Exames', icon: ClipboardList }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setType(t.id as DocumentType)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderBottom: type === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                                    color: type === t.id ? 'var(--primary)' : 'var(--text-muted)',
                                    fontWeight: type === t.id ? 600 : 400,
                                    background: 'none',
                                    borderTop: 'none',
                                    borderLeft: 'none',
                                    borderRight: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <t.icon size={16} />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Rendering the Selected Form */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        {type === 'prescription' && <PrescriptionForm patientId={patientId} consultationId={consultationId} patientName={patientName} onCancel={onClose} onSuccess={handleSuccess} />}
                        {type === 'certificate' && <CertificateForm patientId={patientId} consultationId={consultationId} patientName={patientName} onCancel={onClose} onSuccess={handleSuccess} />}
                        {type === 'exam_request' && <ExamRequestForm patientId={patientId} consultationId={consultationId} patientName={patientName} onCancel={onClose} onSuccess={handleSuccess} />}
                        {type === 'report' && <ReportForm patientId={patientId} consultationId={consultationId} patientName={patientName} onCancel={onClose} onSuccess={handleSuccess} />}
                        {type === 'referral' && <ReferralForm patientId={patientId} consultationId={consultationId} patientName={patientName} onCancel={onClose} onSuccess={handleSuccess} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
