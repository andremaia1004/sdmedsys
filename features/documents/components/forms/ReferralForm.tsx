'use client';

import React, { useState } from 'react';
import { generateReferralAction } from '@/features/documents/actions';
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

export function ReferralForm({ patientId, consultationId, patientName, onCancel, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [specialty, setSpecialty] = useState('');
    const [reason, setReason] = useState('');
    const [clinicalSummary, setClinicalSummary] = useState('');
    const [referralObservation, setReferralObservation] = useState('');
    const { showToast } = useToast();

    const handleGenerate = async () => {
        if (!specialty.trim() || !reason.trim() || !clinicalSummary.trim()) {
            showToast('warning', 'Preencha a especialidade, motivo e resumo clínico');
            return;
        }

        setLoading(true);
        const res = await generateReferralAction(patientId, consultationId, specialty, reason, clinicalSummary, referralObservation);
        setLoading(false);

        if (res.success && res.data) {
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${res.data}`;
            link.download = `referral-${patientName}-${new Date().toISOString().split('T')[0]}.pdf`;
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Especialidade / Profissional Destino</label>
                    <input
                        type="text"
                        value={specialty}
                        onChange={e => setSpecialty(e.target.value)}
                        placeholder="Ex: Cardiologista, Fisioterapeuta..."
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Motivo / Indicação</label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Ex: Avaliação cardiológica pré-operatória..."
                        style={{ width: '100%', height: '80px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Resumo Clínico</label>
                    <textarea
                        value={clinicalSummary}
                        onChange={e => setClinicalSummary(e.target.value)}
                        placeholder="Descreva brevemente o histórico e quadro atual..."
                        style={{ width: '100%', height: '120px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Observações (Opcional)</label>
                    <textarea
                        value={referralObservation}
                        onChange={e => setReferralObservation(e.target.value)}
                        placeholder="Ex: Seguem exames laboratoriais em anexo..."
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
