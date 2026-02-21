'use client';

import React, { useState } from 'react';
import { generatePrescriptionAction } from '@/features/documents/actions';
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

export function PrescriptionForm({ patientId, consultationId, patientName, onCancel, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [medications, setMedications] = useState('');
    const [instructions, setInstructions] = useState('');
    const { showToast } = useToast();

    const handleGenerate = async () => {
        if (!medications.trim()) { showToast('warning', 'Preencha os medicamentos'); return; }

        setLoading(true);
        const res = await generatePrescriptionAction(patientId, consultationId, medications, instructions);
        setLoading(false);

        if (res.success && res.data) {
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${res.data}`;
            link.download = `prescription-${patientName}-${new Date().toISOString().split('T')[0]}.pdf`;
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Medicamentos</label>
                    <textarea
                        value={medications}
                        onChange={e => setMedications(e.target.value)}
                        placeholder="Ex: Amoxicilina 875mg 1 cp 12/12h..."
                        style={{ width: '100%', height: '150px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Instruções (Opcional)</label>
                    <textarea
                        value={instructions}
                        onChange={e => setInstructions(e.target.value)}
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
