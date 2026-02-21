'use client';

import React, { useState } from 'react';
import { generateExamRequestAction } from '@/features/documents/actions';
import { Loader2, Download } from 'lucide-react';
import styles from '@/components/ui/Modal.module.css';
import { useToast } from '@/components/ui/Toast';

interface Props {
    patientId: string;
    consultationId: string | null;
    patientName: string;
    onCancel: () => void;
    onSuccess: () => void;
}

export function ExamRequestForm({ patientId, consultationId, patientName, onCancel, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [examList, setExamList] = useState('');
    const [justification, setJustification] = useState('');
    const { showToast } = useToast();

    const handleGenerate = async () => {
        if (!examList.trim()) { showToast('warning', 'Preencha a lista de exames'); return; }

        setLoading(true);
        const res = await generateExamRequestAction(patientId, consultationId, examList, justification);
        setLoading(false);

        if (res.success && res.data) {
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${res.data}`;
            link.download = `exam_request-${patientName}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast('success', 'Documento gerado com sucesso!');
            onSuccess();
        } else {
            showToast('error', res.error || 'Erro ao gerar documento.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Exames Solicitados</label>
                    <textarea
                        value={examList}
                        onChange={e => setExamList(e.target.value)}
                        placeholder="Ex: Hemograma completo\nCreatinina\nUrina I..."
                        style={{ width: '100%', height: '150px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Justificativa / Indicação Clínica</label>
                    <textarea
                        value={justification}
                        onChange={e => setJustification(e.target.value)}
                        placeholder="Ex: Suspeita clínica de infecção..."
                        style={{ width: '100%', height: '80px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>
            </div>

            <div className={styles.footer} style={{ marginTop: '1.5rem', padding: '1.5rem 0 0 0', borderTop: '1px solid #e2e8f0' }}>
                <button onClick={onCancel} className={styles.secondaryBtn} disabled={loading}>
                    Cancelar
                </button>
                <button
                    onClick={handleGenerate}
                    className={styles.primaryBtn}
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                    Gerar PDF
                </button>
            </div>
        </div>
    );
}
